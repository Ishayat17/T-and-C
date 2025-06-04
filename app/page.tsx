"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Link,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Share2,
  History,
  Bookmark,
  Download,
  Printer,
  Lightbulb,
  Sparkles,
  Search,
  Eye,
  MapPin,
  Clock,
  FileType,
  Zap,
  Brain,
  Cpu,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TextHighlight {
  start: number
  end: number
  category: string
  term: string
  severity: "low" | "medium" | "high"
}

interface KeyPoint {
  text: string
  category: string
  severity: "low" | "medium" | "high"
  evidence: string[]
  positions: number[]
}

interface Concern {
  text: string
  severity: "low" | "medium" | "high"
  category: string
  positions: number[]
}

interface CategoryDetail {
  summary: string
  details: Array<{ term: string; count: number; positions: number[] }>
  score: number
  riskLevel: "low" | "medium" | "high"
}

interface AnalysisResult {
  summary: string
  keyPoints: KeyPoint[] | string[]
  riskAssessment: {
    level: "low" | "medium" | "high"
    score: number
    concerns: Concern[] | string[]
  }
  categories: {
    dataCollection: CategoryDetail | string
    liability: CategoryDetail | string
    termination: CategoryDetail | string
    userRights: CategoryDetail | string
  }
  textHighlights?: TextHighlight[]
  originalText: string
  wordCount: number
  readingTime: number
  categoryBreakdown?: Array<{
    category: string
    score: number
    percentage: number
  }>
}

interface ApiError {
  error: string
  type?: string
  helpUrl?: string
}

interface AnalysisHistory {
  id: string
  title: string
  date: string
  riskLevel: "low" | "medium" | "high"
  score: number
}

