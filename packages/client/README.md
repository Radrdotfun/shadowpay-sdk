# @shadowpay/client

Browser SDK for accepting private payments on Solana with zero-knowledge proofs. Instant user access with background ZK proof generation.

## Installation

```bash
npm install @shadowpay/client
```

## Quick Start

```typescript
import { ShadowPay } from '@shadowpay/client';

const shadowpay = new ShadowPay({
  merchantKey: 'YOUR_API_KEY',
  merchantWallet: 'YOUR_WALLET_ADDRESS',
});

const payment = await shadowpay.pay({
  amount: 0.001,
  token: 'SOL',
  wallet: phantomWallet,
  onProofComplete: (settlement) => {
    console.log('Settlement complete:', settlement.signature);
  },
});

console.log('Access granted:', payment.accessToken);
```

## Features

- **Instant Access** - Users get access in 100-200ms
- **Background ZK Proofs** - Proof generation doesn't block user experience
- **Automatic ShadowID Registration** - Seamless wallet registration
- **Multi-Token Support** - SOL, USDC, USDT
- **Wallet Integration** - Works with Phantom, Solflare, and other Solana wallets
- **Payment History** - Automatic local storage of payment history

## API Reference

### ShadowPay Constructor

```typescript
const shadowpay = new ShadowPay({
  merchantKey: string; // Your API key from ShadowPay
  merchantWallet: string; // Your receiving wallet address
  apiUrl?: string; // Optional: Custom API URL
});
```

### pay()

Make an instant private payment:

```typescript
const result = await shadowpay.pay({
  amount: number; // Amount in tokens (e.g., 0.001 SOL)
  token?: 'SOL' | 'USDC' | 'USDT'; // Default: 'SOL'
  wallet: WalletInterface; // Connected Solana wallet
  onProofComplete?: (settlement: Settlement) => void; // Callback when proof settles
});
```

**Returns:**

```typescript
{
  accessToken: string; // Use this to access protected content
  commitment: string; // Payment commitment
  status: 'authorized' | 'settled'; // Payment status
  proofPending: boolean; // True if ZK proof is still generating
  settlement?: {
    signature: string; // Solana transaction signature
    settlementTime: number; // Unix timestamp
  };
}
```

### getPaymentHistory()

Retrieve payment history from local storage:

```typescript
const history = shadowpay.getPaymentHistory();
```

## Payment Flow

1. **User Connects Wallet** - User connects their Solana wallet (Phantom, Solflare, etc.)
2. **Instant Authorization** - Payment is authorized in 100-200ms
3. **Immediate Access** - User gets `accessToken` to access content
4. **Background Proof** - ZK proof generates in background (15-30s)
5. **On-Chain Settlement** - Proof is verified and settled on Solana
6. **Callback Notification** - `onProofComplete` fires when settled

## Example: Next.js Paywall

```typescript
'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ShadowPay } from '@shadowpay/client';

export default function PremiumContent() {
  const wallet = useWallet();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  const shadowpay = new ShadowPay({
    merchantKey: process.env.NEXT_PUBLIC_SHADOWPAY_KEY!,
    merchantWallet: process.env.NEXT_PUBLIC_MERCHANT_WALLET!,
  });

  const unlock = async () => {
    const payment = await shadowpay.pay({
      amount: 0.001,
      token: 'SOL',
      wallet,
      onProofComplete: (settlement) => {
        setSettled(true);
        console.log('Settled:', settlement.signature);
      },
    });

    setAccessToken(payment.accessToken);
  };

  if (!accessToken) {
    return <button onClick={unlock}>Unlock for 0.001 SOL</button>;
  }

  return (
    <div>
      <h2>Premium Content</h2>
      <p>Access granted! {settled ? '✅ Settled on-chain' : '⏳ Settling...'}</p>
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const payment = await shadowpay.pay({
    amount: 0.001,
    wallet,
  });
} catch (error) {
  if (error.message.includes('not connected')) {
    console.error('Please connect your wallet first');
  } else if (error.message.includes('Unauthorized')) {
    console.error('Invalid API key or merchant wallet');
  } else {
    console.error('Payment failed:', error);
  }
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  ShadowPayOptions,
  PaymentOptions,
  PaymentResult,
  Settlement,
  TokenType,
} from '@shadowpay/client';
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires:
- `localStorage` for key storage
- `fetch` API
- `crypto.getRandomValues()`

## License

MIT

