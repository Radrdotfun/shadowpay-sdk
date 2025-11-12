# ShadowPay Express API Example

A complete example of using ShadowPay to protect API endpoints with payments in Express.js.

## Features

- 💳 Accept SOL, USDC, and USDT payments
- 🔐 Zero-knowledge payment verification
- 🪝 Webhook handling with signature verification
- 🚀 Simple Express middleware
- 📊 Multi-token support

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Get your ShadowPay API key:

```bash
curl -X POST https://shadow.radr.fun/shadowpay/v1/keys/new \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "YOUR_SOLANA_WALLET"}'
```

4. Add your API key to `.env`:

```
SHADOWPAY_API_KEY=sk_your_api_key_here
SHADOWPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3000
```

## Run

Development mode:

```bash
pnpm dev
```

Production mode:

```bash
pnpm build
pnpm start
```

Server will start on [http://localhost:3000](http://localhost:3000)

## Endpoints

### Protected Endpoints

- `GET /api/data/sol` - Requires 0.001 SOL payment
- `GET /api/data/usdc` - Requires 1 USDC payment
- `GET /api/data/usdt` - Requires 5 USDT payment

### Webhooks

- `POST /webhooks/shadowpay` - Receives payment events

## Testing

### Test with curl:

1. First, try without payment (should return 402):

```bash
curl http://localhost:3000/api/data/sol
```

2. With payment (need to generate payment proof first using client SDK):

```bash
curl http://localhost:3000/api/data/sol \
  -H "X-PAYMENT: <base64_payment_proof>"
```

### Test webhooks:

```bash
curl -X POST http://localhost:3000/webhooks/shadowpay \
  -H "Content-Type: application/json" \
  -H "X-SHADOWPAY-SIGNATURE: <signature>" \
  -d '{
    "type": "payment.success",
    "data": {
      "tx_hash": "...",
      "amount": 0.001,
      "token": "SOL",
      "recipient": "...",
      "nullifier": "...",
      "timestamp": 1234567890
    },
    "timestamp": 1234567890
  }'
```

## Code Highlights

### Protect a route (1 line):

```typescript
app.get('/api/data',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => res.json({ secret: 'data' })
);
```

### Handle webhooks:

```typescript
app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    if (event.type === 'payment.success') {
      console.log('Payment received:', event.data);
    }
  })
);
```

### Multi-token support:

```typescript
// SOL
shadowpay.requirePayment({ amount: 0.001, token: 'SOL' })

// USDC
shadowpay.requirePayment({ amount: 1, token: 'USDC' })

// USDT
shadowpay.requirePayment({ amount: 5, token: 'USDT' })
```

## Learn More

- [ShadowPay Documentation](../../docs/quickstart.md)
- [API Reference](../../docs/api-reference.md)
- [Webhooks Guide](../../docs/webhooks.md)
- [Token Support](../../docs/tokens.md)

