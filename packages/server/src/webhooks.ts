/**
 * Webhook handler with HMAC signature verification
 * Validates incoming webhooks from ShadowPay backend
 */

import crypto from 'crypto';
import type { Request, Response } from 'express';
import type { WebhookEvent, WebhookHandler } from './types';

/**
 * Verify webhook signature using HMAC-SHA256
 * 
 * @param body - Raw request body
 * @param signature - Signature from X-SHADOWPAY-SIGNATURE header
 * @param secret - Webhook secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  body: any,
  signature: string,
  secret: string
): boolean {
  try {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    
    const expected = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');
    
    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Create webhook handler middleware
 * 
 * @param webhookSecret - Webhook secret for signature verification
 * @param callback - User's webhook handler function
 * @returns Express handler
 */
export function createWebhookHandler(
  webhookSecret: string | undefined,
  callback: WebhookHandler
) {
  return async (req: Request, res: Response) => {
    // Verify webhook signature if secret is provided
    if (webhookSecret) {
      const signature = req.headers['x-shadowpay-signature'] as string | undefined;
      
      if (!signature) {
        return res.status(401).json({
          error: 'Missing signature',
          message: 'X-SHADOWPAY-SIGNATURE header is required',
        });
      }
      
      const body = req.body;
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      
      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid signature',
          message: 'Webhook signature verification failed',
        });
      }
    }
    
    // Parse webhook event
    try {
      const event: WebhookEvent = req.body;
      
      // Call user's callback
      await callback(event);
      
      return res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      return res.status(500).json({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * Validate webhook event structure
 * 
 * @param event - Webhook event to validate
 * @returns True if event is valid
 */
export function validateWebhookEvent(event: any): event is WebhookEvent {
  if (!event || typeof event !== 'object') return false;
  
  if (!['payment.success', 'payment.failed', 'payment.refunded'].includes(event.type)) {
    return false;
  }
  
  if (!event.data || typeof event.data !== 'object') return false;
  
  const requiredFields = ['tx_hash', 'amount', 'token', 'recipient', 'nullifier', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in event.data)) return false;
  }
  
  return true;
}

