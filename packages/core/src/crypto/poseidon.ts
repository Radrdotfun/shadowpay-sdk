/**
 * Poseidon hash function
 * Used for generating nullifiers and commitments in zero-knowledge proofs
 */

import { buildPoseidon } from 'circomlibjs';

let poseidonInstance: any = null;

/**
 * Initialize Poseidon hasher (lazy loading)
 */
async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Hash an array of bigints using Poseidon
 * @param inputs - Array of bigint values to hash
 * @returns Hash as bigint
 */
export async function hashPoseidon(inputs: bigint[]): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toObject(hash);
}

/**
 * Hash an array of bigints using Poseidon (returns hex string)
 * @param inputs - Array of bigint values to hash
 * @returns Hash as hex string
 */
export async function hashPoseidonHex(inputs: bigint[]): Promise<string> {
  const hash = await hashPoseidon(inputs);
  return hash.toString(16);
}

/**
 * Hash two values using Poseidon
 * @param a - First value
 * @param b - Second value
 * @returns Hash as bigint
 */
export async function hashPoseidon2(a: bigint, b: bigint): Promise<bigint> {
  return hashPoseidon([a, b]);
}

/**
 * Hash bytes using Poseidon
 * @param inputs - Array of byte arrays
 * @returns Hash as bigint
 */
export async function hashPoseidonBytes(inputs: Uint8Array[]): Promise<bigint> {
  const bigints = inputs.map(bytes => {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return result;
  });
  return hashPoseidon(bigints);
}

