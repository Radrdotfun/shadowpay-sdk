/**
 * @shadowpay/client
 * Browser SDK for ShadowPay - accept private payments on Solana
 */

// Main client
export { ShadowPay } from './ShadowPayClient';

// Types
export type {
  ShadowPayOptions,
  PaymentOptions,
  PaymentResult,
  Settlement,
  StoredKeys,
  PaymentHistory,
} from './types';

// Proof generation
export {
  generateProof,
  verifyProof,
  ProofGenerationError,
} from './proof-generator';

export type { ProofInputs, GeneratedProof } from './proof-generator';

// API client
export { ShadowPayAPI, ShadowPayError } from './api-client';

export type {
  AuthorizeRequest,
  AuthorizeResponse,
  SettleRequest,
  SettleResponse,
  AccessVerificationResponse,
  MerkleProofResponse,
} from './api-client';

// Wallet utilities
export {
  detectWallet,
  getPublicKey,
  signTransaction,
  isWalletConnected,
  getWalletName,
  WalletError,
} from './wallet-adapter';

export type { WalletInterface } from './wallet-adapter';

// Re-export core types for convenience
export type {
  TokenType,
  NetworkType,
  ElGamalKeypair,
  EncryptedAmount,
  PaymentProof,
} from '@shadowpay/core';

