/**
 * x402 Payment Request Protocol
 * Cross-chain payment standard for QR code payments
 */

export interface X402PaymentRequest {
  // Required fields
  maxAmountRequired: string // Amount in token units (e.g., "500" for 500 USDC)
  resource: string // Unique identifier for this payment
  payTo: `0x${string}` // Recipient wallet address
  asset: `0x${string}` // Token contract address
  network: string // Chain name (e.g., "base", "ethereum", "arbitrum")

  // Optional fields
  description?: string // Payment description
  metadata?: {
    itemName?: string
    itemDescription?: string
    timestamp?: number
    seller?: string
    [key: string]: any
  }
}

export interface PaymentResult {
  success: boolean
  transactionHash?: string
  amount?: string
  network?: string
  error?: string
}

export interface PaymentStage {
  stage: 'parsing' | 'checking' | 'bridging' | 'executing' | 'complete' | 'failed'
  message: string
  progress?: number // 0-100
}

/**
 * Network configurations
 */
export const NETWORKS = {
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
  },
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
  },
} as const

/**
 * Common token addresses by network
 */
export const TOKENS = {
  USDC: {
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  DAI: {
    base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    'base-sepolia': '0x0000000000000000000000000000000000000000',
    ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    optimism: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    arbitrum: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  },
  ETH: {
    base: '0x0000000000000000000000000000000000000000',
    'base-sepolia': '0x0000000000000000000000000000000000000000',
    ethereum: '0x0000000000000000000000000000000000000000',
    optimism: '0x0000000000000000000000000000000000000000',
    arbitrum: '0x0000000000000000000000000000000000000000',
  },
} as const

/**
 * Browser-compatible base64 encoding
 */
function base64Encode(str: string): string {
  // Use btoa for browser compatibility
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  }))
}

/**
 * Browser-compatible base64 decoding
 */
function base64Decode(str: string): string {
  // Use atob for browser compatibility
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c: string) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

/**
 * Encode payment request to x402 URI format
 */
export function encodeX402Payment(request: X402PaymentRequest): string {
  // 1. Convert to JSON
  const payload = JSON.stringify(request)

  // 2. Encode to base64 (browser-compatible)
  const base64Payload = base64Encode(payload)

  // 3. Add x402 protocol prefix
  return `x402://${base64Payload}`
}

/**
 * Decode x402 URI to payment request
 */
export function decodeX402Payment(uri: string): X402PaymentRequest {
  // 1. Validate x402 prefix
  if (!uri.startsWith('x402://')) {
    throw new Error('Invalid x402 URI: must start with x402://')
  }

  // 2. Extract base64 payload
  const base64Payload = uri.replace('x402://', '')

  // 3. Decode from base64 (browser-compatible)
  const jsonPayload = base64Decode(base64Payload)

  // 4. Parse JSON
  const paymentRequest = JSON.parse(jsonPayload) as X402PaymentRequest

  // 5. Validate required fields
  if (!paymentRequest.maxAmountRequired) {
    throw new Error('Invalid payment request: missing maxAmountRequired')
  }
  if (!paymentRequest.payTo) {
    throw new Error('Invalid payment request: missing payTo')
  }
  if (!paymentRequest.asset) {
    throw new Error('Invalid payment request: missing asset')
  }
  if (!paymentRequest.network) {
    throw new Error('Invalid payment request: missing network')
  }

  return paymentRequest
}

/**
 * Get token info by symbol and network
 */
export function getTokenAddress(symbol: keyof typeof TOKENS, network: keyof typeof NETWORKS): string {
  const tokenAddresses = TOKENS[symbol]
  if (!tokenAddresses) {
    throw new Error(`Unknown token: ${symbol}`)
  }

  const address = tokenAddresses[network]
  if (!address) {
    throw new Error(`Token ${symbol} not available on ${network}`)
  }

  return address
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length < chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string | number, decimals = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerUrl(network: keyof typeof NETWORKS, txHash: string): string {
  const networkConfig = NETWORKS[network]
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`)
  }
  return `${networkConfig.blockExplorer}/tx/${txHash}`
}
