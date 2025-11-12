/**
 * Zero-knowledge proof generation using snarkjs and Groth16
 * Generates proofs for private payments without revealing amounts
 */

import * as snarkjs from 'snarkjs';
import { CIRCUIT_URLS } from '@shadowpay/core';

// BN254 field modulus (curve order)
const BN254_FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export interface ProofInputs {
  // Private inputs
  senderCommitment: string; // Sender's identity commitment (hex)
  senderSecret: string; // Sender's secret key (hex)
  receiverCommitment: string; // Receiver's identity commitment (hex) - derived from merchant pubkey
  amount: bigint; // Payment amount in lamports
  tokenMint: string; // Token mint address ("0" for SOL)
  salt: string; // Random salt for commitment (hex)
  merklePath: string[]; // Merkle proof siblings (array of 20)
  pathIndices: number[]; // Merkle proof path indices (array of 20)
  
  // ElGamal encryption
  encryptedC1: string; // ElGamal ciphertext C1 (hex)
  encryptedC2: string; // ElGamal ciphertext C2 (hex)
  elgamalRandomness: string; // Randomness used in ElGamal (hex)
  
  // Public inputs
  shadowidRoot: string; // Merkle root (hex)
  maxAmount: bigint; // Max amount for range check (2x amount)
  receiverElGamalPubkey: string; // Receiver's ElGamal public key (hex)
}

export interface GeneratedProof {
  proof: any; // Groth16 proof (pi_a, pi_b, pi_c)
  publicSignals: string[]; // Public inputs to the circuit
}

function ensureFieldElement(value: bigint, name: string): bigint {
  if (value >= BN254_FIELD_MODULUS) {
    console.warn(`⚠️ ${name} exceeds field modulus, taking modulo`);
    return value % BN254_FIELD_MODULUS;
  }
  if (value < 0n) {
    throw new Error(`${name} cannot be negative: ${value}`);
  }
  return value;
}

export function pubkeyToFieldElement(pubkey: string): string {
  const clean = pubkey.startsWith('0x') ? pubkey.slice(2) : pubkey;
  const truncated = clean.slice(0, 62);
  const value = BigInt('0x' + truncated);
  const fieldValue = ensureFieldElement(value, 'pubkeyToFieldElement');
  
  return '0x' + fieldValue.toString(16).padStart(64, '0');
}

export async function generateProof(
  inputs: ProofInputs
): Promise<GeneratedProof> {
  try {
    const hexToBigInt = (hex: string): bigint => {
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      return BigInt('0x' + cleanHex);
    };
    let tokenMintFieldElement: string;
    if (inputs.tokenMint === 'SOL' || inputs.tokenMint === '0') {
      tokenMintFieldElement = '0';
    } else if (inputs.tokenMint.startsWith('0x') || /[a-fA-F]/.test(inputs.tokenMint)) {
      tokenMintFieldElement = hexToBigInt(inputs.tokenMint).toString();
    } else {
      tokenMintFieldElement = inputs.tokenMint;
    }
    
    const circuitInputs = {
      sender_commitment: ensureFieldElement(hexToBigInt(inputs.senderCommitment), 'sender_commitment').toString(),
      sender_secret: ensureFieldElement(hexToBigInt(inputs.senderSecret), 'sender_secret').toString(),
      receiver_commitment: ensureFieldElement(hexToBigInt(inputs.receiverCommitment), 'receiver_commitment').toString(),
      amount: ensureFieldElement(inputs.amount, 'amount').toString(),
      token_mint: tokenMintFieldElement,
      salt: ensureFieldElement(hexToBigInt(inputs.salt), 'salt').toString(),
      merkle_path: inputs.merklePath,
      path_indices: inputs.pathIndices,
      
      encrypted_amount_c1: ensureFieldElement(hexToBigInt(inputs.encryptedC1), 'encrypted_amount_c1').toString(),
      encrypted_amount_c2: ensureFieldElement(hexToBigInt(inputs.encryptedC2), 'encrypted_amount_c2').toString(),
      elgamal_randomness: ensureFieldElement(hexToBigInt(inputs.elgamalRandomness), 'elgamal_randomness').toString(),
      
      shadowid_root: ensureFieldElement(hexToBigInt(inputs.shadowidRoot), 'shadowid_root').toString(),
      max_amount: ensureFieldElement(inputs.maxAmount, 'max_amount').toString(),
      receiver_elgamal_pubkey: ensureFieldElement(hexToBigInt(inputs.receiverElGamalPubkey), 'receiver_elgamal_pubkey').toString(),
    };
    
    for (const [key, value] of Object.entries(circuitInputs)) {
      if (Array.isArray(value)) continue;
      const bigIntValue = BigInt(value);
      if (bigIntValue >= BN254_FIELD_MODULUS) {
        throw new Error(
          `Circuit input "${key}" exceeds BN254 field modulus`
        );
      }
    }
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      CIRCUIT_URLS.wasm,
      CIRCUIT_URLS.zkey
    );
    
    return {
      proof,
      publicSignals,
    };
  } catch (error) {
    throw new ProofGenerationError(
      `Failed to generate ZK proof: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

export async function verifyProof(
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  try {
    const vkeyResponse = await fetch(CIRCUIT_URLS.vkey);
    const vkey = await vkeyResponse.json();
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    return isValid;
  } catch (error) {
    console.error('Proof verification failed:', error);
    return false;
  }
}

export class ProofGenerationError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'ProofGenerationError';
  }
}

