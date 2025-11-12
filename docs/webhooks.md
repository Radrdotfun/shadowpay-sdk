# Webhooks

Receive real-time notifications about payments.

## Overview

Webhooks allow you to receive HTTP callbacks when events occur, such as successful payments, failed transactions, or refunds.

## Setup

### 1. Get Webhook Secret

Your webhook secret is provided when you create an API key:

```bash
curl -X POST https://shadow.radr.fun/shadowpay/v1/keys/new \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "YOUR_SOLANA_WALLET"}'
```

Response includes `webhook_secret`:

```json
{
  "api_key": "sk_live_...",
  "webhook_secret": "whsec_..."
}
```

### 2. Create Webhook Endpoint

```typescript
import express from 'express';
import { ShadowPay } from '@shadowpay/server';

const app = express();

const shadowpay = new ShadowPay({
  apiKey: process.env.SHADOWPAY_API_KEY,
  webhookSecret: process.env.SHADOWPAY_WEBHOOK_SECRET,
});

app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }), // Important: Use raw body
  shadowpay.webhooks.handler((event) => {
    console.log('Received webhook:', event.type);
    
    switch (event.type) {
      case 'payment.success':
        handleSuccessfulPayment(event.data);
        break;
      
      case 'payment.failed':
        handleFailedPayment(event.data);
        break;
      
      case 'payment.refunded':
        handleRefund(event.data);
        break;
    }
  })
);
```

⚠️ **Important:** Use `express.raw()` middleware to preserve the raw body for signature verification.

### 3. Configure Webhook URL

In your ShadowPay dashboard, set your webhook URL:

```
https://yourdomain.com/webhooks/shadowpay
```

## Event Types

### payment.success

Sent when a payment is successfully verified and settled.

```json
{
  "type": "payment.success",
  "data": {
    "tx_hash": "5j7s...", // Solana transaction signature
    "amount": 0.001,
    "token": "SOL",
    "recipient": "merchant_wallet_or_api_key",
    "nullifier": "abc123...", // Unique payment identifier
    "timestamp": 1234567890
  },
  "timestamp": 1234567890
}
```

### payment.failed

Sent when a payment verification fails.

```json
{
  "type": "payment.failed",
  "data": {
    "reason": "Invalid proof",
    "amount": 0.001,
    "token": "SOL",
    "timestamp": 1234567890
  },
  "timestamp": 1234567890
}
```

### payment.refunded

Sent when a payment is refunded.

```json
{
  "type": "payment.refunded",
  "data": {
    "tx_hash": "original_tx_hash",
    "refund_tx_hash": "refund_tx_hash",
    "amount": 0.001,
    "token": "SOL",
    "reason": "Customer request",
    "timestamp": 1234567890
  },
  "timestamp": 1234567890
}
```

## Signature Verification

All webhooks are signed with HMAC-SHA256. The SDK verifies signatures automatically.

### Manual Verification

If you're not using the SDK:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-shadowpay-signature'];
    const body = req.body.toString();
    
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = JSON.parse(body);
    // Handle event...
    
    res.json({ received: true });
  }
);
```

## Best Practices

### 1. Respond Quickly

Respond with `200 OK` within 5 seconds:

```typescript
shadowpay.webhooks.handler(async (event) => {
  // Queue for background processing
  await queue.add('process-payment', event);
  
  // Respond immediately
  return;
});
```

### 2. Handle Idempotency

Use `nullifier` to detect duplicate events:

```typescript
const processedNullifiers = new Set();

shadowpay.webhooks.handler((event) => {
  if (event.type === 'payment.success') {
    if (processedNullifiers.has(event.data.nullifier)) {
      console.log('Already processed');
      return;
    }
    
    processedNullifiers.add(event.data.nullifier);
    // Process payment...
  }
});
```

### 3. Handle Failures

Implement retry logic:

```typescript
shadowpay.webhooks.handler(async (event) => {
  try {
    await processPayment(event);
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Log error, send alert, etc.
    throw error; // ShadowPay will retry
  }
});
```

### 4. Secure Your Endpoint

- Always verify signatures
- Use HTTPS only
- Rate limit if needed
- Log suspicious activity

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.post('/webhooks/shadowpay',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler(...)
);
```

## Testing Webhooks

### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL as webhook URL
# https://abc123.ngrok.io/webhooks/shadowpay
```

### Manual Testing

Send test webhook:

```bash
curl -X POST http://localhost:3000/webhooks/shadowpay \
  -H "Content-Type: application/json" \
  -H "X-SHADOWPAY-SIGNATURE: $(echo -n '{"type":"payment.success",...}' | openssl dgst -sha256 -hmac 'your_secret' | cut -d' ' -f2)" \
  -d '{
    "type": "payment.success",
    "data": {
      "tx_hash": "test_tx_123",
      "amount": 0.001,
      "token": "SOL",
      "recipient": "test_recipient",
      "nullifier": "test_nullifier",
      "timestamp": 1234567890
    },
    "timestamp": 1234567890
  }'
```

## Common Use Cases

### Update Database

```typescript
shadowpay.webhooks.handler(async (event) => {
  if (event.type === 'payment.success') {
    await db.payments.create({
      txHash: event.data.tx_hash,
      amount: event.data.amount,
      token: event.data.token,
      status: 'completed',
    });
  }
});
```

### Send Email

```typescript
import nodemailer from 'nodemailer';

shadowpay.webhooks.handler(async (event) => {
  if (event.type === 'payment.success') {
    await sendEmail({
      to: user.email,
      subject: 'Payment Received',
      body: `Your payment of ${event.data.amount} ${event.data.token} was successful!`,
    });
  }
});
```

### Unlock Content

```typescript
shadowpay.webhooks.handler(async (event) => {
  if (event.type === 'payment.success') {
    await db.users.update({
      where: { id: userId },
      data: { premiumAccess: true },
    });
  }
});
```

### Analytics

```typescript
shadowpay.webhooks.handler((event) => {
  if (event.type === 'payment.success') {
    analytics.track('Payment Successful', {
      amount: event.data.amount,
      token: event.data.token,
      tx: event.data.tx_hash,
    });
  }
});
```

## Retry Policy

If your endpoint returns an error (non-200 status), ShadowPay will retry:

- **Attempt 1:** Immediately
- **Attempt 2:** After 1 minute
- **Attempt 3:** After 5 minutes
- **Attempt 4:** After 15 minutes
- **Attempt 5:** After 1 hour

After 5 failed attempts, the webhook is marked as failed.

## Monitoring

### View Webhook Logs

Check your ShadowPay dashboard for webhook delivery logs:

- Timestamp
- Event type
- HTTP status
- Response time
- Retry attempts

### Failed Webhooks

Manually retry failed webhooks from the dashboard.

## FAQ

**Q: What if my server is down?**  
A: ShadowPay will retry up to 5 times over 1 hour.

**Q: Can I have multiple webhook endpoints?**  
A: Currently, one webhook URL per API key. Use a proxy to fan out.

**Q: Are webhooks guaranteed to be in order?**  
A: No, process events idempotently using `nullifier`.

**Q: What's the timeout for webhook responses?**  
A: 5 seconds. Process quickly and respond immediately.

**Q: Can I replay webhooks?**  
A: Yes, from the ShadowPay dashboard.

## Support

Need help with webhooks?

- 📧 support@shadow.radr.fun
- 💬 [Discord](https://discord.gg/shadowpay)
- 📚 [API Reference](./api-reference.md)

