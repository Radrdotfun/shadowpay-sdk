/**
 * Client-specific types for ShadowPay SDK
 */

import type { WalletInterface } from './wallet-adapter';

export interface ShadowPayOptions {
  merchantKey: string; // ✅ Merchant's API key (e.g., 2hTKeADLwNZPeU5MeFcNKV4ttfWtpBUSEMiRVf4jRyjC)
  merchantWallet: string; // ✅ Merchant's wallet address (e.g., BdDcNpsjGKdabkX1xo6XhYhUsJtADYnUT5hPmW5AoLFi)
  apiUrl?: string; // Shadow API base URL (defaults to https://shadow.radr.fun)
}

export interface Settlement {
  signature: string; // Transaction signature
  settlementTime: number; // Unix timestamp of settlement
}

export interface PaymentOptions {
  amount: number; // Human-readable amount (e.g., 0.001 SOL)
  token?: string; // Token symbol (default: 'SOL')
  wallet: WalletInterface; // Solana wallet adapter
  onProofComplete?: (settlement: Settlement) => void; // Callback when proof completes
}

export interface PaymentResult {
  accessToken: string; // Access token for instant access
  commitment: string; // Payment commitment
  status: 'authorized' | 'settling' | 'settled'; // Payment status
  proofPending: boolean; // Is proof still generating?
  settlement?: Settlement; // Settlement info (when complete)
}

export interface StoredKeys {
  privateKey: string;
  publicKey: {
    x: string;
    y: string;
  };
  createdAt: number;
}

export interface PaymentHistory {
  timestamp: number;
  amount: number;
  token: string;
  recipient: string;
  signature: string;
  nullifier: string;
}

