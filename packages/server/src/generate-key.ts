/**
 * Generate merchant API key
 * CLI tool for merchants to generate their API key for receiving payments
 */

export interface GenerateKeyRequest {
  wallet_address: string; // Merchant's Solana wallet address
}

export interface GenerateKeyResponse {
  api_key: string; // sk_live_abc123...
  merchant_id: string; // merchant_xyz
}

/**
 * Generate a new merchant API key
 * 
 * @param walletAddress - Merchant's Solana wallet address
 * @returns API key and merchant ID
 */
export async function generateMerchantKey(walletAddress: string): Promise<GenerateKeyResponse> {
  try {
    console.log('🔑 Generating API key for wallet:', walletAddress);
    
    const response = await fetch('https://shadow.radr.fun/shadowpay/v1/keys/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(`Failed to generate API key: ${error.error || response.statusText}`);
    }
    
    const data = await response.json() as GenerateKeyResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate merchant API key: Unknown error');
  }
}

