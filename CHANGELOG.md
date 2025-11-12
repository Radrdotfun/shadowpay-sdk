# Changelog

All notable changes to the ShadowPay SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-12

### Added

#### @shadowpay/core
- ElGamal encryption/decryption on BN254 curve
- Poseidon hash implementation for commitments and nullifiers
- Cryptographic utilities for sender and payment commitments
- Field element conversion for Solana addresses
- Token amount parsing for SOL, USDC, and USDT
- Circuit URLs configuration for ZK proof generation

#### @shadowpay/client
- Browser SDK for instant private payments
- `ShadowPay` class with `pay()` method
- Automatic ShadowID wallet registration
- Background ZK proof generation (non-blocking)
- Instant authorization (100-200ms)
- Multi-token support (SOL, USDC, USDT)
- Wallet adapter integration (Phantom, Solflare, etc.)
- Payment history with localStorage persistence
- ElGamal key management
- API client for shadow.radr.fun backend

#### @shadowpay/server
- Node.js SDK for payment verification
- Express middleware for protected routes
- Webhook handler for payment events
- Payment verification API
- TypeScript support with full type exports

### Features
- Zero-knowledge proofs using Groth16 on BN254
- Privacy-preserving payment amounts with ElGamal encryption
- Merkle tree-based ShadowID identity system
- Instant access model: users get content before ZK proof completes
- On-chain settlement with ZK privacy
- Full TypeScript support across all packages

### Developer Experience
- Clean, intuitive API design
- Comprehensive documentation and examples
- Next.js and Express.js examples included
- Error handling with specific error messages
- Automatic dependency management

## [Unreleased]

### Planned
- React hooks for easier integration
- Additional blockchain support
- Enhanced webhook system
- Payment subscriptions
- Refund functionality
- Advanced analytics

---

For migration guides and upgrade notes, see the [documentation](https://github.com/Radrdotfun/shadowpay-sdk#readme).

