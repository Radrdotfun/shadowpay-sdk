/**
 * Main ShadowPay client SDK for browser
 * Instant access model: User gets access in 100-200ms, ZK proof generates in background
 */

import {
  generateElGamalKeypair,
  encryptAmount,
  parseAmount,
  STORAGE_KEYS,
  API_URL,
  generateRandomSecret,
  generateRandomSalt,
  addressToFieldElement,
  computePaymentCommitment,
  computePaymentNullifier,
} from '@shadowpay/core';
import type { ElGamalKeypair } from '@shadowpay/core';
import { generateProof } from './proof-generator';
import { ShadowPayAPI, type AuthorizeResponse } from './api-client';
import { detectWallet, getPublicKey, isWalletConnected } from './wallet-adapter';
import type { 
  ShadowPayOptions, 
  PaymentOptions, 
  PaymentResult,
  Settlement,
  StoredKeys,
  PaymentHistory,
} from './types';

/**
 * ShadowPay client for making instant private payments
 * 
 * @example
 * ```typescript
 * const shadowpay = new ShadowPay({
 *   merchantKey: '2hTKeADLwNZPeU5MeFcNKV4ttfWtpBUSEMiRVf4jRyjC', // Your API key
 *   merchantWallet: 'BdDcNpsjGKdabkX1xo6XhYhUsJtADYnUT5hPmW5AoLFi', // Your receiving wallet
 * });
 * 
 * const payment = await shadowpay.pay({
 *   amount: 0.001,
 *   token: 'SOL',
 *   wallet: phantomWallet,
 *   onProofComplete: (settlement) => {
 *     console.log('Settlement complete:', settlement.signature);
 *   },
 * });
 * 
 * // User gets instant access in 100-200ms!
 * console.log('Access token:', payment.accessToken);
 * console.log('Proof pending:', payment.proofPending); // true
 * ```
 */
export class ShadowPay {
  private merchantKey: string;
  private merchantWallet: string;
  private apiUrl: string;
  private api: ShadowPayAPI;
  
  constructor(options: ShadowPayOptions) {
    this.merchantKey = options.merchantKey;
    this.merchantWallet = options.merchantWallet;
    this.apiUrl = options.apiUrl || API_URL;
    this.api = new ShadowPayAPI(this.apiUrl);
  }
  
