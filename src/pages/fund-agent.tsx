"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Info, ArrowRight, CheckCircle2, AlertCircle, Wallet, QrCode, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { usePrivy } from "@privy-io/react-auth"

type FundingStatus = "pending" | "checking" | "funded"

export default function FundAgent() {
  const navigate = useNavigate()
  const { user } = usePrivy()
  const [fundingStatus, setFundingStatus] = useState<FundingStatus>("pending")
  const [agentData, setAgentData] = useState<any>(null)
  const [showQR, setShowQR] = useState(false)

  // Mock agent address - replace with actual from SDK
  const agentAddress = "0x1234567890abcdef1234567890abcdef12345678"
  const ensName = agentData?.ensName || null

  useEffect(() => {
    // Load agent data from localStorage
    const savedAgentData = localStorage.getItem("agent-data")
    if (savedAgentData) {
      setAgentData(JSON.parse(savedAgentData))
    }

    // Start monitoring for funding
    checkFundingStatus()

    // Poll every 10 seconds to check if funded
    const interval = setInterval(checkFundingStatus, 10000)

    return () => clearInterval(interval)
  }, [])

  const checkFundingStatus = async () => {
    try {
      // TODO: Implement actual balance check using CDP SDK or ethers.js
      // Example:
      // const provider = new ethers.providers.JsonRpcProvider(...)
      // const balance = await provider.getBalance(agentAddress)
      // if (balance.gt(0)) setFundingStatus("funded")

      // For now, simulate checking
      // This would be replaced with actual blockchain query
    } catch (error) {
      console.error("Error checking funding status:", error)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(agentAddress)
    toast.success("Address copied to clipboard")
  }

  const copyEnsName = () => {
    if (ensName) {
      navigator.clipboard.writeText(ensName)
      toast.success("ENS name copied to clipboard")
    }
  }

  const handleManualVerify = async () => {
    setFundingStatus("checking")
    toast.info("Checking for funds...")

    // TODO: Replace with actual balance check
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate funded status for demo
    // In production, this checks actual on-chain balance
    const isFunded = true // Replace with actual balance > 0 check

    if (isFunded) {
      setFundingStatus("funded")
      toast.success("Agent is funded and ready!")

      // Update agent status
      if (agentData) {
        agentData.status = "funded"
        agentData.fundedAt = new Date().toISOString()
        localStorage.setItem("agent-data", JSON.stringify(agentData))
      }
    } else {
      setFundingStatus("pending")
      toast.error("No funds detected yet. Please send ETH to your agent.")
    }
  }

  const handleContinueToDashboard = () => {
    navigate("/dashboard")
  }

  const generateQRCode = () => {
    // In a real app, you'd use a library like qrcode or qrcode.react
    setShowQR(true)
    toast.info("QR code feature coming soon!")
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fund Your Agent</h1>
              <p className="text-muted-foreground mt-2">
                Deposit assets to enable your agent to execute strategies and payments.
              </p>
            </div>
            <Badge
              variant={fundingStatus === "funded" ? "default" : "secondary"}
              className={fundingStatus === "funded" ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {fundingStatus === "funded" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Funded
                </>
              ) : fundingStatus === "checking" ? (
                "Checking..."
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Awaiting Funds
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Agent Info Card */}
        {agentData && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{agentData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Profile:</span>
                <Badge variant="outline" className="capitalize">
                  {agentData.riskTolerance}
                </Badge>
              </div>
              {ensName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ENS Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono text-sm">{ensName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyEnsName}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wallet Address Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Agent Wallet Address
            </CardTitle>
            <CardDescription>
              {ensName
                ? `Send funds to ${ensName} or the address below`
                : "Send ETH, USDC, or other supported tokens to this address"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ENS Name (if available) */}
            {ensName && (
              <div className="space-y-2">
                <label className="text-sm font-medium">ENS Name</label>
                <div className="flex gap-2">
                  <Input value={ensName} readOnly className="font-mono" />
                  <Button variant="outline" onClick={copyEnsName}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex gap-2">
                <Input value={agentAddress} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={generateQRCode}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-500">Recommended Minimum Balance</p>
                  <p className="text-muted-foreground">
                    Fund your agent with at least <strong>0.1 ETH</strong> to cover gas fees for
                    transactions and autonomous operations. Your agent can also hold USDC, DAI, and
                    other ERC-20 tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Fund */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  1
                </span>
                How to Fund Your Agent
              </h3>
              <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Copy the agent address {ensName && "or ENS name"} above</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Open your personal wallet (MetaMask, Coinbase Wallet, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Select "Send" and paste the address</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Enter the amount and confirm the transaction</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Click "Verify Funding" below once the transaction is confirmed</span>
                </div>
              </div>
            </div>

            {/* Verify Funding Button */}
            <Button
              onClick={handleManualVerify}
              disabled={fundingStatus === "checking" || fundingStatus === "funded"}
              className="w-full"
              size="lg"
            >
              {fundingStatus === "checking"
                ? "Checking Balance..."
                : fundingStatus === "funded"
                ? "Agent Funded ✓"
                : "Verify Funding"}
            </Button>
          </CardContent>
        </Card>

        {/* Bridge Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bridge Assets (Optional)</CardTitle>
            <CardDescription>
              Move assets from other networks to your agent's network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your agent operates on Base network. If you have funds on Ethereum mainnet, Optimism,
              or Arbitrum, you can bridge them to Base for lower gas fees.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href="https://bridge.base.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center"
                >
                  Base Bridge
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href="https://app.across.to"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center"
                >
                  Across Bridge
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success State */}
        {fundingStatus === "funded" && (
          <Card className="border-green-500/30 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Agent Successfully Funded!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your agent is now active and ready to execute autonomous operations.
                  </p>
                </div>
                <Button
                  onClick={handleContinueToDashboard}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip Option */}
        {fundingStatus === "pending" && (
          <Card>
            <CardFooter className="pt-6">
              <Button
                variant="ghost"
                onClick={handleContinueToDashboard}
                className="w-full"
              >
                Skip for now and fund later
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
