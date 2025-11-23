/**
 * Payment Service
 * Handles x402 payment execution with Aeon API integration
 */

import { AeonX402Client, type Aeon402Response } from './aeon-x402-clientt'
import { type X402PaymentRequest } from '@/lib/x402'

export interface PaymentResult {
  success: boolean
  transactionHash?: string
  amount?: string
  network?: string
  error?: string
}

export interface PaymentProgress {
  stage: 'checking' | 'bridging' | 'executing' | 'complete' | 'failed'
  message: string
  progress: number
}

/**
 * Execute a payment using Aeon's x402 QR code payment API
 */
export async function executeAeonPayment(
  paymentRequest: X402PaymentRequest,
  appId: string,
  qrCode: string,
  walletAddress?: string,
  onProgress?: (progress: PaymentProgress) => void
): Promise<PaymentResult> {
  try {
    // Initialize Aeon client (use sandbox for testing)
    const useSandbox = false // Change to false for production
    const client = new AeonX402Client(useSandbox)

    // Set wallet address if provided, otherwise initialize a new one
    if (walletAddress) {
      client.setWallet(walletAddress as `0x${string}`)
    } else {
      onProgress?.({
        stage: 'checking',
        message: 'Initializing wallet...',
        progress: 5
      })
      await client.init()
    }

    // Step 1: Get payment information from Aeon
    onProgress?.({
      stage: 'checking',
      message: 'Fetching payment details from Aeon...',
      progress: 20
    })

    const paymentInfo = await client.getPaymentInfo(appId, qrCode)

    if (paymentInfo.code !== '402' || !paymentInfo.accepts?.length) {
      throw new Error(`Unexpected response from Aeon: ${paymentInfo.msg}`)
    }

    const aeonPaymentDetails = paymentInfo.accepts[0]

    // Step 2: Create X-PAYMENT header
    onProgress?.({
      stage: 'checking',
      message: 'Creating payment authorization...',
      progress: 40
    })

    const xPaymentHeader = await client.createXPaymentHeader(aeonPaymentDetails)

    console.log('X-PAYMENT header created: ', xPaymentHeader)

    // Step 3: Submit payment with X-PAYMENT header
    onProgress?.({
      stage: 'executing',
      message: 'Submitting payment to Aeon...',
      progress: 70
    })

    const result = await client.submitPayment(appId, qrCode, xPaymentHeader)

    console.log('Payment result: ', result)

    // Step 4: Check result
    if (result.body.code === '0') {
      onProgress?.({
        stage: 'complete',
        message: 'Payment successful!',
        progress: 100
      })

      return {
        success: true,
        transactionHash: result.body.model?.txHash || result.xPaymentResponse?.txHash,
        amount: aeonPaymentDetails.maxAmountRequired,
        network: aeonPaymentDetails.network,
      }
    } else {
      throw new Error(result.body.msg || 'Payment failed')
    }

  } catch (error: any) {
    console.error('Payment execution error:', error)

    onProgress?.({
      stage: 'failed',
      message: error.message || 'Payment failed',
      progress: 0
    })

    return {
      success: false,
      error: error.message || 'Payment execution failed. Please try again.'
    }
  }
}

/**
 * Convert X402PaymentRequest to Aeon402Response format
 * This is a helper when you have an X402 payment request but need Aeon format
 */
export function convertToAeonFormat(paymentRequest: X402PaymentRequest): Aeon402Response {
  return {
    maxAmountRequired: paymentRequest.maxAmountRequired,
    payTo: paymentRequest.payTo,
    asset: paymentRequest.asset,
    network: paymentRequest.network,
    scheme: 'exact', // Default scheme
    maxTimeoutSeconds: 60, // Default timeout
    resource: paymentRequest.resource || '',
    description: paymentRequest.description,
  }
}

/**
 * Check if the payment request is for Aeon API
 * You can extend this to support other payment providers
 */
export function isAeonPayment(paymentRequest: X402PaymentRequest): boolean {
  // Check if the resource or metadata indicates it's an Aeon payment
  return (
    paymentRequest.resource?.includes('aeon.xyz') ||
    paymentRequest.metadata?.provider === 'aeon'
  )
}
