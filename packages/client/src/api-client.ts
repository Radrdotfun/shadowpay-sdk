/**
 * API client for communicating with ShadowPay backend
 * Handles payment settlement, verification, and token queries
 */

import { API_URL } from '@shadowpay/core';
import type { X402PaymentRequirement } from '@shadowpay/core';

export interface SettlePaymentRequest {
  x402Version: number;
  paymentHeader: string; // Base64 encoded payment header
  paymentRequirements: X402PaymentRequirement;
  metadata?: Record<string, any>;
}

export interface SettlePaymentResponse {
  success: boolean;
  tx_hash: string; // Solana transaction signature
  message?: string;
}

export interface VerifyPaymentRequest {
  x402Version: number;
  paymentHeader: string;
  paymentRequirements: X402PaymentRequirement;
}

export interface VerifyPaymentResponse {
  isValid: boolean;
  message?: string;
}

export interface SupportedTokensResponse {
  tokens: Array<{
    symbol: string;
    mint: string;
    decimals: number;
  }>;
}

export interface AuthorizeRequest {
  apiKey: string; // Merchant's API key (for X-API-Key header)
  userWallet: string; // User's connected wallet
  merchantWallet: string; // Merchant's wallet address (receiver)
  amount: number; // Amount in lamports
  paymentCommitment: string; // Cryptographic payment commitment (hex)
  paymentNullifier: string; // Cryptographic payment nullifier (hex)
}

export interface AuthorizeResponse {
  commitment: string;
  nullifier: string;
  access_token: string;
  expires_at: number;
  proof_deadline: number;
}

export interface SettleRequest {
  commitment: string;
  proof: string;
  publicSignals: string[];
  encryptedAmount?: any;
}

export interface SettleResponse {
  success: boolean;
  signature?: string;
  settlement_time: number;
  error?: string;
}

export interface AccessVerificationResponse {
  authorized: boolean;
  reason: string;
  settlement_status: 'authorized' | 'settling' | 'settled';
  commitment?: string;
}

export interface MerchantKeyInfoResponse {
  api_key: string;
  rps_limit: number;
  daily_commit_limit: number;
  wallet_address: string; // ✅ Merchant's receiving wallet
  treasury_wallet: string;
}

export interface MerkleProofResponse {
  root: string; // Merkle root (hex)
  siblings: string[]; // Array of sibling hashes
  pathIndices: number[]; // Array of path indices
}

/**
 * Helper: Convert hex string to byte array
 * Ensures exactly 32 bytes (padding or truncating as needed)
 */
function hexToBytes(hex: string): number[] {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  // Pad to 64 hex chars (32 bytes) if needed
  const paddedHex = cleanHex.padStart(64, '0');
  
  // Take only first 64 hex chars (32 bytes)
  const truncatedHex = paddedHex.slice(0, 64);
  
  // Convert to byte array
  const bytes: number[] = [];
  for (let i = 0; i < truncatedHex.length; i += 2) {
    bytes.push(parseInt(truncatedHex.slice(i, i + 2), 16));
  }
  
  return bytes;
}

/**
 * API client for ShadowPay backend
 */
