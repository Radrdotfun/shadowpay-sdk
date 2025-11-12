/**
 * Payment commitment generation
 * A commitment binds payment details without revealing them
 */

import { hashPoseidon } from './poseidon';
import { randomBytes } from '@noble/hashes/utils';
import type { PaymentCommitment } from '../types';

/**
 * Generate a payment commitment
 * Commitment = Hash(amount, recipient, token, nonce)
 * 
 * @param amount - Payment amount in lamports
 * @param recipient - Recipient's address or public key
 * @param token - Token symbol (SOL, USDC, USDT)
 * @param nonce - Optional random nonce (generated if not provided)
 * @returns Payment commitment object
 */
export async function generateCommitment(
  amount: number,
  recipient: string,
  token: string,
  nonce?: string
): Promise<PaymentCommitment> {
  // Generate random nonce if not provided
  const nonceValue = nonce || bytesToHex(randomBytes(32));
  
  // Convert inputs to bigints
  const amountBigInt = BigInt(amount);
  const recipientBigInt = stringToBigInt(recipient);
  const tokenBigInt = stringToBigInt(token);
  const nonceBigInt = BigInt('0x' + nonceValue);
  
  // Hash: Poseidon(amount, recipient, token, nonce)
  const commitmentHash = await hashPoseidon([
    amountBigInt,
    recipientBigInt,
    tokenBigInt,
    nonceBigInt,
  ]);
  
  return {
    value: commitmentHash.toString(16),
    amount,
    recipient,
    token,
    nonce: nonceValue,
  };
}

/**
 * Verify that a commitment matches the given inputs
 * 
 * @param commitment - Commitment value to verify
 * @param amount - Payment amount
 * @param recipient - Recipient address
 * @param token - Token symbol
 * @param nonce - Nonce used in commitment
 * @returns True if commitment is valid
 */
export async function verifyCommitment(
  commitment: string,
  amount: number,
  recipient: string,
  token: string,
  nonce: string
): Promise<boolean> {
  const computed = await generateCommitment(amount, recipient, token, nonce);
  return computed.value === commitment;
}

/**
 * Helper: Convert string to BigInt for hashing
 */
function stringToBigInt(str: string): bigint {
  // Convert string to hex bytes, then to BigInt
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Helper: Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

