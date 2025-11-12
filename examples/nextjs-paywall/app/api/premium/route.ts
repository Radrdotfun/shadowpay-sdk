import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('X-Access-Token')

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Payment required' },
      { status: 402 }
    )
  }

  try {
    const verification = await fetch(
      'https://shadow.radr.fun/shadowpay/v1/payment/verify-access',
      {
        headers: { 'X-Access-Token': accessToken },
      }
    )

    if (!verification.ok) {
      return NextResponse.json(
        { error: 'Unauthorized or expired' },
        { status: 401 }
      )
    }

    const { authorized, settlement_status } = await verification.json()

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized or expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      content: 'This is your premium content! You got instant access while the ZK proof generates in the background. 🎉',
      settlement_status, // 'authorized' | 'settling' | 'settled'
      message: settlement_status === 'settled' 
        ? 'Fully settled on-chain with ZK privacy!'
        : 'Access granted, settlement in progress...',
      data: {
        title: 'Welcome to the exclusive club',
        message:
          'You have successfully unlocked this content using an instant private payment on Solana. The ZK proof is generating in the background for full privacy.',
        tips: [
          'Your payment was authorized instantly (100-200ms)',
          'Zero-knowledge proof is generating in background (15-30s)',
          'The amount will be encrypted using ElGamal on BN254',
          'No personal information is revealed',
          'The transaction will settle on Solana mainnet',
        ],
      },
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

