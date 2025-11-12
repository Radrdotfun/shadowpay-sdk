/**
 * Wallet adapter integration for Solana wallets
 * Auto-detects and works with Phantom, Solflare, Backpack, and other wallets
 */

// import type { WalletAdapter } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';

export interface WalletInterface {
  publicKey: PublicKey | null;
  signTransaction?: <T extends Transaction>(transaction: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction>(transactions: T[]) => Promise<T[]>;
  connected: boolean;
}

/**
 * Detect the current Solana wallet
 * Works with wallet adapter or window.solana
 * 
 * @param wallet - Wallet adapter instance (optional)
 * @returns Wallet interface
 */
export function detectWallet(wallet?: WalletInterface): WalletInterface | null {
  // If wallet adapter is provided, use it
  if (wallet && wallet.publicKey) {
    return wallet;
  }
  
  // Check for window.solana (Phantom, etc.)
  if (typeof window !== 'undefined' && (window as any).solana) {
    const solana = (window as any).solana;
    return {
      publicKey: solana.publicKey ? new PublicKey(solana.publicKey.toString()) : null,
      signTransaction: solana.signTransaction?.bind(solana),
      signAllTransactions: solana.signAllTransactions?.bind(solana),
      connected: solana.isConnected || false,
    };
  }
  
  return null;
}

/**
 * Get the public key from a wallet
 * 
 * @param wallet - Wallet interface
 * @returns Public key as string
 */
export function getPublicKey(wallet: WalletInterface): string {
  if (!wallet.publicKey) {
    throw new WalletError('Wallet not connected or public key not available');
  }
  return wallet.publicKey.toString();
}

/**
 * Sign a transaction with the wallet
 * 
 * @param wallet - Wallet interface
 * @param transaction - Transaction to sign
 * @returns Signed transaction
 */
export async function signTransaction(
  wallet: WalletInterface,
  transaction: Transaction
): Promise<Transaction> {
  if (!wallet.signTransaction) {
    throw new WalletError('Wallet does not support transaction signing');
  }
  
  try {
    const signedTx = await wallet.signTransaction(transaction);
    return signedTx;
  } catch (error) {
    throw new WalletError(
      `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a wallet is connected
 * 
 * @param wallet - Wallet interface
 * @returns True if wallet is connected
 */
export function isWalletConnected(wallet: WalletInterface | null): boolean {
  return wallet !== null && wallet.connected && wallet.publicKey !== null;
}

/**
 * Get wallet name (best effort detection)
 * 
 * @param wallet - Wallet interface
 * @returns Wallet name or 'Unknown'
 */
export function getWalletName(wallet?: WalletInterface): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }
  
  const solana = (window as any).solana;
  if (solana?.isPhantom) return 'Phantom';
  if (solana?.isSolflare) return 'Solflare';
  if (solana?.isBackpack) return 'Backpack';
  if ((window as any).sollet) return 'Sollet';
  
  if ((wallet as any)?.adapter?.name) {
    return (wallet as any).adapter.name;
  }
  
  return 'Unknown';
}

/**
 * Custom error for wallet operations
 */
export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