export default function TermsAnalyzer() {
  const [activeTab, setActiveTab] = useState("paste")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [pastedText, setPastedText] = useState("")
  const [documentTitle, setDocumentTitle] = useState("Untitled Document")
  const [showTips, setShowTips] = useState(true)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([])
  const [savedAnalyses, setSavedAnalyses] = useState<AnalysisHistory[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonAnalysis, setComparisonAnalysis] = useState<AnalysisResult | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState("")
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" })
  const [privateDocuments, setPrivateDocuments] = useState<AnalysisHistory[]>([])

  // Interactive features
  const [showHighlights, setShowHighlights] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConcern, setSelectedConcern] = useState<number | null>(null)
  const [hoveredKeyPoint, setHoveredKeyPoint] = useState<number | null>(null)
  const [showOriginalText, setShowOriginalText] = useState(false)

  // Move this function up before the useMemo hooks
  const getHighlightClass = (category: string, severity: "low" | "medium" | "high") => {
    const baseClass = "px-1 py-0.5 rounded cursor-pointer transition-all hover:scale-105"

    if (severity === "high") {
      return `${baseClass} bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700`
    } else if (severity === "medium") {
      return `${baseClass} bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700`
    } else {
      return `${baseClass} bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700`
    }
  }

  // Detect document title from text
  useEffect(() => {
    if (pastedText) {
      const lines = pastedText.split("\n").filter((line) => line.trim().length > 0)
      if (lines.length > 0) {
        const firstLine = lines[0].trim()
        if (firstLine.length < 100) {
          setDocumentTitle(firstLine)
        }
      }
    }
  }, [pastedText])

  // Mock history data
  useEffect(() => {
    setAnalysisHistory([
      {
        id: "hist-1",
        title: "Netflix Terms of Service",
        date: "2 days ago",
        riskLevel: "medium",
        score: 58,
      },
      {
        id: "hist-2",
        title: "Spotify Privacy Policy",
        date: "1 week ago",
        riskLevel: "medium",
        score: 62,
      },
      {
        id: "hist-3",
        title: "Adobe Creative Cloud Terms",
        date: "2 weeks ago",
        riskLevel: "high",
        score: 78,
      },
    ])

    setSavedAnalyses([
      {
        id: "saved-1",
        title: "GitHub Terms of Service",
        date: "Saved 3 days ago",
        riskLevel: "low",
        score: 35,
      },
      {
        id: "saved-2",
        title: "Apple App Store Guidelines",
        date: "Saved 1 week ago",
        riskLevel: "high",
        score: 72,
      },
    ])
  }, [])

  // Filter highlights based on selected category
  const filteredHighlights = useMemo(() => {
    if (!analysis?.textHighlights) return []

    let highlights = analysis.textHighlights

    if (selectedCategory && selectedCategory !== "all") {
      highlights = highlights.filter((h) => h.category === selectedCategory)
    }

    if (searchTerm) {
      highlights = highlights.filter((h) => h.term.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    return highlights
  }, [analysis?.textHighlights, selectedCategory, searchTerm])

  // Generate highlighted text
  const highlightedText = useMemo(() => {
    if (!analysis?.originalText || !showHighlights) return analysis?.originalText || ""

    const text = analysis.originalText
    const highlights = filteredHighlights

    if (highlights.length === 0) return text

    // Sort highlights by start position (descending) to avoid position shifts
    const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start)

    let result = text

    sortedHighlights.forEach((highlight, index) => {
      const { start, end, category, severity } = highlight
      const highlightClass = getHighlightClass(category, severity)
      const highlightId = `highlight-${index}`

      const before = result.substring(0, start)
      const highlighted = result.substring(start, end)
      const after = result.substring(end)

      result = `${before}<span id="${highlightId}" class="${highlightClass}" data-category="${category}" data-severity="${severity}" title="${highlight.term}">${highlighted}</span>${after}`
    })

    return result
  }, [analysis?.originalText, filteredHighlights, showHighlights])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = ["application/pdf", "text/plain"]

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
        setError("")
      } else {
        setError("Please upload a PDF or text file")
      }
    }
  }

  const analyzeDocument = async (useDemo = false) => {
    setIsAnalyzing(true)
    setError("")
    setAnalysisProgress(0)
    setAnalysisStage("Initializing...")

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

      // Simulate progress stages
      setAnalysisStage("Preparing document...")
      setAnalysisProgress(10)

      console.log("Making API request...")
      setAnalysisStage("Sending to AI...")
      setAnalysisProgress(25)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      setAnalysisStage("AI processing document...")
      setAnalysisProgress(50)

      console.log("Response status:", response.status)

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

      setAnalysisStage("Parsing AI response...")
      setAnalysisProgress(75)

      const result = await response.json()
      console.log("Analysis result received:", !!result)

      setAnalysisStage("Finalizing analysis...")
      setAnalysisProgress(90)

      setAnalysis(result)

      // Add to history
      if (!useDemo) {
        const newHistoryItem: AnalysisHistory = {
          id: `hist-${Date.now()}`,
          title: documentTitle,
          date: "Just now",
          riskLevel: result.riskAssessment.level,
          score: result.riskAssessment.score,
        }
        setAnalysisHistory((prev) => [newHistoryItem, ...prev])

        // Save to private documents if user is logged in
        if (user) {
          setPrivateDocuments((prev) => [{ ...newHistoryItem, id: `private-${Date.now()}` }, ...prev])
        }
      }

      setAnalysisStage("Complete!")
      setAnalysisProgress(100)

      // Clear progress after a short delay
      setTimeout(() => {
        setAnalysisProgress(0)
        setAnalysisStage("")
      }, 1000)
    } catch (err) {
      console.error("Analysis error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
      setAnalysisProgress(0)
      setAnalysisStage("")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadComparisonDemo = () => {
    // Create a mock comparison analysis with different risk profile
    const mockComparison: AnalysisResult = {
      summary:
        "This comparison document shows lower risk terms with more user-friendly policies and clearer data protection measures.",
      keyPoints: [
        "Service collects basic personal data for account functionality",
        "Clear process for handling service interruptions",
        "30-day notice required for account termination",
        "Multiple options for dispute resolution",
      ],
      riskAssessment: {
        level: "low",
        score: 32,
        concerns: ["Some data collection for personalization"],
      },
      categories: {
        dataCollection: "Limited data collection with user control",
        liability: "Fair liability distribution",
        termination: "30-day notice required",
        userRights: "Strong user rights protection",
      },
      originalText: "Sample comparison document with lower risk terms...",
      wordCount: 500,
      readingTime: 3,
    }

    setComparisonAnalysis(mockComparison)
    setShowComparison(true)
  }

  const saveCurrentAnalysis = () => {
    if (analysis) {
      const newSavedItem: AnalysisHistory = {
        id: `saved-${Date.now()}`,
        title: documentTitle,
        date: `Saved just now`,
        riskLevel: analysis.riskAssessment.level,
        score: analysis.riskAssessment.score,
      }
      setSavedAnalyses((prev) => [newSavedItem, ...prev])
    }
  }

  const scrollToPosition = (position: number) => {
    if (showOriginalText) {
      const textElement = document.getElementById("original-text")
      if (textElement) {
        // Approximate scroll position based on character position
        const scrollPosition = (position / (analysis?.originalText.length || 1)) * textElement.scrollHeight
        textElement.scrollTop = scrollPosition
      }
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950"
      case "high":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate authentication
    if (authMode === "login") {
      // Mock login
      if (authForm.email && authForm.password) {
        setUser({
          id: "user-123",
          email: authForm.email,
          name: authForm.name || authForm.email.split("@")[0],
        })
        setShowAuthModal(false)
        setAuthForm({ email: "", password: "", name: "" })
      }
    } else {
      // Mock signup
      if (authForm.email && authForm.password && authForm.name) {
        setUser({
          id: "user-123",
          email: authForm.email,
          name: authForm.name,
        })
        setShowAuthModal(false)
        setAuthForm({ email: "", password: "", name: "" })
      }
    }
  }

  const handleLogout = () => {
    setUser(null)
    setPrivateDocuments([])
  }

  // Helper function to safely render category content
  const renderCategoryContent = (category: CategoryDetail | string) => {
    if (typeof category === "string") {
      return <p className="text-gray-700 dark:text-gray-300 text-sm">{category}</p>
    }
    return (
      <div>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{category.summary}</p>
        {category.details && category.details.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Key terms found:</h4>
            <div className="flex flex-wrap gap-1">
              {category.details.slice(0, 5).map((detail, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => {
                    if (detail.positions && detail.positions.length > 0) {
                      scrollToPosition(detail.positions[0])
                    }
                  }}
                >
                  {detail.term} ({detail.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800 text-white"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      } p-4 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Dark Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-center space-y-1">
            <h1 className={`text-4xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              AI Terms & Conditions Analyzer
            </h1>
            <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Powered by OpenAI GPT-4 for intelligent legal document analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} variant="outline">
                Login / Sign Up
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {darkMode ? "Dark" : "Light"}
              </span>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Demo Mode Card */}
            <Card className={darkMode ? "border-blue-800 bg-blue-900" : "border-blue-200 bg-blue-50"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-blue-300" : "text-blue-800"}`}>
                  <Brain className="h-5 w-5" />
                  GPT-4 Powered Demo
                </CardTitle>
                <CardDescription className={darkMode ? "text-blue-400" : "text-blue-700"}>
                  Experience intelligent analysis powered by OpenAI GPT-4
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => analyzeDocument(true)}
                  disabled={isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  {isAnalyzing ? "AI Analyzing..." : "Try AI Demo"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card className={darkMode ? "border-purple-800 bg-purple-900" : "border-purple-200 bg-purple-50"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
                  <Cpu className="h-5 w-5" />
                  GPT-4 Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={`text-sm space-y-2 ${darkMode ? "text-purple-200" : "text-purple-800"}`}>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Intelligent risk assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Context-aware analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Legal expertise built-in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>Comprehensive categorization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Interactive Controls */}
            {analysis && analysis.textHighlights && (
              <Card className={darkMode ? "border-green-800 bg-green-900" : "border-green-200 bg-green-50"}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-green-300" : "text-green-800"}`}>
                    <Zap className="h-5 w-5" />
                    Interactive Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Text Highlighting</Label>
                    <Switch checked={showHighlights} onCheckedChange={setShowHighlights} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Original Text View</Label>
                    <Switch checked={showOriginalText} onCheckedChange={setShowOriginalText} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Filter by Category</Label>
                    <select
                      value={selectedCategory || "all"}
                      onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : e.target.value)}
                      className={`w-full p-2 rounded border text-sm ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="all">All Categories</option>
                      <option value="dataCollection">Data Collection</option>
                      <option value="liability">Liability</option>
                      <option value="termination">Termination</option>
                      <option value="userRights">User Rights</option>
                      <option value="concerning">High Risk Terms</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Search Terms</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search highlighted terms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredHighlights.length} highlights found
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Stats */}
            {analysis && (
              <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Document Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Words
                    </span>
                    <span className="font-medium">{analysis.wordCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Reading Time
                    </span>
                    <span className="font-medium">{analysis.readingTime} min</span>
                  </div>
                  {analysis.textHighlights && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        AI Highlights
                      </span>
                      <span className="font-medium">{analysis.textHighlights.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Analyses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[180px] px-4">
                  {analysisHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 mb-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        darkMode ? "bg-gray-750" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm truncate max-w-[150px]">{item.title}</h4>
                        <Badge className={getRiskColor(item.riskLevel)}>
                          {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
                        <span className="text-xs font-medium">Score: {item.score}</span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Private Documents */}
            {user && (
              <Card className={darkMode ? "border-indigo-800 bg-indigo-900" : "border-indigo-200 bg-indigo-50"}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-indigo-300" : "text-indigo-800"}`}>
                    <Bookmark className="h-5 w-5" />
                    Private Documents
                  </CardTitle>
                  <CardDescription className={darkMode ? "text-indigo-400" : "text-indigo-700"}>
                    Your saved analyses (visible only to you)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[180px] px-4">
                    {privateDocuments.length > 0 ? (
                      privateDocuments.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors ${
                            darkMode ? "bg-indigo-800" : "bg-indigo-100"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm truncate max-w-[150px]">{item.title}</h4>
                            <Badge className={getRiskColor(item.riskLevel)}>
                              {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
                            <span className="text-xs font-medium">Score: {item.score}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No private documents yet. Analyze a document to save it here.
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            {showTips && (
              <Card className={darkMode ? "border-purple-800 bg-purple-900" : "border-purple-200 bg-purple-50"}>
                <CardHeader className="pb-2">
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
                    <Lightbulb className="h-5 w-5" />
                    AI Analysis Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className={`text-sm space-y-2 ${darkMode ? "text-purple-200" : "text-purple-800"}`}>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                      <span>AI provides context-aware risk assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                      <span>Intelligent categorization of legal terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                      <span>Comprehensive analysis of user rights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                      <span>PDF support with text extraction</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={darkMode ? "text-purple-300 hover:text-purple-100" : "text-purple-700"}
                    onClick={() => setShowTips(false)}
                  >
                    Dismiss
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Features Notice */}
            <Alert className={darkMode ? "border-indigo-800 bg-indigo-900/50" : "border-indigo-200 bg-indigo-50"}>
              <Sparkles className="h-4 w-4" />
              <AlertDescription className={darkMode ? "text-indigo-200" : "text-indigo-800"}>
                <strong>AI-Powered Analysis:</strong> Now using OpenAI GPT-4 for intelligent legal document analysis
                with context-aware risk assessment, comprehensive categorization, and expert-level insights. Upload
                PDFs, paste text, or provide URLs for instant analysis!
              </AlertDescription>
            </Alert>

            {/* Input Section */}
            <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  GPT-4 Document Analysis
                </CardTitle>
                <CardDescription>
                  Upload files (PDF, text), provide a URL, or paste text for intelligent GPT-4 powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="document-title">Document Title</Label>
                  <Input
                    id="document-title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="mt-1"
                    placeholder="Enter a title for this document"
                  />
                </div>

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
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p className="flex items-center gap-2">
                            <FileType className="h-4 w-4" />
                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          {file.type === "application/pdf" && (
                            <p className="text-blue-600 dark:text-blue-400 text-xs">✓ PDF text extraction supported</p>
                          )}
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
                        className={`w-full min-h-[200px] p-3 border rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Paste the terms and conditions text here..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                      />
                      {pastedText.trim() && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Character count: {pastedText.length} (approximately{" "}
                          {Math.ceil(pastedText.split(/\s+/).length)} words)
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <Alert className="mt-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/30">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-600 dark:text-red- dark:text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {isAnalyzing && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{analysisStage}</span>
                      <span className="text-gray-600 dark:text-gray-400">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="w-full" />
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Brain className="h-4 w-4 animate-pulse" />
                      <span>AI is analyzing your document... This may take 10-30 seconds</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    onClick={() => analyzeDocument(false)}
                    disabled={isAnalyzing || (!file && !url && !pastedText.trim())}
                    className="flex-1"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Brain className="h-4 w-4 mr-2 animate-pulse" />
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={loadComparisonDemo}
                          disabled={!analysis || showComparison}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Compare with another document</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={saveCurrentAnalysis} disabled={!analysis}>
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save analysis</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" disabled={!analysis}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <h4 className="font-medium">Share Analysis</h4>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {analysis && (
              <div className={showComparison ? "grid grid-cols-2 gap-4" : ""}>
                <div className="space-y-6">
                  {/* Risk Assessment */}
                  <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getRiskIcon(analysis.riskAssessment.level)}
                        AI Risk Assessment
                        {showComparison && <span className="text-sm font-normal ml-2">(Current Document)</span>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <Badge className={getRiskColor(analysis.riskAssessment.level)}>
                          {analysis.riskAssessment.level.toUpperCase()} RISK
                        </Badge>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>AI Score: {analysis.riskAssessment.score}/100</span>
                            <span
                              className={
                                analysis.riskAssessment.level === "low"
                                  ? "text-green-600 dark:text-green-400"
                                  : analysis.riskAssessment.level === "medium"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-red-600 dark:text-red-400"
                              }
                            >
                              {analysis.riskAssessment.level === "low"
                                ? "Low Risk"
                                : analysis.riskAssessment.level === "medium"
                                  ? "Medium Risk"
                                  : "High Risk"}
                            </span>
                          </div>
                          <Progress
                            value={analysis.riskAssessment.score}
                            max={100}
                            className={
                              analysis.riskAssessment.level === "low"
                                ? "bg-green-100 dark:bg-green-950"
                                : analysis.riskAssessment.level === "medium"
                                  ? "bg-yellow-100 dark:bg-yellow-950"
                                  : "bg-red-100 dark:bg-red-950"
                            }
                            indicatorClassName={
                              analysis.riskAssessment.level === "low"
                                ? "bg-green-600 dark:bg-green-500"
                                : analysis.riskAssessment.level === "medium"
                                  ? "bg-yellow-600 dark:bg-yellow-500"
                                  : "bg-red-600 dark:bg-red-500"
                            }
                          />
                        </div>
                      </div>

                      {analysis.riskAssessment.concerns.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-red-700 dark:text-red-400">AI-Identified Concerns:</h4>
                          <ul className="space-y-1">
                            {analysis.riskAssessment.concerns.map((concern, index) => (
                              <li key={index} className="text-sm text-red-600 dark:text-red-400">
                                {typeof concern === "string" ? concern : concern.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Summary */}
                  <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                    <CardHeader>
                      <CardTitle>AI Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Key Points */}
                  <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                    <CardHeader>
                      <CardTitle>AI-Identified Key Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {typeof point === "string" ? point : point.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Original Text Viewer */}
                  {showOriginalText && analysis.textHighlights && (
                    <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Original Text with AI Highlights
                        </CardTitle>
                        <CardDescription>AI-powered text highlighting - click highlights for details</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea id="original-text" className="h-[400px] w-full border rounded p-4">
                          <div
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: highlightedText }}
                          />
                        </ScrollArea>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {filteredHighlights.length} AI highlights • Click highlights for details
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Categories */}
                  <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                    <CardHeader>
                      <CardTitle>AI Category Analysis</CardTitle>
                      <div className="flex space-x-1 overflow-auto pb-2">
                        <Button
                          variant={activeCategory === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory("all")}
                          className="whitespace-nowrap"
                        >
                          All
                        </Button>
                        <Button
                          variant={activeCategory === "summary" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory("summary")}
                          className="whitespace-nowrap"
                        >
                          Summary
                        </Button>
                        <Button
                          variant={activeCategory === "dataCollection" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory("dataCollection")}
                          className="whitespace-nowrap"
                        >
                          Data Collection
                        </Button>
                        <Button
                          variant={activeCategory === "liability" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory("liability")}
                          className="whitespace-nowrap"
                        >
                          Liability
                        </Button>
                        <Button
                          variant={activeCategory === "termination" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory("termination")}
                          className="whitespace-nowrap"
                        >
                          Termination
                        </Button>
                        <Button
                          variant={activeCategory === "userRights" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveCategory("userRights")}
                          className="whitespace-nowrap"
                        >
                          User Rights
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(activeCategory === "all" || activeCategory === "summary") && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">AI Executive Summary</h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.summary}</p>
                        </div>
                      )}

                      {(activeCategory === "all" || activeCategory === "dataCollection") && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Data Collection & Privacy</h3>
                          {renderCategoryContent(analysis.categories.dataCollection)}
                        </div>
                      )}

                      {(activeCategory === "all" || activeCategory === "liability") && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Liability & Responsibility</h3>
                          {renderCategoryContent(analysis.categories.liability)}
                        </div>
                      )}

                      {(activeCategory === "all" || activeCategory === "termination") && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Account Termination</h3>
                          {renderCategoryContent(analysis.categories.termination)}
                        </div>
                      )}

                      {(activeCategory === "all" || activeCategory === "userRights") && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">User Rights & Obligations</h3>
                          {renderCategoryContent(analysis.categories.userRights)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison Document */}
                {showComparison && comparisonAnalysis && (
                  <div className="space-y-6">
                    <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getRiskIcon(comparisonAnalysis.riskAssessment.level)}
                          Risk Assessment
                          <span className="text-sm font-normal ml-2">(Comparison Document)</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                          <Badge className={getRiskColor(comparisonAnalysis.riskAssessment.level)}>
                            {comparisonAnalysis.riskAssessment.level.toUpperCase()} RISK
                          </Badge>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Score: {comparisonAnalysis.riskAssessment.score}/100</span>
                              <span
                                className={
                                  comparisonAnalysis.riskAssessment.level === "low"
                                    ? "text-green-600 dark:text-green-400"
                                    : comparisonAnalysis.riskAssessment.level === "medium"
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-600 dark:text-red-400"
                                }
                              >
                                {comparisonAnalysis.riskAssessment.level === "low"
                                  ? "Low Risk"
                                  : comparisonAnalysis.riskAssessment.level === "medium"
                                    ? "Medium Risk"
                                    : "High Risk"}
                              </span>
                            </div>
                            <Progress
                              value={comparisonAnalysis.riskAssessment.score}
                              max={100}
                              className={
                                comparisonAnalysis.riskAssessment.level === "low"
                                  ? "bg-green-100 dark:bg-green-950"
                                  : comparisonAnalysis.riskAssessment.level === "medium"
                                    ? "bg-yellow-100 dark:bg-yellow-950"
                                    : "bg-red-100 dark:bg-red-950"
                              }
                              indicatorClassName={
                                comparisonAnalysis.riskAssessment.level === "low"
                                  ? "bg-green-600 dark:bg-green-500"
                                  : comparisonAnalysis.riskAssessment.level === "medium"
                                    ? "bg-yellow-600 dark:bg-yellow-500"
                                    : "bg-red-600 dark:bg-red-500"
                              }
                            />
                          </div>
                        </div>

                        {comparisonAnalysis.riskAssessment.concerns.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-red-700 dark:text-red-400">Key Concerns:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {comparisonAnalysis.riskAssessment.concerns.map((concern, index) => (
                                <li key={index} className="text-sm text-red-600 dark:text-red-400">
                                  {typeof concern === "string" ? concern : concern.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}>
                      <CardHeader>
                        <CardTitle>Comparison Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {comparisonAnalysis.summary}
                            </p>
                          </div>

                          <Separator />

                          <div>
                            <h3 className="text-lg font-semibold mb-2">Key Differences</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium text-red-600 dark:text-red-400 mb-1">Current Document</h4>
                                <p>Risk Score: {analysis.riskAssessment.score}/100</p>
                                <p>Risk Level: {analysis.riskAssessment.level}</p>
                                <p>Concerns: {analysis.riskAssessment.concerns.length}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-green-600 dark:text-green-400 mb-1">
                                  Comparison Document
                                </h4>
                                <p>Risk Score: {comparisonAnalysis.riskAssessment.score}/100</p>
                                <p>Risk Level: {comparisonAnalysis.riskAssessment.level}</p>
                                <p>Concerns: {comparisonAnalysis.riskAssessment.concerns.length}</p>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h3 className="text-lg font-semibold mb-2">AI Recommendation</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {analysis.riskAssessment.score > comparisonAnalysis.riskAssessment.score
                                ? "The comparison document appears to have more user-friendly terms with lower risk factors. Consider reviewing the differences in data collection, liability, and user rights sections."
                                : "The current document has comparable or better terms than the comparison document. Both documents should be reviewed carefully before acceptance."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>{authMode === "login" ? "Login" : "Sign Up"}</CardTitle>
                <CardDescription>
                  {authMode === "login"
                    ? "Access your private document analyses"
                    : "Create an account to save and manage your analyses"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === "signup" && (
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={authForm.name}
                        onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                        required={authMode === "signup"}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {authMode === "login" ? "Login" : "Sign Up"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAuthModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
                <div className="mt-4 text-center">
                  <Button variant="link" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                    {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Login"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>AI Terms & Conditions Analyzer © {new Date().getFullYear()} | Powered by OpenAI GPT-4</p>
          <p className="mt-1">Intelligent legal document analysis with context-aware risk assessment</p>
        </footer>
      </div>
    </div>
  )
}
