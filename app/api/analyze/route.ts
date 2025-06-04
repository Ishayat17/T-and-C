import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

// Rate limiting and retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
}

// Sleep utility for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Enhanced AI-powered analysis function with retry logic
async function analyzeTermsAndConditionsWithAI(text: string) {
  const wordCount = text.split(/\s+/).length

  // Try AI analysis with retry logic
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`AI analysis attempt ${attempt}/${RETRY_CONFIG.maxRetries}`)

      // Generate comprehensive analysis using AI with enhanced scoring instructions
      const { text: analysisResult } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an expert legal analyst specializing in terms and conditions documents. Analyze the provided text and return a JSON response with accurate risk scoring.

SCORING GUIDELINES:
- Score 0-30: Low risk (user-friendly terms, clear rights, minimal data collection, fair dispute resolution)
- Score 31-65: Medium risk (standard terms with some concerning clauses, moderate data collection)
- Score 66-100: High risk (aggressive terms, extensive data collection, unfair clauses, binding arbitration)

RISK FACTORS THAT INCREASE SCORE:
- "without notice" (+15 points)
- "at our discretion" (+12 points) 
- "unlimited liability" or "waive all rights" (+20 points)
- "binding arbitration" or "no class action" (+15 points)
- Extensive data collection/sharing (+10-15 points)
- "sell your data" or "monetize" (+25 points)
- Immediate termination clauses (+10 points)
- No user rights or data portability (-10 points)
- Automatic renewals without notice (+8 points)
- Changes without consent (+10 points)

POSITIVE FACTORS THAT DECREASE SCORE:
- Clear user rights (-5 points)
- Data protection guarantees (-8 points)
- Fair dispute resolution (-10 points)
- Transparent practices (-5 points)
- User control over data (-10 points)

Return JSON with this structure:
{
  "summary": "2-3 sentence summary with specific risk level justification",
  "keyPoints": ["5-7 specific points about clauses found"],
  "riskAssessment": {
    "level": "low|medium|high",
    "score": calculated_score_0_to_100,
    "concerns": ["specific concerning clauses with quotes"],
    "reasoning": "explanation of how score was calculated"
  },
  "categories": {
    "dataCollection": {
      "summary": "specific analysis of data practices found",
      "details": [{"term": "exact phrase found", "count": number, "positions": [positions]}],
      "score": category_specific_score,
      "riskLevel": "low|medium|high"
    },
    "liability": {
      "summary": "specific liability analysis",
      "details": [{"term": "exact phrase found", "count": number, "positions": [positions]}],
      "score": category_specific_score,
      "riskLevel": "low|medium|high"
    },
    "termination": {
      "summary": "specific termination analysis", 
      "details": [{"term": "exact phrase found", "count": number, "positions": [positions]}],
      "score": category_specific_score,
      "riskLevel": "low|medium|high"
    },
    "userRights": {
      "summary": "specific user rights analysis",
      "details": [{"term": "exact phrase found", "count": number, "positions": [positions]}],
      "score": category_specific_score,
      "riskLevel": "low|medium|high"
    }
  },
  "textHighlights": [
    {
      "start": character_position,
      "end": character_position,
      "category": "dataCollection|liability|termination|userRights|concerning",
      "term": "highlighted term",
      "severity": "low|medium|high"
    }
  ],
  "originalText": "the original input text",
  "wordCount": ${wordCount},
  "readingTime": ${Math.ceil(wordCount / 200)},
  "categoryBreakdown": [
    {"category": "category_name", "score": number, "percentage": number}
  ]
}

IMPORTANT: 
1. Calculate scores based on ACTUAL content analysis, not generic estimates
2. Look for specific problematic phrases and clauses
3. Consider the overall balance of user rights vs company rights
4. Provide specific evidence for your scoring decisions
5. Return ONLY valid JSON with no markdown formatting`,
        prompt: `Analyze this terms and conditions document and provide accurate risk scoring based on the actual content:

${text.substring(0, 8000)} ${text.length > 8000 ? "... [truncated for analysis]" : ""}

