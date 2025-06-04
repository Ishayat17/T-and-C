import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

// AI-powered analysis function
async function analyzeTermsAndConditionsWithAI(text: string) {
  const wordCount = text.split(/\s+/).length

  try {
    // Generate comprehensive analysis using AI
    const { text: analysisResult } = await generateText({
      model: openai("gpt-4o-mini"), // Using GPT-4o-mini for cost efficiency
      system: `You are an expert legal analyst specializing in terms and conditions documents. Analyze the provided text and return a JSON response with the following structure:

{
  "summary": "A comprehensive 2-3 sentence summary of the document's key aspects and overall risk level",
  "keyPoints": ["Array of 5-7 specific key points about important clauses, data practices, user obligations, etc."],
  "riskAssessment": {
    "level": "low|medium|high",
    "score": number between 0-100,
    "concerns": ["Array of specific concerning clauses or practices found"]
  },
  "categories": {
    "dataCollection": {
      "summary": "Analysis of data collection practices",
      "details": [{"term": "specific term found", "count": number, "positions": [array of character positions]}],
      "score": number,
      "riskLevel": "low|medium|high"
    },
    "liability": {
      "summary": "Analysis of liability and disclaimer clauses",
      "details": [{"term": "specific term found", "count": number, "positions": [array of character positions]}],
      "score": number,
      "riskLevel": "low|medium|high"
    },
    "termination": {
      "summary": "Analysis of account termination procedures",
      "details": [{"term": "specific term found", "count": number, "positions": [array of character positions]}],
      "score": number,
      "riskLevel": "low|medium|high"
    },
    "userRights": {
      "summary": "Analysis of user rights and obligations",
      "details": [{"term": "specific term found", "count": number, "positions": [array of character positions]}],
      "score": number,
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
  "readingTime": estimated_reading_time_in_minutes,
  "categoryBreakdown": [
    {"category": "category_name", "score": number, "percentage": number}
  ]
}

Focus on:
- Data collection and privacy practices
- Liability limitations and disclaimers
- Account termination procedures
- User rights and obligations
- Concerning phrases like "without notice", "at our discretion", "unlimited liability", etc.
- Legal dispute resolution mechanisms

IMPORTANT: Return ONLY the JSON object with no markdown formatting, code blocks, or additional text. The response should be valid JSON that can be directly parsed.`,
      prompt: `Analyze this terms and conditions document:

${text}

Provide a comprehensive analysis in the specified JSON format.`,
    })

    console.log("AI response received, length:", analysisResult.length)

    // Extract JSON from the response - handle potential markdown formatting
    let jsonStr = analysisResult

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```(?:json)?\s*/, "").replace(/\s*```\s*$/, "")

    // Remove any leading/trailing whitespace
    jsonStr = jsonStr.trim()

    console.log("Extracted JSON string, first 100 chars:", jsonStr.substring(0, 100))

    // Parse the AI response
    let parsedResult
    try {
      parsedResult = JSON.parse(jsonStr)
      console.log("JSON parsed successfully")
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("First 200 characters of response:", jsonStr.substring(0, 200))
      // Fallback to basic analysis if AI response is malformed
      return generateFallbackAnalysis(text, wordCount)
    }

    // Ensure all required fields are present
    return {
      summary:
        parsedResult.summary ||
        `This ${wordCount}-word document contains terms and conditions that require careful review.`,
      keyPoints: parsedResult.keyPoints || ["Document contains legal terms requiring review"],
      riskAssessment: {
        level: parsedResult.riskAssessment?.level || "medium",
        score: parsedResult.riskAssessment?.score || 50,
        concerns: parsedResult.riskAssessment?.concerns || ["Standard terms and conditions - review recommended"],
      },
      categories: parsedResult.categories || generateDefaultCategories(),
      textHighlights: parsedResult.textHighlights || [],
      originalText: text,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      categoryBreakdown: parsedResult.categoryBreakdown || [],
    }
  } catch (error) {
    console.error("AI analysis failed:", error)
    // Fallback to basic analysis if AI fails
    return generateFallbackAnalysis(text, wordCount)
  }
}

