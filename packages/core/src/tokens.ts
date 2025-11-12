/**
 * Token configurations for ShadowPay
 * Supports SOL, USDC, and USDT on Solana mainnet
 */

export interface TokenConfig {
  symbol: string;
  mint: string; // Solana mint address
  decimals: number;
  name: string;
  icon?: string;
}

export const TOKENS: Record<string, TokenConfig> = {
  SOL: {
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    name: 'Solana',
    icon: '◎',
  },
  USDC: {
    symbol: 'USDC',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    name: 'USD Coin',
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    name: 'Tether USD',
    icon: '💲',
  },
};

/**
 * Convert human-readable amount to lamports/smallest unit
 * @param amount - Human-readable amount (e.g., 0.001 SOL)
 * @param token - Token symbol (SOL, USDC, USDT)
 * @returns Amount in lamports
 */
export function parseAmount(amount: number, token: string): number {
  const config = TOKENS[token.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported token: ${token}`);
  }
  
  return Math.floor(amount * Math.pow(10, config.decimals));
}

/**
 * Convert lamports to human-readable amount
 * @param lamports - Amount in lamports
 * @param token - Token symbol (SOL, USDC, USDT)
 * @returns Human-readable amount
 */
export function formatAmount(lamports: number, token: string): number {
  const config = TOKENS[token.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported token: ${token}`);
  }
  
  return lamports / Math.pow(10, config.decimals);
}

/**
 * Get token configuration by symbol
 * @param token - Token symbol (SOL, USDC, USDT)
 * @returns Token configuration
 */
export function getTokenConfig(token: string): TokenConfig {
  const config = TOKENS[token.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported token: ${token}`);
  }
  return config;
}

/**
 * Get list of all supported tokens
 * @returns Array of token configurations
 */
export function getSupportedTokens(): TokenConfig[] {
  return Object.values(TOKENS);
}

