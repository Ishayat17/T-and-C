"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Link, FileText, AlertTriangle, CheckCircle, XCircle, Play, Brain } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface AnalysisResult {
  summary: string
  keyPoints: string[]
  riskAssessment: {
    level: "low" | "medium" | "high"
    score: number
    concerns: string[]
  }
  categories: {
    dataCollection: string
    liability: string
    termination: string
    userRights: string
  }
}

interface ApiError {
  error: string
  type?: string
  helpUrl?: string
}

export default function TermsAnalyzer() {
  const [activeTab, setActiveTab] = useState("paste")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [pastedText, setPastedText] = useState("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = ["application/pdf", "text/plain"]

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setError("")
      } else {
        setError("Please upload a PDF or text file")
      }
    }
  }

  const analyzeDocument = async (useDemo = false) => {
    setIsAnalyzing(true)
    setError("")

    try {
      const formData = new FormData()

      if (useDemo) {
        formData.append("demo", "true")
      } else if (activeTab === "upload" && file) {
        formData.append("file", file)
      } else if (activeTab === "url" && url) {
        formData.append("url", url)
      } else if (activeTab === "paste" && pastedText.trim()) {
        formData.append("text", pastedText.trim())
      } else {
        throw new Error("Please provide a file, URL, or paste some text")
      }

      console.log("Making API request...")
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)

        try {
          const errorJson = JSON.parse(errorText)
          const apiError = errorJson as ApiError
          throw new Error(apiError.error || "Failed to analyze document")
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }

      const result = await response.json()
      console.log("Analysis result received:", !!result)
      setAnalysis(result)
    } catch (err) {
      console.error("Analysis error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "high":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="h-4 w-4" />
      case "medium":
        return <AlertTriangle className="h-4 w-4" />
      case "high":
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions Analyzer</h1>
          <p className="text-lg text-gray-600">Understand what you're agreeing to with intelligent text analysis</p>
        </div>

        {/* Demo Mode Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Play className="h-5 w-5" />
              Try Demo Mode
            </CardTitle>
            <CardDescription className="text-blue-700">
              Experience the analyzer with a comprehensive sample analysis - see how it identifies risks and key points!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => analyzeDocument(true)}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? "Loading Demo..." : "View Sample Analysis"}
            </Button>
          </CardContent>
        </Card>

        {/* Features Notice */}
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>Intelligent Analysis:</strong> This analyzer uses advanced text processing to identify key terms,
            assess risks, and categorize important clauses in terms and conditions documents. No external APIs required
            - everything runs locally for your privacy!
          </AlertDescription>
        </Alert>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload or Link Your Document
            </CardTitle>
            <CardDescription>
              Upload files (PDF, text), provide a URL, or paste text to analyze terms and conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Enter URL
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload PDF or Text File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Terms & Conditions URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/terms"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paste-text">Paste Terms & Conditions Text</Label>
                  <textarea
                    id="paste-text"
                    className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste the terms and conditions text here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                  {pastedText.trim() && (
                    <p className="text-sm text-gray-600">
                      Character count: {pastedText.length} (approximately {Math.ceil(pastedText.split(/\s+/).length)}{" "}
                      words)
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => analyzeDocument(false)}
              disabled={isAnalyzing || (!file && !url && !pastedText.trim())}
              className="w-full mt-4"
              size="lg"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Terms & Conditions"}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysis && (
          <div className="space-y-6">
            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRiskIcon(analysis.riskAssessment.level)}
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={getRiskColor(analysis.riskAssessment.level)}>
                    {analysis.riskAssessment.level.toUpperCase()} RISK
                  </Badge>
                  <span className="text-sm text-gray-600">Score: {analysis.riskAssessment.score}/100</span>
                </div>

                {analysis.riskAssessment.concerns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-700">Key Concerns:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.riskAssessment.concerns.map((concern, index) => (
                        <li key={index} className="text-sm text-red-600">
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Collection & Privacy</h4>
                  <p className="text-gray-700 text-sm">{analysis.categories.dataCollection}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Liability & Responsibility</h4>
                  <p className="text-gray-700 text-sm">{analysis.categories.liability}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Termination</h4>
                  <p className="text-gray-700 text-sm">{analysis.categories.termination}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">User Rights & Obligations</h4>
                  <p className="text-gray-700 text-sm">{analysis.categories.userRights}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
