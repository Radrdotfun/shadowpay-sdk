#!/usr/bin/env node

/**
 * CLI tool for merchants to generate ShadowPay API keys
 * 
 * Usage:
 *   npx tsx scripts/generate-merchant-key.ts YOUR_WALLET_ADDRESS
 */

import { generateMerchantKey } from '../packages/server/src/generate-key';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║            ShadowPay Merchant Key Generator              ║
╚═══════════════════════════════════════════════════════════╝

Usage:
  npx tsx scripts/generate-merchant-key.ts <WALLET_ADDRESS>

Example:
  npx tsx scripts/generate-merchant-key.ts 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

What this does:
  - Generates a unique API key for your merchant account
  - Associates it with your Solana wallet address
  - Allows you to receive private payments via ShadowPay

After generating:
  1. Add the API key to your .env file:
     NEXT_PUBLIC_SHADOWPAY_KEY=sk_live_abc123...
  
  2. Use it in your app:
     const shadowpay = new ShadowPay({
       merchantKey: process.env.NEXT_PUBLIC_SHADOWPAY_KEY!
     });
`);
    process.exit(0);
  }
  
  const walletAddress = args[0];
  
  // Basic validation
  if (walletAddress.length < 32 || walletAddress.length > 44) {
    console.error('❌ Invalid Solana wallet address');
    console.error('   Solana addresses are typically 32-44 characters long');
    process.exit(1);
  }
  
  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║            ShadowPay Merchant Key Generator              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    const result = await generateMerchantKey(walletAddress);
    
    console.log('');
    console.log('✅ API Key generated successfully!');
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    YOUR API KEY                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  API Key:     ${result.api_key}`);
    console.log(`  Merchant ID: ${result.merchant_id}`);
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    NEXT STEPS                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('1️⃣  Add to your .env file:');
    console.log('');
    console.log(`     NEXT_PUBLIC_SHADOWPAY_KEY=${result.api_key}`);
    console.log('');
    console.log('2️⃣  Use in your code:');
    console.log('');
    console.log('     const shadowpay = new ShadowPay({');
    console.log('       merchantKey: process.env.NEXT_PUBLIC_SHADOWPAY_KEY!');
    console.log('     });');
    console.log('');
    console.log('     await shadowpay.pay({');
    console.log('       amount: 0.001,');
    console.log('       wallet: userWallet');
    console.log('     });');
    console.log('');
    console.log('⚠️  Keep this key secret! It\'s used to receive payments.');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Failed to generate API key');
    console.error('');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    console.error('');
    process.exit(1);
  }
}

main();

