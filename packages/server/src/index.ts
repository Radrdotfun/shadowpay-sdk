/**
 * @shadowpay/server
 * Node.js SDK for ShadowPay - accept private payments on Solana
 */

// Main server SDK
export { ShadowPay } from './ShadowPayServer';

// Types
export type {
  ServerOptions,
  PaymentRequirement,
  ShadowPayRequest,
  WebhookEvent,
  WebhookHandler,
  VerificationResult,
} from './types';

// Middleware utilities
export { createPaymentMiddleware, parsePaymentHeader } from './middleware';

// Webhook utilities
export {
  createWebhookHandler,
  verifyWebhookSignature,
  validateWebhookEvent,
} from './webhooks';

// API Key Generation
export {
  generateMerchantKey,
} from './generate-key';

export type {
  GenerateKeyRequest,
  GenerateKeyResponse,
} from './generate-key';

// Re-export core types for convenience
export type {
  TokenType,
  NetworkType,
  X402PaymentRequirement,
  X402Response,
} from '@shadowpay/core';