export class ShadowPayAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Authorize payment (instant balance check)
   * Returns access token immediately for instant access
   * 
   * Example:
   * POST /shadowpay/v1/payment/authorize
   * Headers: X-API-Key: 2hTKeADLwNZPeU5MeFcNKV4ttfWtpBUSEMiRVf4jRyjC
   * Body: { "user_wallet": "AVS...", "merchant": "BdD...", "amount": 1000000 }
   * 
   * @param params - Authorization parameters
   * @returns Authorization response with access token
   */
  async authorize(params: AuthorizeRequest): Promise<AuthorizeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shadowpay/v1/payment/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': params.apiKey, // ✅ Merchant's API key for authentication
        },
        body: JSON.stringify({
          user_wallet: params.userWallet, // ✅ User's connected wallet
          merchant: params.merchantWallet, // ✅ Merchant's receiving wallet
          amount: params.amount, // ✅ Amount in lamports
          payment_commitment: params.paymentCommitment, // ✅ Crypto commitment
          payment_nullifier: params.paymentNullifier, // ✅ Crypto nullifier
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Better error messages
        if (response.status === 401) {
          throw new ShadowPayError(
            'Invalid API key - please check your merchant API key',
            401,
            error
          );
        }
        
        throw new ShadowPayError(
          `Authorization failed: ${error.error || response.statusText}`,
          response.status,
          error
        );
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof ShadowPayError) {
        throw error;
      }
      throw new ShadowPayError(
        `Network error during authorization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }
  }
  
  /**
   * Verify access token (merchant side)
   * Checks if user is authorized to access content
   * 
   * @param accessToken - Access token from authorization
   * @returns Verification response with authorization status
   */
  async verifyAccess(accessToken: string): Promise<AccessVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shadowpay/v1/payment/verify-access`, {
        method: 'GET',
        headers: {
          'X-Access-Token': accessToken,
        },
      });
      
      if (!response.ok) {
        throw new ShadowPayError(
          'Access verification failed',
          response.status
        );
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof ShadowPayError) {
        throw error;
      }
      throw new ShadowPayError(
        `Network error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }
  }
  
  /**
   * Submit ZK proof for settlement (background)
   * Settles payment on-chain with zero-knowledge privacy
   * 
   * @param params - Settlement parameters with ZK proof
   * @returns Settlement response with transaction signature
   */
  async settle(params: SettleRequest): Promise<SettleResponse> {
    try {
      // Convert proof to base64 (backend expects base64, not JSON string)
      const proofBase64 = typeof window !== 'undefined' 
        ? btoa(params.proof) 
        : Buffer.from(params.proof).toString('base64');
      
      // Convert encrypted amount to 64-byte array: C1 (32 bytes) + C2 (32 bytes)
      // Backend expects Vec<u8> with ElGamal ciphertext
      let encryptedAmountBytes: number[] | null = null;
      if (params.encryptedAmount) {
        const { c1, c2 } = params.encryptedAmount;
        
        // Convert C1.x and C2.x to 32-byte arrays (compressed point representation)
        const c1Bytes = hexToBytes(c1.x);
        const c2Bytes = hexToBytes(c2.x);
        
        // Concatenate: 32 bytes C1 + 32 bytes C2 = 64 bytes total
        encryptedAmountBytes = [...c1Bytes, ...c2Bytes];
      }
      
      const response = await fetch(`${this.baseUrl}/shadowpay/v1/payment/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitment: params.commitment,
          proof: proofBase64, // ✅ Base64 encoded
          public_signals: params.publicSignals, // ✅ snake_case
          encrypted_amount: encryptedAmountBytes, // ✅ Array or null, not object
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ShadowPayError(
          `Settlement failed: ${error.error || response.statusText}`,
          response.status,
          error
        );
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof ShadowPayError) {
        throw error;
      }
      throw new ShadowPayError(
        `Network error during settlement: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }
  }
  
  /**
   * Get merkle proof for sender commitment
   * Required for generating ZK proof
   * 
   * @param senderCommitment - Sender's commitment (hex)
   * @returns Merkle proof with root, siblings, and path indices
   */
  async getMerkleProof(senderCommitment: string): Promise<MerkleProofResponse> {
    try {
      // Keep commitment in HEX format (merkle tree stores hex)
      // Remove 0x prefix if present
      let commitmentHex = senderCommitment;
      if (senderCommitment.startsWith('0x')) {
        commitmentHex = senderCommitment.substring(2);
      }
      
      const response = await fetch(
        `${this.baseUrl}/shadowpay/shadowid/v1/merkle/proof/${commitmentHex}`, // ✅ Pass as HEX (not decimal)
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Better error messages
        if (response.status === 404) {
          throw new ShadowPayError(
            'Commitment not found in merkle tree - user may need to register with ShadowID first',
            404,
            error
          );
        }
        
        throw new ShadowPayError(
          `Failed to get merkle proof: ${error.error || response.statusText}`,
          response.status,
          error
        );
      }
      
      const data = await response.json();
      
      // 🔧 Convert hex strings to decimal strings for snarkjs
      // Backend returns hex, but circuit needs decimal
      const root = BigInt('0x' + data.root).toString();
      const siblings = data.siblings.map((hex: string) => BigInt('0x' + hex).toString());
      
      return {
        root: root,
        siblings: siblings,
        pathIndices: data.pathIndices
      };
    } catch (error) {
      if (error instanceof ShadowPayError) {
        throw error;
      }
      throw new ShadowPayError(
        `Network error getting merkle proof: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }
  }
}

/**
 * Custom error class for ShadowPay API errors
 */
export class ShadowPayError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ShadowPayError';
  }
}

