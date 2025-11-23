"use client"

import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Bot, Shield, Zap, Key, ExternalLink, AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

type FormStep = "config" | "credentials" | "deploying"

interface AgentConfig {
  name: string
  riskTolerance: "conservative" | "balanced" | "aggressive"
  assetAllocation: number
  spendingLimit: string
  spendingToken: string
}

interface CDPCredentials {
  apiKeyId: string
  apiKeySecret: string
  walletSecret: string
}

export default function CreateAgent() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<FormStep>("config")
  const [isLoading, setIsLoading] = useState(false)

  // Form data state
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: "",
    riskTolerance: "balanced",
    assetAllocation: 60,
    spendingLimit: "1000",
    spendingToken: "usdc"
  })

  const [cdpCredentials, setCdpCredentials] = useState<CDPCredentials>({
    apiKeyId: "",
    apiKeySecret: "",
    walletSecret: ""
  })

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agentConfig.name.trim()) {
      toast.error("Please enter an agent name")
      return
    }
    setCurrentStep("credentials")
  }

  const handleDeployAgent = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate CDP credentials
    if (!cdpCredentials.apiKeyId || !cdpCredentials.apiKeySecret || !cdpCredentials.walletSecret) {
      toast.error("Please fill in all CDP credentials")
      return
    }

    setIsLoading(true)
    setCurrentStep("deploying")

    try {
      // TODO: Replace with actual SDK call from your friend's SDK
      // Example: await createAgentWithCDP(agentConfig, cdpCredentials)

      // Simulate agent deployment
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Store agent data in localStorage (temporary - replace with actual backend)
      const agentData = {
        ...agentConfig,
        createdAt: new Date().toISOString(),
        status: "deployed"
      }
      localStorage.setItem("agent-created", "true")
      localStorage.setItem("agent-data", JSON.stringify(agentData))

      toast.success("Agent deployed successfully!")

      // Navigate to ENS setup page
      navigate("/ens-setup")

    } catch (error) {
      console.error("Error deploying agent:", error)
      toast.error("Failed to deploy agent. Please try again.")
      setCurrentStep("credentials")
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep === "credentials") {
      setCurrentStep("config")
    }
  }

  const updateAgentConfig = (field: keyof AgentConfig, value: any) => {
    setAgentConfig(prev => ({ ...prev, [field]: value }))
  }

  const updateCDPCredentials = (field: keyof CDPCredentials, value: string) => {
    setCdpCredentials(prev => ({ ...prev, [field]: value }))
  }

  // Step indicator
  const steps = [
    { id: "config", label: "Configuration" },
    { id: "credentials", label: "CDP Credentials" },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Your AI Agent</h1>
          <p className="text-muted-foreground mt-2">
            Deploy an autonomous crypto agent with its own wallet and strategies.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${index <= currentStepIndex ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-4 ${index < currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Agent Configuration */}
        {currentStep === "config" && (
          <form onSubmit={handleConfigSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
                <CardDescription>Define how your agent should operate and manage funds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Prime Alpha Agent"
                    value={agentConfig.name}
                    onChange={(e) => updateAgentConfig("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors bg-card hover:bg-accent/50 ${agentConfig.riskTolerance === "conservative" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => updateAgentConfig("riskTolerance", "conservative")}
                    >
                      <Shield className="h-6 w-6 mb-2 text-green-500" />
                      <div className="font-medium">Conservative</div>
                      <div className="text-xs text-muted-foreground mt-1">Stablecoins & Blue chips</div>
                    </div>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors bg-card hover:bg-accent/50 ${agentConfig.riskTolerance === "balanced" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => updateAgentConfig("riskTolerance", "balanced")}
                    >
                      <Bot className="h-6 w-6 mb-2 text-blue-500" />
                      <div className="font-medium">Balanced</div>
                      <div className="text-xs text-muted-foreground mt-1">Mix of assets</div>
                    </div>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors bg-card hover:bg-accent/50 ${agentConfig.riskTolerance === "aggressive" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => updateAgentConfig("riskTolerance", "aggressive")}
                    >
                      <Zap className="h-6 w-6 mb-2 text-orange-500" />
                      <div className="font-medium">Aggressive</div>
                      <div className="text-xs text-muted-foreground mt-1">High growth potential</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Asset Allocation Preference</Label>
                    <span className="text-sm text-muted-foreground">{agentConfig.assetAllocation}% Volatile</span>
                  </div>
                  <Slider
                    value={[agentConfig.assetAllocation]}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateAgentConfig("assetAllocation", value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mostly Stable</span>
                    <span>Balanced</span>
                    <span>Mostly Volatile</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spending">Spending Limit (Monthly)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="spending"
                      type="number"
                      placeholder="1000"
                      value={agentConfig.spendingLimit}
                      onChange={(e) => updateAgentConfig("spendingLimit", e.target.value)}
                    />
                    <Select
                      value={agentConfig.spendingToken}
                      onValueChange={(value) => updateAgentConfig("spendingToken", value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eth">ETH</SelectItem>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="dai">DAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" type="button" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit">
                  Next
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* Step 2: CDP Credentials */}
        {currentStep === "credentials" && (
          <form onSubmit={handleDeployAgent}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Coinbase CDP Credentials
                </CardTitle>
                <CardDescription>
                  Your agent needs CDP API credentials to interact with blockchain networks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-blue-500">Why do we need these credentials?</p>
                      <p className="text-muted-foreground">
                        The CDP API credentials allow your agent to create its own wallet, sign transactions,
                        and execute on-chain actions autonomously. Your credentials are stored securely and
                        never leave your device.
                      </p>
                      <a
                        href="https://portal.cdp.coinbase.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-500 hover:underline font-medium"
                      >
                        Get your CDP credentials here
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* CDP API Key ID */}
                <div className="space-y-2">
                  <Label htmlFor="apiKeyId">CDP API Key ID</Label>
                  <Input
                    id="apiKeyId"
                    type="text"
                    placeholder="Enter your CDP API Key ID"
                    value={cdpCredentials.apiKeyId}
                    onChange={(e) => updateCDPCredentials("apiKeyId", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in the CDP dashboard under API Keys
                  </p>
                </div>

                {/* CDP API Key Secret */}
                <div className="space-y-2">
                  <Label htmlFor="apiKeySecret">CDP API Key Secret</Label>
                  <Input
                    id="apiKeySecret"
                    type="password"
                    placeholder="Enter your CDP API Key Secret"
                    value={cdpCredentials.apiKeySecret}
                    onChange={(e) => updateCDPCredentials("apiKeySecret", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secret secure - it will be encrypted
                  </p>
                </div>

                {/* CDP Wallet Secret */}
                <div className="space-y-2">
                  <Label htmlFor="walletSecret">CDP Wallet Secret</Label>
                  <Input
                    id="walletSecret"
                    type="password"
                    placeholder="Enter your CDP Wallet Secret"
                    value={cdpCredentials.walletSecret}
                    onChange={(e) => updateCDPCredentials("walletSecret", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to secure your agent's wallet
                  </p>
                </div>

                {/* Security Notice */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-500">Security Notice</p>
                      <p className="text-muted-foreground mt-1">
                        These credentials grant full access to your agent's wallet. Never share them
                        and ensure you're using the official CDP portal to generate them.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" type="button" onClick={handleBack} disabled={isLoading}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying Agent...
                    </>
                  ) : (
                    "Deploy Agent"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* Step 3: Deploying (Loading State) */}
        {currentStep === "deploying" && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Deploying Your Agent</h3>
                  <p className="text-muted-foreground mt-2">
                    Creating wallet, configuring strategies, and setting up your autonomous agent...
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-muted-foreground">Initializing CDP connection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-muted-foreground">Creating agent wallet</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-muted-foreground">Configuring strategies</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
