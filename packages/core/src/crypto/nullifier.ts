/**
 * Nullifier generation for preventing double-spending
 * A nullifier is a unique identifier for each payment that prevents replay attacks
 */

import { hashPoseidon } from './poseidon';
import type { Nullifier } from '../types';

/**
 * Generate a nullifier for a payment
 * Nullifier = Hash(userSecret, commitment, paymentIndex)
 * 
 * @param privateKey - User's private key (hex string)
 * @param commitment - Payment commitment (hex string)
 * @param paymentIndex - Sequential payment index (prevents reuse)
 * @returns Nullifier object with value
 */
export async function generateNullifier(
  privateKey: string,
  commitment: string,
  paymentIndex: number
): Promise<Nullifier> {
  // Convert inputs to bigints
  const userSecretBigInt = BigInt('0x' + privateKey);
  const commitmentBigInt = BigInt('0x' + commitment);
  const indexBigInt = BigInt(paymentIndex);
  
  // Hash: Poseidon(userSecret, commitment, index)
  const nullifierHash = await hashPoseidon([
    userSecretBigInt,
    commitmentBigInt,
    indexBigInt,
  ]);
  
  return {
    value: nullifierHash.toString(16),
    userSecret: privateKey,
    commitment,
    index: paymentIndex,
  };
}

/**
 * Verify that a nullifier matches the given inputs
 * 
 * @param nullifier - Nullifier to verify
 * @param privateKey - User's private key
 * @param commitment - Payment commitment
 * @param paymentIndex - Payment index
 * @returns True if nullifier is valid
 */
export async function verifyNullifier(
  nullifier: string,
  privateKey: string,
  commitment: string,
  paymentIndex: number
): Promise<boolean> {
  const computed = await generateNullifier(privateKey, commitment, paymentIndex);
  return computed.value === nullifier;
}

