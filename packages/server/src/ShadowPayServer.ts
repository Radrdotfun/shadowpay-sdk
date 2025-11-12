/**
 * Main ShadowPay server SDK for Node.js
 * Simplifies payment verification and webhook handling
 */

import { API_URL, ENDPOINTS } from '@shadowpay/core';
import { createPaymentMiddleware } from './middleware';
import { createWebhookHandler } from './webhooks';
import type { 
  ServerOptions, 
  PaymentRequirement, 
  WebhookHandler,
  VerificationResult,
} from './types';

/**
 * ShadowPay server SDK
 * 
 * @example
 * ```typescript
 * const shadowpay = new ShadowPay({
 *   apiKey: process.env.SHADOWPAY_API_KEY,
 *   webhookSecret: process.env.SHADOWPAY_WEBHOOK_SECRET,
 * });
 * 
 * app.get('/premium',
 *   shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
 *   (req, res) => res.json({ secret: 'data' })
 * );
 * ```
 */
export class ShadowPay {
  private apiKey: string;
  private webhookSecret?: string;
  private apiUrl: string;
  
  constructor(options: ServerOptions) {
    this.apiKey = options.apiKey;
    this.webhookSecret = options.webhookSecret;
    this.apiUrl = options.apiUrl || API_URL;
  }
  
  /**
   * Express middleware to protect routes with payment
   * Returns 402 if payment is missing or invalid
   * 
   * @param requirement - Payment requirements
   * @returns Express middleware
   */
  requirePayment(requirement: PaymentRequirement) {
    return createPaymentMiddleware(
      requirement,
      this.apiKey,
      this.verifyPayment.bind(this)
    );
  }
  
  /**
   * Verify a payment proof
   * Calls ShadowPay API to verify the proof
   * 
   * @param header - Payment header from X-PAYMENT
   * @param requirement - Payment requirements
   * @returns True if payment is valid
   */
  async verifyPayment(
    header: string,
    requirement: PaymentRequirement
  ): Promise<boolean> {
    try {
      const result = await this.verifyPaymentDetailed(header, requirement);
      return result.isValid;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }
  
  /**
   * Verify a payment with detailed result
   * 
   * @param header - Payment header from X-PAYMENT
   * @param requirement - Payment requirements
   * @returns Verification result with details
   */
  async verifyPaymentDetailed(
    header: string,
    requirement: PaymentRequirement
  ): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.apiUrl}${ENDPOINTS.verify}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          x402Version: 1,
          paymentHeader: header,
          paymentRequirements: {
            scheme: 'zkproof',
            network: 'solana-mainnet',
            maxAmountRequired: requirement.amount.toString(),
            payTo: this.apiKey,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
        return {
          isValid: false,
          message: error.error || response.statusText,
        };
      }
      
      const result = await response.json() as {
        isValid: boolean;
        amount?: number;
        token?: string;
        nullifier?: string;
      };
      return {
        isValid: result.isValid,
        amount: result.amount,
        token: result.token,
        nullifier: result.nullifier,
      };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Webhook handler
   * Provides handler function with signature verification
   * 
   * @example
   * ```typescript
   * app.post('/webhooks/shadowpay',
   *   express.raw({ type: 'application/json' }),
   *   shadowpay.webhooks.handler((event) => {
   *     if (event.type === 'payment.success') {
   *       console.log('Payment received:', event.data);
   *     }
   *   })
   * );
   * ```
   */
  get webhooks() {
    return {
      handler: (callback: WebhookHandler) => {
        return createWebhookHandler(this.webhookSecret, callback);
      },
    };
  }
  
  /**
   * Generate a new API key
   * 
   * @param walletAddress - Solana wallet address
   * @returns New API key
   */
  async generateApiKey(walletAddress: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}${ENDPOINTS.newKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate API key: ${response.statusText}`);
      }
      
      const result = await response.json() as { api_key: string };
      return result.api_key;
    } catch (error) {
      throw new Error(
        `API key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

