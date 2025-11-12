# Quickstart Guide

Accept private payments on Solana in 5 minutes.

## 1. Get API Key

Generate your ShadowPay API key:

```bash
curl -X POST https://shadow.radr.fun/shadowpay/v1/keys/new \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "YOUR_SOLANA_WALLET"}'
```

Response:

```json
{
  "api_key": "sk_live_abc123...",
  "wallet_address": "YourWallet..."
}
```

## 2. Install SDK

```bash
npm install @shadowpay/client @shadowpay/server
```

or with pnpm:

```bash
pnpm add @shadowpay/client @shadowpay/server
```

## 3. Protect Your API (Server)

### Express.js

```typescript
import express from 'express';
import { ShadowPay } from '@shadowpay/server';

const app = express();

const shadowpay = new ShadowPay({
  apiKey: process.env.SHADOWPAY_API_KEY,
});

// Protect a route with payment
app.get('/premium',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => {
    res.json({ secret: 'This cost 0.001 SOL!' });
  }
);

app.listen(3000);
```

### Next.js API Route

```typescript
// app/api/premium/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ShadowPay } from '@shadowpay/server';

const shadowpay = new ShadowPay({
  apiKey: process.env.SHADOWPAY_API_KEY,
});

export async function GET(req: NextRequest) {
  const paymentHeader = req.headers.get('x-payment');

  if (!paymentHeader) {
    return NextResponse.json({
      x402Version: 1,
      accepts: [{
        scheme: 'zkproof',
        network: 'solana-mainnet',
        maxAmountRequired: '0.001',
        payTo: process.env.SHADOWPAY_API_KEY,
      }],
    }, { status: 402 });
  }

  const isValid = await shadowpay.verifyPayment(paymentHeader, {
    amount: 0.001,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid payment' }, { status: 402 });
  }

  return NextResponse.json({ secret: 'Premium content!' });
}
```

## 4. Make Payment (Frontend)

```typescript
import { ShadowPay } from '@shadowpay/client';
import { useWallet } from '@solana/wallet-adapter-react';

function PaymentButton() {
  const wallet = useWallet();
  const shadowpay = new ShadowPay();

  async function handlePay() {
    const payment = await shadowpay.pay({
      to: 'sk_live_abc123...', // Your API key
      amount: 0.001,
      token: 'SOL',
      wallet,
    });

    console.log('Payment successful:', payment.signature);

    // Use payment receipt to access protected content
    const response = await fetch('/api/premium', {
      headers: {
        'X-PAYMENT': payment.receipt,
      },
    });

    const data = await response.json();
    console.log('Premium content:', data);
  }

  return (
    <button onClick={handlePay}>
      Pay 0.001 SOL
    </button>
  );
}
```

## Done! 🎉

You're now accepting private payments on Solana!

## What Happened?

1. **Client** generated ElGamal keys (stored in localStorage)
2. **Client** encrypted payment amount
3. **Client** generated zero-knowledge proof
4. **Client** submitted proof to ShadowPay API
5. **Server** verified proof and amount
6. **Server** returned protected content

## Key Features

✅ **Private** - No one knows how much you paid  
✅ **Fast** - Instant settlements on Solana  
✅ **Simple** - 3 lines of code  
✅ **Multi-token** - SOL, USDC, USDT  
✅ **Zero-knowledge** - Encrypted amounts  

## Next Steps

- [API Reference](./api-reference.md) - Full API documentation
- [Token Support](./tokens.md) - Multi-token payments
- [Webhooks](./webhooks.md) - Payment notifications
- [Advanced](./advanced.md) - Advanced features

## Need Help?

- 📚 [Documentation](https://docs.shadow.radr.fun)
- 💬 [Discord](https://discord.gg/shadowpay)
- 🐦 [Twitter](https://twitter.com/shadowpay)

