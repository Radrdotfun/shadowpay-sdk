/**
 * Express middleware for payment protection
 * Returns 402 Payment Required if payment is missing or invalid
 */

import type { Request, Response, NextFunction } from 'express';
import { X402_VERSION, PAYMENT_SCHEME } from '@shadowpay/core';
import type { PaymentRequirement, ShadowPayRequest } from './types';

/**
 * Create payment middleware
 * 
 * @param requirement - Payment requirements (amount, token, description)
 * @param apiKey - Merchant API key
 * @param verifyFn - Function to verify payment
 * @returns Express middleware
 */
export function createPaymentMiddleware(
  requirement: PaymentRequirement,
  apiKey: string,
  verifyFn: (header: string, requirement: PaymentRequirement) => Promise<boolean>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check for X-PAYMENT header
    const paymentHeader = req.headers['x-payment'] as string | undefined;
    
    if (!paymentHeader) {
      // Return 402 Payment Required with payment requirements
      return res.status(402).json({
        x402Version: X402_VERSION,
        accepts: [{
          scheme: PAYMENT_SCHEME,
          network: 'solana-mainnet',
          maxAmountRequired: requirement.amount.toString(),
          resource: req.path,
          description: requirement.description || 'Payment required',
          mimeType: 'application/json',
          payTo: apiKey,
          maxTimeoutSeconds: 300,
          extra: {
            zkCircuit: 'shadowpay-elgamal-v3',
            privacyFeatures: ['zero-knowledge proofs', 'encrypted amounts'],
            facilitatorUrl: 'https://shadow.radr.fun',
          },
        }],
      });
    }
    
    // Verify payment
    try {
      const isValid = await verifyFn(paymentHeader, requirement);
      
      if (!isValid) {
        return res.status(402).json({
          error: 'Invalid payment',
          message: 'Payment verification failed',
        });
      }
      
      // Attach payment info to request
      const shadowpayReq = req as ShadowPayRequest;
      shadowpayReq.shadowpay = {
        verified: true,
        amount: requirement.amount,
        token: requirement.token || 'SOL',
      };
      
      return next();
    } catch (error) {
      return res.status(402).json({
        error: 'Payment verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * Parse payment header
 * 
 * @param header - Base64 encoded payment header
 * @returns Parsed payment data
 */
export function parsePaymentHeader(header: string): any {
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid payment header format');
  }
}