Focus on finding specific problematic clauses, data collection practices, liability limitations, and user rights. Calculate the risk score based on the actual content, not generic assumptions.`,
      })

      console.log("AI response received successfully")

      // Extract and parse JSON
      const jsonStr = analysisResult
        .replace(/```(?:json)?\s*/, "")
        .replace(/\s*```\s*$/, "")
        .trim()

      let parsedResult
      try {
        parsedResult = JSON.parse(jsonStr)
        console.log("JSON parsed successfully, score:", parsedResult.riskAssessment?.score)
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        throw new Error("AI response parsing failed")
      }

      // Validate and ensure score is reasonable
      const score = Math.max(0, Math.min(100, parsedResult.riskAssessment?.score || 50))
      const level = score <= 30 ? "low" : score <= 65 ? "medium" : "high"

      return {
        summary: parsedResult.summary || `This ${wordCount}-word document has been analyzed for risk factors.`,
        keyPoints: parsedResult.keyPoints || ["Document requires detailed review"],
        riskAssessment: {
          level,
          score,
          concerns: parsedResult.riskAssessment?.concerns || ["Standard terms and conditions"],
          reasoning: parsedResult.riskAssessment?.reasoning || "Score based on content analysis",
        },
        categories: parsedResult.categories || generateDefaultCategories(),
        textHighlights: parsedResult.textHighlights || [],
        originalText: text,
        wordCount,
        readingTime: Math.ceil(wordCount / 200),
        categoryBreakdown: parsedResult.categoryBreakdown || [],
        analysisMethod: "AI-powered",
      }
    } catch (error: any) {
      console.error(`AI analysis attempt ${attempt} failed:`, error.message)

      // Check if it's a rate limit error
      if (error.message?.includes("Rate limit") || error.message?.includes("429")) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          // Calculate exponential backoff delay
          const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay)
          console.log(`Rate limit hit, waiting ${delay}ms before retry...`)
          await sleep(delay)
          continue
        } else {
          console.log("Max retries reached, falling back to enhanced analysis")
          break
        }
      } else {
        // For non-rate-limit errors, try once more or fallback
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleep(1000)
          continue
        } else {
          break
        }
      }
    }
  }

  // If all AI attempts failed, use enhanced fallback
  console.log("AI analysis failed, using enhanced fallback analysis")
  return generateEnhancedFallbackAnalysis(text, wordCount)
}

// Enhanced fallback analysis with better scoring
function generateEnhancedFallbackAnalysis(text: string, wordCount: number) {
  console.log("Using enhanced fallback analysis")
  const lowerText = text.toLowerCase()

  // Enhanced risk keyword detection with scoring
  const riskFactors = [
    { keyword: "without notice", weight: 15, found: false },
    { keyword: "at our discretion", weight: 12, found: false },
    { keyword: "unlimited liability", weight: 20, found: false },
    { keyword: "waive all rights", weight: 18, found: false },
    { keyword: "binding arbitration", weight: 15, found: false },
    { keyword: "sell your data", weight: 25, found: false },
    { keyword: "share with third parties", weight: 12, found: false },
    { keyword: "no class action", weight: 15, found: false },
    { keyword: "immediate termination", weight: 10, found: false },
    { keyword: "modify at any time", weight: 10, found: false },
    { keyword: "collect personal information", weight: 8, found: false },
    { keyword: "track your activity", weight: 10, found: false },
    { keyword: "no warranty", weight: 8, found: false },
    { keyword: "as is", weight: 6, found: false },
    { keyword: "third party", weight: 5, found: false },
    { keyword: "cookies", weight: 4, found: false },
    { keyword: "advertising", weight: 6, found: false },
    { keyword: "marketing purposes", weight: 7, found: false },
  ]

  // Positive factors that reduce risk
  const positiveFactors = [
    { keyword: "user rights", weight: -5, found: false },
    { keyword: "data protection", weight: -8, found: false },
    { keyword: "privacy policy", weight: -3, found: false },
    { keyword: "opt out", weight: -5, found: false },
    { keyword: "delete your data", weight: -8, found: false },
    { keyword: "fair use", weight: -4, found: false },
    { keyword: "transparent", weight: -3, found: false },
    { keyword: "user control", weight: -6, found: false },
  ]

  // Calculate risk score based on found factors
  let riskScore = 25 // Base score

  riskFactors.forEach((factor) => {
    if (lowerText.includes(factor.keyword)) {
      factor.found = true
      riskScore += factor.weight
    }
  })

  positiveFactors.forEach((factor) => {
    if (lowerText.includes(factor.keyword)) {
      factor.found = true
      riskScore += factor.weight // These are negative weights
    }
  })

  // Adjust based on document characteristics
  if (wordCount > 5000) riskScore += 5 // Longer documents tend to be more complex
  if (wordCount < 500) riskScore -= 5 // Very short documents might be simpler

  // Additional content-based adjustments
  const sentences = text.split(/[.!?]+/).length
  const avgSentenceLength = wordCount / sentences
  if (avgSentenceLength > 25) riskScore += 3 // Complex sentences might hide issues

  // Ensure score is within bounds
  riskScore = Math.max(0, Math.min(100, riskScore))

  let riskLevel: "low" | "medium" | "high" = "low"
  if (riskScore > 65) riskLevel = "high"
  else if (riskScore > 30) riskLevel = "medium"

  const foundRiskFactors = riskFactors.filter((f) => f.found)
  const foundPositiveFactors = positiveFactors.filter((f) => f.found)

  // Generate category-specific analysis
  const categories = generateEnhancedCategories(lowerText, foundRiskFactors, foundPositiveFactors)

  return {
    summary: `This ${wordCount}-word document scores ${riskScore}/100 for risk level. ${foundRiskFactors.length > 0 ? `Found ${foundRiskFactors.length} concerning clauses including "${foundRiskFactors[0].keyword}". ` : ""}${foundPositiveFactors.length > 0 ? `Document includes ${foundPositiveFactors.length} user-friendly provisions. ` : ""}${riskLevel === "high" ? "High risk - careful review recommended." : riskLevel === "medium" ? "Medium risk - standard corporate terms." : "Low risk - relatively user-friendly terms."}`,
    keyPoints: [
      `Document contains ${wordCount} words across ${sentences} sentences`,
      `Risk score: ${riskScore}/100 (${riskLevel} risk level)`,
      foundRiskFactors.length > 0
        ? `⚠️ Concerning clauses found: ${foundRiskFactors
            .slice(0, 3)
            .map((f) => f.keyword)
            .join(", ")}${foundRiskFactors.length > 3 ? ` and ${foundRiskFactors.length - 3} more` : ""}`
        : "✅ No major red flags detected in automated analysis",
      foundPositiveFactors.length > 0
        ? `✅ Positive aspects: ${foundPositiveFactors
            .slice(0, 3)
            .map((f) => f.keyword)
            .join(", ")}`
        : "⚠️ Limited user-friendly provisions detected",
      `Average sentence length: ${avgSentenceLength.toFixed(1)} words ${avgSentenceLength > 25 ? "(complex)" : "(readable)"}`,
      riskLevel === "high" ? "🚨 Recommend legal review before acceptance" : "📋 Standard review recommended",
    ],
    riskAssessment: {
      level: riskLevel,
      score: riskScore,
      concerns:
        foundRiskFactors.length > 0
          ? foundRiskFactors.map((f) => `Found "${f.keyword}" (risk impact: +${f.weight} points)`)
          : ["No major concerning clauses detected in automated analysis"],
      reasoning: `Score calculated from base score (25) + ${foundRiskFactors.length} risk factors (+${foundRiskFactors.reduce((sum, f) => sum + f.weight, 0)} points) + ${foundPositiveFactors.length} positive factors (${foundPositiveFactors.reduce((sum, f) => sum + f.weight, 0)} points) + document complexity adjustments`,
    },
    categories,
    textHighlights: [],
    originalText: text,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
    categoryBreakdown: [
      { category: "overall_risk", score: riskScore, percentage: 100 },
      {
        category: "detected_issues",
        score: Math.min(100, foundRiskFactors.length * 15),
        percentage: Math.min(100, (foundRiskFactors.length / riskFactors.length) * 100),
      },
      {
        category: "user_protections",
        score: Math.max(0, 100 - foundPositiveFactors.length * 20),
        percentage: Math.min(100, (foundPositiveFactors.length / positiveFactors.length) * 100),
      },
    ],
    analysisMethod: "Enhanced fallback analysis",
  }
}

function generateDefaultCategories() {
  return {
    dataCollection: {
      summary: "Data collection practices require review",
      details: [],
      score: 50,
      riskLevel: "medium" as const,
    },
    liability: {
      summary: "Liability terms require review",
      details: [],
      score: 50,
      riskLevel: "medium" as const,
    },
    termination: {
      summary: "Termination procedures require review",
      details: [],
      score: 50,
      riskLevel: "medium" as const,
    },
    userRights: {
      summary: "User rights and obligations require review",
      details: [],
      score: 50,
      riskLevel: "medium" as const,
    },
  }
}

function generateEnhancedCategories(lowerText: string, riskFactors: any[], positiveFactors: any[]) {
  // Data Collection Analysis
  const dataTerms = ["collect", "personal information", "cookies", "tracking", "analytics", "third party"]
  const dataRisks = dataTerms.filter((term) => lowerText.includes(term))
  const dataScore = Math.min(100, 30 + dataRisks.length * 10)

  // Liability Analysis
  const liabilityTerms = ["liability", "warranty", "as is", "damages", "responsible"]
  const liabilityRisks = liabilityTerms.filter((term) => lowerText.includes(term))
  const liabilityScore = Math.min(100, 25 + liabilityRisks.length * 12)

  // Termination Analysis
  const terminationTerms = ["terminate", "suspend", "without notice", "discretion"]
  const terminationRisks = terminationTerms.filter((term) => lowerText.includes(term))
  const terminationScore = Math.min(100, 20 + terminationRisks.length * 15)

  // User Rights Analysis
  const rightsTerms = ["rights", "opt out", "delete", "access", "control"]
  const rightsProtections = rightsTerms.filter((term) => lowerText.includes(term))
  const rightsScore = Math.max(0, 70 - rightsProtections.length * 10)

  return {
    dataCollection: {
      summary: `${dataRisks.length > 0 ? `Found data collection terms: ${dataRisks.join(", ")}` : "Limited data collection language detected"}`,
      details: dataRisks.map((term) => ({ term, count: 1, positions: [] })),
      score: dataScore,
      riskLevel: dataScore > 60 ? ("high" as const) : dataScore > 35 ? ("medium" as const) : ("low" as const),
    },
    liability: {
      summary: `${liabilityRisks.length > 0 ? `Found liability terms: ${liabilityRisks.join(", ")}` : "Standard liability language"}`,
      details: liabilityRisks.map((term) => ({ term, count: 1, positions: [] })),
      score: liabilityScore,
      riskLevel: liabilityScore > 60 ? ("high" as const) : liabilityScore > 35 ? ("medium" as const) : ("low" as const),
    },
    termination: {
      summary: `${terminationRisks.length > 0 ? `Found termination terms: ${terminationRisks.join(", ")}` : "Standard termination procedures"}`,
      details: terminationRisks.map((term) => ({ term, count: 1, positions: [] })),
      score: terminationScore,
      riskLevel:
        terminationScore > 60 ? ("high" as const) : terminationScore > 35 ? ("medium" as const) : ("low" as const),
    },
    userRights: {
      summary: `${rightsProtections.length > 0 ? `Found user rights terms: ${rightsProtections.join(", ")}` : "Limited user rights provisions"}`,
      details: rightsProtections.map((term) => ({ term, count: 1, positions: [] })),
      score: rightsScore,
      riskLevel: rightsScore > 60 ? ("high" as const) : rightsScore > 35 ? ("medium" as const) : ("low" as const),
    },
  }
}

export async function POST(request: NextRequest) {
  console.log("API route called")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const url = formData.get("url") as string
    const pastedText = formData.get("text") as string
    const useDemo = formData.get("demo") === "true"

    console.log("Request data:", {
      hasFile: !!file,
      hasUrl: !!url,
      hasText: !!pastedText,
      useDemo,
    })

    // If demo mode is requested, return enhanced demo analysis
    if (useDemo) {
      console.log("Generating enhanced demo analysis")
      const demoText = `
        Terms of Service - Example Platform

        1. Data Collection and Privacy
        We collect personal data including your name, email address, browsing habits, device information, location data, and usage patterns. This information may be shared with third-party partners for advertising and marketing purposes without notice. We use cookies and tracking technologies to monitor your behavior across our platform and sell your data to advertisers.

        2. Liability and Disclaimers
        The service is provided "as is" without warranty. We disclaim all liability for damages, loss, or harm resulting from service use. Users waive all rights to hold the company responsible for any issues. This limitation of liability is unlimited and applies to all circumstances.

        3. Account Termination
        We may terminate your account immediately without notice at our discretion. Upon termination, all user data may be retained for business purposes. Users have no right to data portability or account recovery.

        4. Legal Disputes
        All disputes must be resolved through binding arbitration. Users waive their right to jury trial and cannot participate in class action lawsuits. The governing law is determined at our discretion.

        5. Changes to Terms
        We may modify these terms at any time without notice. Continued use constitutes acceptance of changes. Users cannot opt out of modifications.

        6. User Obligations
        Users are responsible for all activity on their account. We collect and track your activity for marketing purposes and may share this with third parties.
      `

      return NextResponse.json(await analyzeTermsAndConditionsWithAI(demoText))
    }

    let text = ""

    if (file) {
      console.log("Processing file:", file.name, file.type)
      const buffer = await file.arrayBuffer()

      if (file.type === "application/pdf") {
        console.log("PDF file detected - extracting text")
        try {
          // Simple PDF text extraction (for demo purposes)
          const uint8Array = new Uint8Array(buffer)
          const textDecoder = new TextDecoder("utf-8")
          let pdfText = textDecoder.decode(uint8Array)

          // Basic PDF text extraction - remove PDF headers and binary data
          pdfText = pdfText.replace(/[\x00-\x1F\x7F-\x9F]/g, " ")
          pdfText = pdfText.replace(/\s+/g, " ")

          // Extract readable text (this is a simplified approach)
          const textMatches = pdfText.match(/[a-zA-Z\s.,;:!?'"()-]{10,}/g)
          if (textMatches && textMatches.length > 0) {
            text = textMatches.join(" ").trim()
          }

          if (!text || text.length < 100) {
            // Fallback: try to extract any readable content
            text = pdfText
              .replace(/[^\w\s.,;:!?'"()-]/g, " ")
              .replace(/\s+/g, " ")
              .trim()
          }

          if (!text || text.length < 50) {
            throw new Error("Could not extract readable text from PDF")
          }

          console.log("PDF text extracted, length:", text.length)
        } catch (pdfError) {
          console.error("PDF parsing error:", pdfError)
          return NextResponse.json(
            {
              error: "Failed to extract text from PDF. Please try converting to text format or use the paste option.",
              type: "pdf_parsing_error",
            },
            { status: 400 },
          )
        }
      } else if (file.type.startsWith("image/")) {
        console.log("Image file detected")
        return NextResponse.json(
          {
            error: "Image analysis is not supported. Please use text files, PDFs, URLs, or paste text directly.",
            type: "feature_unavailable",
          },
          { status: 400 },
        )
      } else {
        // Handle text files
        const content = new TextDecoder().decode(buffer)
        text = content
        console.log("File content length:", text.length)
      }
    } else if (url) {
      console.log("Processing URL:", url)
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const html = await response.text()
        // Simple HTML text extraction
        text = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        console.log("URL content length:", text.length)
      } catch (error) {
        console.error("URL fetch error:", error)
        return NextResponse.json(
          {
            error: `Failed to fetch content from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
            type: "fetch_error",
          },
          { status: 400 },
        )
      }
    } else if (pastedText) {
      console.log("Processing pasted text, length:", pastedText.length)
      text = pastedText.trim()
    } else {
      console.log("No input provided")
      return NextResponse.json({ error: "No file, URL, or text provided" }, { status: 400 })
    }

    if (!text || text.length < 50) {
      console.log("Text too short:", text.length)
      return NextResponse.json({ error: "Document appears to be empty or too short to analyze" }, { status: 400 })
    }

    // Limit text length for processing
    if (text.length > 50000) {
      text = text.substring(0, 50000) + "... [truncated for analysis]"
      console.log("Text truncated for processing")
    }

    console.log("Performing analysis...")
    const analysis = await analyzeTermsAndConditionsWithAI(text)
    console.log("Analysis completed successfully, method:", analysis.analysisMethod)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "server_error",
      },
      { status: 500 },
    )
  }
}
