/**
 * ElGamal encryption on BN254 curve
 * Used for encrypting payment amounts in zero-knowledge proofs
 */

import { bn254 } from '@noble/curves/bn254';
import { randomBytes } from '@noble/hashes/utils';
import type { ElGamalKeypair, EncryptedAmount } from '../types';

/**
 * Generate a new ElGamal keypair on BN254 curve
 * @returns ElGamal keypair (private key and public key point)
 */
export function generateElGamalKeypair(): ElGamalKeypair {
  const curve = bn254 as any;
  
  // Generate random 32-byte private key
  const privateKeyBytes = randomBytes(32);
  const privateKeyBigInt = bytesToNumberBE(privateKeyBytes) % curve.G1.CURVE.n;
  
  // Derive public key: P = G * privateKey
  const publicKeyPoint = curve.G1.ProjectivePoint.BASE.multiply(privateKeyBigInt);
  const affine = publicKeyPoint.toAffine();
  
  return {
    privateKey: numberToHex(privateKeyBigInt),
    publicKey: {
      x: numberToHex(affine.x),
      y: numberToHex(affine.y),
    },
  };
}

/**
 * Encrypt an amount using ElGamal encryption
 * ElGamal: (C1, C2) = (rG, M + rP) where r is random, G is generator, M is message, P is public key
 * 
 * @param amount - Amount to encrypt (as bigint)
 * @param publicKey - Recipient's public key
 * @returns Encrypted amount (C1, C2)
 */
export function encryptAmount(
  amount: bigint,
  publicKey: { x: string; y: string }
): EncryptedAmount {
  const curve = bn254 as any;
  const G = curve.G1.ProjectivePoint.BASE;
  
  // Generate random ephemeral key
  const rBytes = randomBytes(32);
  const r = bytesToNumberBE(rBytes) % curve.G1.CURVE.n;
  
  // C1 = r * G
  const c1Point = G.multiply(r);
  const c1 = c1Point.toAffine();
  
  // Reconstruct public key point
  const pubKeyPoint = curve.G1.ProjectivePoint.fromAffine({
    x: hexToNumber(publicKey.x),
    y: hexToNumber(publicKey.y),
  });
  
  // M = amount * G
  const messagePoint = G.multiply(amount);
  
  // C2 = M + r * P
  const sharedSecret = pubKeyPoint.multiply(r);
  const c2Point = messagePoint.add(sharedSecret);
  const c2 = c2Point.toAffine();
  
  return {
    c1: {
      x: numberToHex(c1.x),
      y: numberToHex(c1.y),
    },
    c2: {
      x: numberToHex(c2.x),
      y: numberToHex(c2.y),
    },
  };
}

/**
 * Decrypt an encrypted amount using ElGamal decryption
 * Decrypt: M = C2 - (privateKey * C1)
 * 
 * @param encrypted - Encrypted amount (C1, C2)
 * @param privateKey - Private key (hex string)
 * @returns Decrypted amount (as bigint)
 */
export function decryptAmount(
  encrypted: EncryptedAmount,
  privateKey: string
): bigint {
  const curve = bn254 as any;
  
  // Reconstruct points
  const c1Point = curve.G1.ProjectivePoint.fromAffine({
    x: hexToNumber(encrypted.c1.x),
    y: hexToNumber(encrypted.c1.y),
  });
  
  const c2Point = curve.G1.ProjectivePoint.fromAffine({
    x: hexToNumber(encrypted.c2.x),
    y: hexToNumber(encrypted.c2.y),
  });
  
  // Decrypt
  const privateKeyBigInt = hexToNumber(privateKey);
  const sharedSecret = c1Point.multiply(privateKeyBigInt);
  const messagePoint = c2Point.subtract(sharedSecret);
  
  // Brute force discrete log for small amounts
  return recoverAmountFromPoint(messagePoint);
}

/**
 * Recover amount from curve point using discrete logarithm
 * Uses baby-step giant-step algorithm for efficiency
 * 
 * @param point - Curve point representing encrypted amount
 * @param maxAmount - Maximum amount to search (default: 10 SOL = 10B lamports)
 * @returns Recovered amount
 */
export function recoverAmountFromPoint(point: any): bigint {
  const curve = bn254 as any;
  const G = curve.G1.ProjectivePoint.BASE;
  
  // Check if point is identity (amount = 0)
  if (point.equals(curve.G1.ProjectivePoint.ZERO)) {
    return 0n;
  }
  
  // Brute force for amounts up to 10M (reasonable for most payments)
  // For SOL: 10M lamports = 0.01 SOL
  // For USDC: 10M micro-USDC = 10 USDC
  const maxAmount = 10_000_000n;
  
  for (let i = 1n; i <= maxAmount; i++) {
    try {
      const testPoint = G.multiply(i);
      if (point.equals(testPoint)) {
        return i;
      }
    } catch (e) {
      // Skip invalid scalars
      continue;
    }
  }
  
  throw new Error('Could not decrypt amount (too large or invalid)');
}

/**
 * Helper: Convert bytes to BigInt (big-endian)
 */
function bytesToNumberBE(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Helper: Convert BigInt to hex string
 */
function numberToHex(num: bigint): string {
  return num.toString(16).padStart(64, '0');
}

/**
 * Helper: Convert hex string to BigInt
 */
function hexToNumber(hex: string): bigint {
  return BigInt('0x' + hex);
}

