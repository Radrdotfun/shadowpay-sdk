/**
 * Server-specific types for ShadowPay SDK
 */

import type { Request } from 'express';

export interface ServerOptions {
  apiKey: string;
  webhookSecret?: string;
  apiUrl?: string;
}

export interface PaymentRequirement {
  amount: number;
  token?: string;
  description?: string;
}

export interface ShadowPayRequest extends Request {
  shadowpay?: {
    verified: boolean;
    amount?: number;
    token?: string;
    nullifier?: string;
  };
}

export interface WebhookEvent {
  type: 'payment.success' | 'payment.failed' | 'payment.refunded';
  data: {
    tx_hash: string;
    amount: number;
    token: string;
    recipient: string;
    nullifier: string;
    timestamp: number;
  };
  timestamp: number;
  signature?: string;
}

export type WebhookHandler = (event: WebhookEvent) => void | Promise<void>;

export interface VerificationResult {
  isValid: boolean;
  amount?: number;
  token?: string;
  nullifier?: string;
  message?: string;
}

