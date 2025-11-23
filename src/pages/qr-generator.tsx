"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Share2, Copy, CheckCircle2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"
import QRCode from "qrcode"
import { encodeX402Payment, getTokenAddress, NETWORKS, type X402PaymentRequest } from "@/lib/x402"

type TokenSymbol = "USDC" | "DAI" | "ETH"
type NetworkKey = keyof typeof NETWORKS

export default function QrGenerator() {
  const navigate = useNavigate()
  const { user } = usePrivy()
  const [generated, setGenerated] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [x402Uri, setX402Uri] = useState("")

  // Form state
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState<TokenSymbol>("USDC")
  const [network, setNetwork] = useState<NetworkKey>("base")
  const [description, setDescription] = useState("")
  const [walletAddress, setWalletAddress] = useState("0x7fbbe68068a3aa7e479a1e51e792f4c2073b018f")

  // Aeon integration fields (optional)
  const [useAeon, setUseAeon] = useState(false)
  const [aeonAppId, setAeonAppId] = useState("TEST000001")
  const [aeonQrCode, setAeonQrCode] = useState("")

  // Load wallet address from user or agent
  useEffect(() => {
    // TODO: Get actual wallet address from Privy or created agent
    const agentData = localStorage.getItem("agent-data")
    if (agentData) {
      const parsed = JSON.parse(agentData)
      // Use agent wallet address if available
      setWalletAddress("0x7fbbe68068a3aa7e479a1e51e792f4c2073b018f") // TODO: Replace with actual agent address
    } else if (user?.wallet?.address) {
      setWalletAddress(user.wallet.address)
    }
  }, [user])

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!walletAddress) {
      toast.error("Wallet address not available")
      return
    }

    try {
      // Get token contract address for the selected network
      const tokenAddress = getTokenAddress(token, network)

      // Create x402 payment request
      const paymentRequest: X402PaymentRequest = {
        maxAmountRequired: amount,
        resource: useAeon && aeonQrCode ? aeonQrCode : `/p2p-payment/${Date.now()}`,
        payTo: walletAddress as `0x${string}`,
        asset: tokenAddress as `0x${string}`,
        network: network,
        description: description || `Payment request for ${amount} ${token}`,
        metadata: {
          itemName: description || "Payment Request",
          timestamp: Date.now(),
          seller: walletAddress,
          token: token,
          // Add Aeon metadata if enabled
          ...(useAeon && {
            provider: 'aeon',
            appId: aeonAppId,
            qrCode: aeonQrCode || `/p2p-payment/${Date.now()}`,
          }),
        }
      }

      // Log the payment request metadata to console
      console.log('=== x402 Payment Request Generated ===')
      console.log('Payment Request:', paymentRequest)
      console.log('Metadata:', paymentRequest.metadata)
      console.log('Full Payload (JSON):', JSON.stringify(paymentRequest, null, 2))

      // Encode to x402 URI
      const uri = encodeX402Payment(paymentRequest)
      console.log('Encoded x402 URI:', uri)
      setX402Uri(uri)

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(uri, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      setQrCodeDataUrl(qrDataUrl)
      setGenerated(true)
      toast.success("QR code generated successfully!")

    } catch (error) {
      console.error("Error generating QR code:", error)
      toast.error("Failed to generate QR code")
    }
  }

  const handleDownload = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.href = qrCodeDataUrl
    link.download = `payment-qr-${token}-${amount}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("QR code downloaded!")
  }

  const handleShare = async () => {
    if (!qrCodeDataUrl) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'payment-qr.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Payment Request: ${amount} ${token}`,
          text: `Scan to pay ${amount} ${token} on ${NETWORKS[network].name}`,
          files: [file],
        })
        toast.success("QR code shared!")
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(x402Uri)
        toast.success("Payment link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast.error("Failed to share QR code")
    }
  }

  const handleCopyUri = () => {
    navigator.clipboard.writeText(x402Uri)
    toast.success("Payment URI copied to clipboard!")
  }

  const handleReset = () => {
    setGenerated(false)
    setQrCodeDataUrl("")
    setX402Uri("")
    setAmount("")
    setDescription("")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/payments" className="text-muted-foreground hover:text-foreground flex items-center mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Payments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Generate Payment QR</h1>
          <p className="text-muted-foreground mt-2">Create a QR code to request payment across any supported chain.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Enter the amount and token you want to receive</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateQR} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={generated}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Token *</Label>
                    <Select
                      value={token}
                      onValueChange={(value) => setToken(value as TokenSymbol)}
                      disabled={generated}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="DAI">DAI</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Network *</Label>
                  <Select
                    value={network}
                    onValueChange={(value) => setNetwork(value as NetworkKey)}
                    disabled={generated}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base (Recommended)</SelectItem>
                      <SelectItem value="base-sepolia">Base Sepolia (Testnet)</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g. MacBook Pro, Consulting services, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={generated}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Receiving Wallet</Label>
                  <Input
                    value={walletAddress}
                    readOnly
                    className="font-mono text-xs"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Funds will be sent to this address
                  </p>
                </div>

                {!generated ? (
                  <Button type="submit" className="w-full" size="lg">
                    Generate QR Code
                  </Button>
                ) : (
                  <Button type="button" onClick={handleReset} variant="outline" className="w-full">
                    Generate New QR
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center">
            {generated && qrCodeDataUrl ? (
              <div className="space-y-6 text-center w-full">
                <Card className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <img
                        src={qrCodeDataUrl}
                        alt="Payment QR Code"
                        className="w-full max-w-[320px] h-auto rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-muted/50 rounded-lg p-4 w-full">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold">{amount} {token}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network:</span>
                          <span className="font-semibold">{NETWORKS[network].name}</span>
                        </div>
                        {description && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="font-semibold text-right truncate max-w-[150px]">{description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center w-full">
                  <Button variant="outline" onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>

                {/* Copy URI */}
                <div className="w-full">
                  <Label className="text-xs text-muted-foreground">x402 Payment URI</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={x402Uri}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button variant="ghost" size="sm" onClick={handleCopyUri}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Scan this code with any compatible wallet to send payment instantly across chains.
                </p>
              </div>
            ) : (
              <div className="text-center p-12 border rounded-xl border-dashed bg-muted/10 w-full h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">No QR Code Generated</h3>
                <p className="text-muted-foreground text-sm">Fill out the form to generate a payment request</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