  /**
   * Auto-register user's wallet in ShadowID tree (one-time, on first connect)
   * Backend handles if already registered
   * 
   * @param wallet - Solana wallet adapter
   * @returns User's commitment in the ShadowID tree
   */
  private async autoRegisterWallet(wallet: any): Promise<string> {
    const walletAddress = getPublicKey(wallet);
    
    try {
      console.log('🔐 Ensuring ShadowID registration...');
      
      // Auto-register (backend handles if already registered)
      const registerResponse = await fetch(
        `${this.apiUrl}/shadowpay/api/shadowid/auto-register`, // ✅ Correct path
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: walletAddress
          })
        }
      );
      
      if (!registerResponse.ok) {
        const error = await registerResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to register with ShadowID: ${error.error || registerResponse.statusText}`);
      }
      
      const result = await registerResponse.json();
      
      if (result.registered) {
        console.log('✅ Wallet registered in ShadowID tree');
        console.log(`   Commitment: ${result.commitment.substring(0, 16)}...`);
        console.log(`   Root: ${result.root.substring(0, 16)}...`);
      }
      
      return result.commitment;
    } catch (error) {
      console.error('❌ ShadowID registration failed:', error);
      throw error;
    }
  }
  
  /**
   * Make instant payment (100-200ms, user gets access immediately!)
   * ZK proof generated in background (non-blocking)
   * 
   * @param options - Payment options (amount, token, wallet, callback)
   * @returns Payment result with access token (instant!)
   */
  async pay(options: PaymentOptions): Promise<PaymentResult> {
    try {
      console.log('💰 Starting instant payment flow...');
      
      // Validate inputs
      this.validatePaymentOptions(options);
      
      const token = options.token?.toUpperCase() || 'SOL';
      
      // 1. Check wallet connection
      const wallet = detectWallet(options.wallet);
      if (!wallet || !isWalletConnected(wallet)) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      const userWallet = getPublicKey(wallet);
      console.log('💰 User wallet:', userWallet);
      
      const senderCommitmentHex = await this.autoRegisterWallet(wallet);
      console.log('✅ Using registered ShadowID commitment:', senderCommitmentHex.substring(0, 20) + '...');
      
      // 2. Convert amount to lamports
      const lamports = parseAmount(options.amount, token);
      console.log('💵 Amount:', options.amount, token, '=', lamports, 'lamports');
      
      console.log('🔐 Generating cryptographic commitments...');
      const senderSecret = generateRandomSecret();
      const salt = generateRandomSalt();
      const receiverCommitment = addressToFieldElement(this.merchantWallet);
      const paymentCommitment = await computePaymentCommitment(
        senderCommitmentHex,
        receiverCommitment,
        BigInt(lamports),
        token,
        salt
      );
      const paymentNullifier = await computePaymentNullifier(
        senderSecret,
        paymentCommitment
      );
      
      console.log('✅ Crypto values generated:', {
        senderCommitment: senderCommitmentHex.substring(0, 20) + '...',
        paymentCommitment: paymentCommitment.substring(0, 20) + '...',
        paymentNullifier: paymentNullifier.substring(0, 20) + '...',
      });
      
      console.log('🔍 Authorizing payment...');
      const auth = await this.api.authorize({
        apiKey: this.merchantKey,
        userWallet,
        merchantWallet: this.merchantWallet,
        amount: lamports,
        paymentCommitment,
        paymentNullifier,
      });
      
      console.log('✅ Payment authorized!');
      
      const result: PaymentResult = {
        accessToken: auth.access_token,
        commitment: auth.commitment,
        status: 'authorized',
        proofPending: true,
      };
      
      console.log('🔐 Generating ZK proof in background...');
      
      this.generateAndSubmitProof({
        auth,
        senderSecret,
        senderCommitment: senderCommitmentHex,
        receiverCommitment,
        paymentCommitment,
        paymentNullifier,
        salt,
        lamports,
        token,
      })
        .then(settlement => {
          console.log('✅ Settlement complete:', settlement.signature);
          result.status = 'settled';
          result.proofPending = false;
          result.settlement = settlement;
          
          // Store in history
          this.savePaymentHistory({
            timestamp: Date.now(),
            amount: options.amount,
            token,
            recipient: this.merchantKey,
            signature: settlement.signature,
            nullifier: auth.nullifier,
          });
          
          // Callback if provided
          options.onProofComplete?.(settlement);
        })
        .catch(error => {
          console.error('❌ Background proof generation failed:', error);
          result.status = 'authorized';
          result.proofPending = false;
        });
      
      return result;
    } catch (error) {
      console.error('❌ Payment failed:', error);
      throw error;
    }
  }
  
  private async generateAndSubmitProof(params: {
    auth: AuthorizeResponse;
    senderSecret: string;
    senderCommitment: string;
    receiverCommitment: string;
    paymentCommitment: string;
    paymentNullifier: string;
    salt: string;
    lamports: number;
    token: string;
  }): Promise<Settlement> {
    try {
      const userKeys = this.getOrCreateKeys();
      const encrypted = encryptAmount(BigInt(params.lamports), userKeys.publicKey);
      
      console.log('   📋 Fetching merkle proof...');
      const merkleProof = await this.api.getMerkleProof(params.senderCommitment);
      console.log('   ✅ Merkle proof received');
      
      console.log('   ⏳ Generating ZK proof...');
      const { proof, publicSignals } = await generateProof({
        senderCommitment: params.senderCommitment,
        senderSecret: params.senderSecret,
        receiverCommitment: params.receiverCommitment,
        amount: BigInt(params.lamports),
        tokenMint: params.token,
        salt: params.salt,
        merklePath: merkleProof.siblings,
        pathIndices: merkleProof.pathIndices,
        encryptedC1: encrypted.c1.x,
        encryptedC2: encrypted.c2.x,
        elgamalRandomness: '0x' + '00'.repeat(32),
        shadowidRoot: merkleProof.root,
        maxAmount: BigInt(params.lamports) * 2n,
        receiverElGamalPubkey: userKeys.publicKey.x,
      });
      
      console.log('   ✅ Proof generated');
      console.log('   📤 Submitting settlement...');
      const settlement = await this.api.settle({
        commitment: params.paymentCommitment,
        proof: JSON.stringify(proof),
        publicSignals: publicSignals.map(s => s.toString()),
        encryptedAmount: encrypted,
      });
      
      if (!settlement.success) {
        throw new Error(settlement.error || 'Settlement failed');
      }
      
      console.log('   ✅ Settled:', settlement.signature);
      
      return {
        signature: settlement.signature!,
        settlementTime: settlement.settlement_time,
      };
    } catch (error) {
      console.error('Background settlement error:', error);
      throw error;
    }
  }
  
  private getOrCreateKeys(): ElGamalKeypair {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage not available. ShadowPay requires browser environment.');
    }
    
    const stored = localStorage.getItem(STORAGE_KEYS.ELGAMAL_KEYS);
    
    if (stored) {
      try {
        const parsed: StoredKeys = JSON.parse(stored);
        return {
          privateKey: parsed.privateKey,
          publicKey: parsed.publicKey,
        };
      } catch (error) {
        console.warn('Failed to parse stored keys, generating new ones');
      }
    }
    
    const keys = generateElGamalKeypair();
    
    const storedKeys: StoredKeys = {
      privateKey: keys.privateKey,
      publicKey: keys.publicKey,
      createdAt: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEYS.ELGAMAL_KEYS, JSON.stringify(storedKeys));
    return keys;
  }
  
  private validatePaymentOptions(options: PaymentOptions): void {
    if (!options.amount || options.amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }
    
    if (!options.wallet) {
      throw new Error('Wallet is required');
    }
    
    const token = options.token?.toUpperCase() || 'SOL';
    if (!['SOL', 'USDC', 'USDT'].includes(token)) {
      throw new Error(`Unsupported token: ${token}. Supported: SOL, USDC, USDT`);
    }
  }
  
  private savePaymentHistory(payment: PaymentHistory): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return; // Skip if not in browser
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENT_HISTORY);
      const history: PaymentHistory[] = stored ? JSON.parse(stored) : [];
      
      history.push(payment);
      
      if (history.length > 100) {
        history.shift();
      }
      
      localStorage.setItem(STORAGE_KEYS.PAYMENT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save payment history:', error);
    }
  }
  
  getPaymentHistory(): PaymentHistory[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENT_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load payment history:', error);
      return [];
    }
  }
}
