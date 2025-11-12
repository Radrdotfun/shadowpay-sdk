/**
 * Core types for ShadowPay SDK
 */

export interface ElGamalKeypair {
  privateKey: string; // Hex string
  publicKey: {
    x: string; // Hex string
    y: string; // Hex string
  };
}

export interface EncryptedAmount {
  c1: { x: string; y: string }; // Randomness point (rG)
  c2: { x: string; y: string }; // Encrypted amount (M + rP)
}

export interface PaymentProof {
  proof: any; // Groth16 proof (pi_a, pi_b, pi_c)
  publicSignals: string[]; // Public inputs to the circuit
}

export interface PaymentMetadata {
  amount: number;
  token: string;
  recipient: string;
  timestamp: number;
  nullifier: string;
  commitment: string;
}

export type TokenType = 'SOL' | 'USDC' | 'USDT';

export type NetworkType = 'mainnet-beta' | 'devnet';

export interface PaymentCommitment {
  value: string; // Hex string
  amount: number;
  recipient: string;
  token: string;
  nonce: string;
}

export interface Nullifier {
  value: string; // Hex string
  userSecret: string;
  commitment: string;
  index: number;
}

export interface X402PaymentHeader {
  x402Version: number;
  scheme: string;
  network: string;
  payload: any;
}

export interface X402PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource?: string;
  description?: string;
  mimeType?: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  extra?: Record<string, any>;
}

export interface X402Response {
  x402Version: number;
  accepts: X402PaymentRequirement[];
}

