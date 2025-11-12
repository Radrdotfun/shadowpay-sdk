/**
 * Utility functions for cryptographic operations
 * Used for generating commitments, nullifiers, and field elements
 */

import { hashPoseidon } from './poseidon';

/**
 * Helper: Convert string (hex or decimal) to BigInt
 * Handles hex strings with or without 0x prefix
 */
function toBigInt(value: string): bigint {
  if (!value) {
    throw new Error('Cannot convert empty string to BigInt');
  }
  
  // If it starts with 0x, it's already in hex format
  if (value.startsWith('0x')) {
    return BigInt(value);
  }
  
  // Check if it looks like hex (contains a-f)
  if (/[a-fA-F]/.test(value)) {
    return BigInt('0x' + value);
  }
  
  // Otherwise treat as decimal
  return BigInt(value);
}

/**
 * Generate a random secret for the sender
 * @returns Hex-encoded random secret
 */
export function generateRandomSecret(): string {
  const randomBytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    crypto.randomFillSync(randomBytes);
  }
  
  return '0x' + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random salt for commitment
 * @returns Hex-encoded random salt
 */
export function generateRandomSalt(): string {
  return generateRandomSecret(); // Same implementation
}

/**
 * Compute sender commitment from wallet pubkey and secret
 * commitment = poseidon(wallet_pubkey, secret)
 * 
 * @param walletPubkey - Solana wallet public key (base58)
 * @param secret - Random secret (hex)
 * @returns Hex-encoded sender commitment
 */
export async function computeSenderCommitment(
  walletPubkey: string,
  secret: string
): Promise<string> {
  // Convert wallet pubkey to field element
  const walletFieldElement = addressToFieldElement(walletPubkey);
  
  // Convert hex strings to bigints
  const walletBigInt = toBigInt(walletFieldElement);
  const secretBigInt = toBigInt(secret);
  
  // Hash with Poseidon
  const commitment = await hashPoseidon([walletBigInt, secretBigInt]);
  
  return commitment.toString(); // Return decimal string (no 0x prefix)
}

/**
 * Convert a Solana address (base58) to a field element
 * Takes the bytes of the address and converts to bigint mod BN254 field
 * 
 * @param address - Solana address (base58 string)
 * @returns Hex-encoded field element
 */
export function addressToFieldElement(address: string): string {
  const BN254_FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  
  const bytes = new TextEncoder().encode(address);
  let value = 0n;
  
  // Take at most 31 bytes to ensure we fit in field
  const maxBytes = Math.min(bytes.length, 31);
  for (let i = 0; i < maxBytes; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  
  // Ensure it's within field modulus
  value = value % BN254_FIELD_MODULUS;
  
  return value.toString(); // Return decimal string (no 0x prefix)
}

/**
 * Compute payment commitment
 * commitment = poseidon(sender_commitment, receiver_commitment, amount, token, salt)
 * 
 * @param senderCommitment - Sender's commitment (hex)
 * @param receiverCommitment - Receiver's commitment (hex)
 * @param amount - Amount in lamports
 * @param tokenMint - Token mint address or symbol
 * @param salt - Random salt (hex)
 * @returns Hex-encoded payment commitment
 */
export async function computePaymentCommitment(
  senderCommitment: string,
  receiverCommitment: string,
  amount: bigint,
  tokenMint: string,
  salt: string
): Promise<string> {
  // Convert token to field element (for now, just hash the symbol)
  const tokenFieldElement = addressToFieldElement(tokenMint);
  
  // Convert all inputs to bigints (handles hex with or without 0x)
  const senderBigInt = toBigInt(senderCommitment);
  const receiverBigInt = toBigInt(receiverCommitment);
  const tokenBigInt = toBigInt(tokenFieldElement);
  const saltBigInt = toBigInt(salt);
  
  const commitment = await hashPoseidon([
    senderBigInt,
    receiverBigInt,
    amount,
    tokenBigInt,
    saltBigInt,
  ]);
  
  return commitment.toString(); // Return decimal string (no 0x prefix)
}

/**
 * Compute payment nullifier
 * nullifier = poseidon(sender_secret, payment_commitment)
 * 
 * @param senderSecret - Sender's secret (hex)
 * @param paymentCommitment - Payment commitment (hex)
 * @returns Hex-encoded nullifier
 */
export async function computePaymentNullifier(
  senderSecret: string,
  paymentCommitment: string
): Promise<string> {
  // Convert hex strings to bigints (handles hex with or without 0x)
  const secretBigInt = toBigInt(senderSecret);
  const commitmentBigInt = toBigInt(paymentCommitment);
  
  const nullifier = await hashPoseidon([secretBigInt, commitmentBigInt]);
  return nullifier.toString(); // Return decimal string (no 0x prefix)
}