// Fallback analysis function for when AI fails
function generateFallbackAnalysis(text: string, wordCount: number) {
  console.log("Using fallback analysis")
  const lowerText = text.toLowerCase()

  // Basic keyword detection for fallback
  const riskKeywords = [
    "without notice",
    "at our discretion",
    "unlimited liability",
    "waive all rights",
    "binding arbitration",
    "sell your data",
  ]

  const foundRisks = riskKeywords.filter((keyword) => lowerText.includes(keyword))
  const riskScore = Math.min(30 + foundRisks.length * 15, 100)

  let riskLevel: "low" | "medium" | "high" = "low"
  if (riskScore >= 70) riskLevel = "high"
  else if (riskScore >= 45) riskLevel = "medium"

  return {
    summary: `This ${wordCount}-word document contains ${riskLevel} risk terms and conditions. ${foundRisks.length > 0 ? "Several concerning clauses were identified. " : ""}Users should review carefully before accepting.`,
    keyPoints: [
      `Document contains ${wordCount} words of legal text`,
      foundRisks.length > 0
        ? `Found ${foundRisks.length} potentially concerning clauses`
        : "Standard legal language detected",
      "Review recommended before accepting terms",
      "Pay attention to data collection and liability sections",
      "Check termination and dispute resolution procedures",
    ],
    riskAssessment: {
      level: riskLevel,
      score: riskScore,
      concerns:
        foundRisks.length > 0
          ? foundRisks.map((risk) => `Document contains: "${risk}"`)
          : ["Standard terms and conditions - review recommended"],
    },
    categories: generateDefaultCategories(),
    textHighlights: [],
    originalText: text,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
    categoryBreakdown: [{ category: "general", score: riskScore, percentage: 100 }],
  }
}

function generateDefaultCategories() {
  return {
    dataCollection: {
      summary: "Data collection practices require review",
      details: [],
      score: 0,
      riskLevel: "medium" as const,
    },
    liability: {
      summary: "Liability terms require review",
      details: [],
      score: 0,
      riskLevel: "medium" as const,
    },
    termination: {
      summary: "Termination procedures require review",
      details: [],
      score: 0,
      riskLevel: "medium" as const,
    },
    userRights: {
      summary: "User rights and obligations require review",
      details: [],
      score: 0,
      riskLevel: "medium" as const,
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

    // If demo mode is requested, return AI-generated demo analysis
    if (useDemo) {
      console.log("Generating OpenAI demo analysis")
      const demoText = `
        Terms of Service

        1. Data Collection and Privacy
        We collect personal data including your name, email address, browsing habits, device information, location data, and usage patterns. This information may be shared with third-party partners for advertising and marketing purposes. We use cookies and tracking technologies to monitor your behavior across our platform.

        2. Liability and Disclaimers
        The service is provided "as is" without warranty. We disclaim all liability for damages, loss, or harm resulting from service use. Users waive all rights to hold the company responsible for any issues. This limitation of liability is unlimited and applies to all circumstances.

        3. Account Termination
        We may terminate your account immediately without notice at our discretion. Upon termination, all user data may be retained for business purposes. Users have no right to data portability or account recovery.

        4. Legal Disputes
        All disputes must be resolved through binding arbitration. Users waive their right to jury trial and cannot participate in class action lawsuits. The governing law is determined at our discretion.

        5. Changes to Terms
        We may modify these terms at any time without notice. Continued use constitutes acceptance of changes. Users cannot opt out of modifications.
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

    // Limit text length for AI processing (to avoid token limits)
    if (text.length > 50000) {
      text = text.substring(0, 50000) + "... [truncated for analysis]"
      console.log("Text truncated for AI processing")
    }

    console.log("Performing AI-powered analysis...")
    const analysis = await analyzeTermsAndConditionsWithAI(text)
    console.log("AI analysis completed successfully")

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
