/**
 * Express API Example with ShadowPay
 * Demonstrates multi-token support and webhook handling
 */

import express from 'express';
import dotenv from 'dotenv';
import { ShadowPay } from '@shadowpay/server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize ShadowPay
const shadowpay = new ShadowPay({
  apiKey: process.env.SHADOWPAY_API_KEY || 'YOUR_API_KEY',
  webhookSecret: process.env.SHADOWPAY_WEBHOOK_SECRET,
});

// Middleware
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'ShadowPay Express API Example',
    version: '1.0.0',
    endpoints: {
      sol: '/api/data/sol (0.001 SOL)',
      usdc: '/api/data/usdc (1 USDC)',
      usdt: '/api/data/usdt (5 USDT)',
      webhook: '/webhooks/shadowpay (POST)',
    },
  });
});

// Protected route: Pay 0.001 SOL
app.get(
  '/api/data/sol',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'This content cost 0.001 SOL! ◎',
        token: 'SOL',
        amount: 0.001,
        content: {
          tip: 'Your payment was private - no one knows how much you paid!',
          features: [
            'Zero-knowledge proof verification',
            'Encrypted amounts',
            'No transaction history',
          ],
        },
      },
    });
  }
);

// Protected route: Pay 1 USDC
app.get(
  '/api/data/usdc',
  shadowpay.requirePayment({ amount: 1, token: 'USDC' }),
  (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'This content cost 1 USDC! 💵',
        token: 'USDC',
        amount: 1,
        content: {
          premium: 'You unlocked USDC-gated content',
          info: 'USDC is a stablecoin pegged to USD',
        },
      },
    });
  }
);

// Protected route: Pay 5 USDT
app.get(
  '/api/data/usdt',
  shadowpay.requirePayment({ amount: 5, token: 'USDT' }),
  (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'This content cost 5 USDT! 💲',
        token: 'USDT',
        amount: 5,
        content: {
          exclusive: 'High-value USDT content unlocked',
          info: 'USDT is another popular stablecoin',
        },
      },
    });
  }
);

// Webhook endpoint
app.post(
  '/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    console.log('📨 Webhook received:', event.type);
    console.log('📊 Event data:', event.data);

    switch (event.type) {
      case 'payment.success':
        console.log('✅ Payment successful!');
        console.log(`   Amount: ${event.data.amount} ${event.data.token}`);
        console.log(`   TX: ${event.data.tx_hash}`);
        console.log(`   Recipient: ${event.data.recipient}`);
        // Update database, send email, etc.
        break;

      case 'payment.failed':
        console.log('❌ Payment failed!');
        console.log(`   Reason: ${event.data}`);
        // Handle failed payment
        break;

      case 'payment.refunded':
        console.log('↩️  Payment refunded!');
        console.log(`   TX: ${event.data.tx_hash}`);
        // Handle refund
        break;
    }
  })
);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 ShadowPay Express API Example                   ║
║                                                       ║
║   Server running on: http://localhost:${PORT}        ║
║                                                       ║
║   Protected Endpoints:                                ║
║   • GET /api/data/sol  (0.001 SOL)                   ║
║   • GET /api/data/usdc (1 USDC)                      ║
║   • GET /api/data/usdt (5 USDT)                      ║
║                                                       ║
║   Webhooks:                                           ║
║   • POST /webhooks/shadowpay                         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

