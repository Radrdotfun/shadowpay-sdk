'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ShadowPay } from '@shadowpay/client'

export default function Home() {
  const wallet = useWallet()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [settlementStatus, setSettlementStatus] = useState<string>('')

  // ✅ Merchant API key and wallet in constructor
  const merchantKey = process.env.NEXT_PUBLIC_SHADOWPAY_KEY || '2hTKeADLwNZPeU5MeFcNKV4ttfWtpBUSEMiRVf4jRyjC'
  const merchantWallet = process.env.NEXT_PUBLIC_MERCHANT_WALLET || 'A3ZEQpuepApGVRB7Z7zDFH33KkYCGh2WpUCai5U2mskr' // ✅ MUST match the wallet that owns the API key!
  
  console.log('🔑 API Key:', merchantKey)
  console.log('💰 Merchant Wallet:', merchantWallet)
  
  const shadowpay = new ShadowPay({
    merchantKey, // API key for X-API-Key header
    merchantWallet, // Merchant's receiving wallet
  })

  async function unlockPremiumContent() {
    if (!wallet.connected) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError('')
    setSettlementStatus('')

    try {
      console.log('🔓 Unlocking content...')
      
      // ✅ Pay (instant! 100-200ms)
      const payment = await shadowpay.pay({
        amount: 0.001,
        token: 'SOL',
        wallet: wallet as any,
        onProofComplete: (settlement) => {
          console.log('🎉 Settlement complete:', settlement.signature)
          setSettlementStatus(`✅ Settled: ${settlement.signature.substring(0, 20)}...`)
        },
      })

      console.log('✅ Access granted!')
      console.log('   Status:', payment.status)
      console.log('   Proof pending:', payment.proofPending)

      // ✅ Fetch content IMMEDIATELY with access token
      const response = await fetch('/api/premium', {
        headers: {
          'X-Access-Token': payment.accessToken,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }

      const data = await response.json()
      setContent(data.content)
      setSettlementStatus('⏳ Proof generating in background...')
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              ShadowPay Paywall
            </h1>
            <p className="text-xl text-gray-300">
              Private payments on Solana, as easy as Stripe
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center mb-8">
            <WalletMultiButton />
          </div>

          {/* Paywall Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Premium Content
              </h2>
              <p className="text-gray-300">
                Unlock exclusive content for just 0.001 SOL
              </p>
            </div>

            {/* Payment Button */}
            {!content && (
              <button
                onClick={unlockPremiumContent}
                disabled={!wallet.connected || loading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                {loading ? 'Processing Payment...' : 'Unlock for 0.001 SOL'}
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Premium Content */}
            {content && (
              <div className="mt-6 p-6 bg-green-500/20 border border-green-500 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">✅</span>
                  <h3 className="text-xl font-bold text-white">Unlocked!</h3>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">{content}</p>
                {settlementStatus && (
                  <p className="text-sm text-gray-400">{settlementStatus}</p>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur rounded-lg p-6">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="text-white font-semibold mb-1">Private</h3>
              <p className="text-gray-400 text-sm">Zero-knowledge proofs</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-lg p-6">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-white font-semibold mb-1">Fast</h3>
              <p className="text-gray-400 text-sm">Instant settlements</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-lg p-6">
              <div className="text-3xl mb-2">💎</div>
              <h3 className="text-white font-semibold mb-1">Simple</h3>
              <p className="text-gray-400 text-sm">3 lines of code</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

