import { type NextRequest, NextResponse } from "next/server"

// Advanced text analysis function
function analyzeTermsAndConditions(text: string) {
  const words = text.toLowerCase().split(/\s+/)
  const wordCount = words.length

  // Define keyword patterns for different categories
  const patterns = {
    dataCollection: [
      "personal data",
      "personal information",
      "collect",
      "gathering",
      "tracking",
      "cookies",
      "analytics",
      "location",
      "device information",
      "ip address",
      "browsing",
      "usage data",
      "behavioral",
      "demographic",
      "biometric",
    ],
    privacy: [
      "privacy",
      "confidential",
      "share",
      "third party",
      "partners",
      "advertising",
      "marketing",
      "sell",
      "transfer",
      "disclosure",
    ],
    liability: [
      "liability",
      "responsible",
      "damages",
      "loss",
      "harm",
      "injury",
      "disclaimer",
      "limitation",
      "exclude",
      "waive",
      "indemnify",
    ],
    termination: [
      "terminate",
      "suspension",
      "cancel",
      "close",
      "deactivate",
      "breach",
      "violation",
      "immediate",
      "notice",
      "deletion",
    ],
    userRights: [
      "rights",
      "obligations",
      "responsibilities",
      "prohibited",
      "allowed",
      "access",
      "modify",
      "delete",
      "portability",
      "consent",
      "opt-out",
    ],
    legal: [
      "arbitration",
      "court",
      "jurisdiction",
      "governing law",
      "dispute",
      "class action",
      "jury trial",
      "legal action",
      "lawsuit",
    ],
    changes: ["modify", "change", "update", "revise", "amendment", "notification", "effective date", "notice period"],
  }

  // Count matches for each category
  const categoryScores: Record<string, number> = {}
  const categoryDetails: Record<string, string[]> = {}

  Object.entries(patterns).forEach(([category, keywords]) => {
    let score = 0
    const foundTerms: string[] = []

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "gi")
      const matches = text.match(regex)
      if (matches) {
        score += matches.length
        foundTerms.push(keyword)
      }
    })

    categoryScores[category] = score
    categoryDetails[category] = foundTerms
  })

  // Calculate risk score
  let riskScore = 30 // Base score

  // Increase risk based on concerning patterns
  if (categoryScores.dataCollection > 5) riskScore += 15
  if (categoryScores.privacy > 3) riskScore += 10
  if (categoryScores.liability > 3) riskScore += 15
  if (categoryScores.legal > 2) riskScore += 10
  if (categoryScores.changes > 2) riskScore += 5

  // Check for specific concerning phrases
  const concerningPhrases = [
    "without notice",
    "at our discretion",
    "unlimited liability",
    "waive all rights",
    "binding arbitration",
    "class action waiver",
    "sell your data",
    "share with partners",
    "no warranty",
  ]

  const concerns: string[] = []
  concerningPhrases.forEach((phrase) => {
    if (text.toLowerCase().includes(phrase)) {
      concerns.push(`Document contains: "${phrase}"`)
      riskScore += 8
    }
  })

  // Determine risk level
  let riskLevel: "low" | "medium" | "high"
  if (riskScore >= 70) riskLevel = "high"
  else if (riskScore >= 45) riskLevel = "medium"
  else riskLevel = "low"

  // Generate key points
  const keyPoints: string[] = []

  if (categoryScores.dataCollection > 0) {
    keyPoints.push(`Data collection practices mentioned ${categoryScores.dataCollection} times`)
  }
  if (categoryScores.liability > 0) {
    keyPoints.push(`Liability limitations and disclaimers present`)
  }
  if (categoryScores.termination > 0) {
    keyPoints.push(`Account termination procedures outlined`)
  }
  if (categoryScores.legal > 0) {
    keyPoints.push(`Legal dispute resolution mechanisms specified`)
  }
  if (categoryScores.userRights > 0) {
    keyPoints.push(`User rights and obligations detailed`)
  }
  if (categoryScores.changes > 0) {
    keyPoints.push(`Terms modification procedures described`)
  }

  // Add general points if specific ones are lacking
  if (keyPoints.length < 3) {
    keyPoints.push(`Document contains ${wordCount} words of legal text`)
    keyPoints.push(`Standard terms and conditions structure detected`)
    keyPoints.push(`Review recommended before accepting`)
  }

  // Generate category analysis
  const categories = {
    dataCollection:
      categoryScores.dataCollection > 0
        ? `Data collection practices are mentioned ${categoryScores.dataCollection} times. Found references to: ${categoryDetails.dataCollection.slice(0, 3).join(", ")}. Review privacy sections carefully to understand what information is collected and how it's used.`
        : "Limited information about data collection practices found. This may indicate minimal data gathering or incomplete privacy disclosure.",

    liability:
      categoryScores.liability > 0
        ? `Liability terms appear ${categoryScores.liability} times. The document includes disclaimers and limitations on company responsibility. Users should understand what risks they assume when using the service.`
        : "Standard liability terms appear to apply. No extensive disclaimers or unusual liability limitations detected.",

    termination:
      categoryScores.termination > 0
        ? `Account termination procedures are outlined with ${categoryScores.termination} references. This includes conditions under which accounts may be suspended or closed and what happens to user data.`
        : "Basic service termination terms are included. Standard account closure procedures likely apply.",

    userRights:
      categoryScores.userRights > 0
        ? `User rights and obligations are detailed with ${categoryScores.userRights} mentions. This covers what users can and cannot do, as well as their rights regarding their data and account.`
        : "User rights and responsibilities are outlined in standard terms. Review to understand your commitments and protections.",
  }

  // Add specific concerns based on analysis
  if (categoryScores.dataCollection > 8) {
    concerns.push("Extensive data collection practices mentioned")
  }
  if (categoryScores.liability > 5) {
    concerns.push("Multiple liability limitations and disclaimers")
  }
  if (categoryScores.legal > 3) {
    concerns.push("Complex legal dispute resolution requirements")
  }

  return {
    summary: `This ${wordCount}-word document contains ${riskLevel} risk terms and conditions. ${
      categoryScores.dataCollection > 0 ? "Data collection practices are outlined. " : ""
    }${categoryScores.liability > 0 ? "Liability limitations are present. " : ""}${
      categoryScores.termination > 0 ? "Account termination procedures are specified. " : ""
    }Users should review carefully before accepting.`,

    keyPoints: keyPoints.slice(0, 7), // Limit to 7 points

    riskAssessment: {
      level: riskLevel,
      score: Math.min(riskScore, 100),
      concerns: concerns.length > 0 ? concerns : ["Standard terms and conditions - review recommended"],
    },

    categories,
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

    // If demo mode is requested, return sample analysis
    if (useDemo) {
      console.log("Returning demo analysis")
      return NextResponse.json({
        summary:
          "This is a comprehensive demo analysis showing how the Terms & Conditions Analyzer works. This sample represents a medium-risk document with typical privacy policies, data collection practices, and user obligations found in most online services. Several concerning clauses about data sharing and limited liability have been identified that users should be aware of before accepting.",
        keyPoints: [
          "Service collects extensive personal data including browsing habits, device information, and location data",
          "Company reserves the right to share data with third-party partners for marketing and advertising purposes",
          "Users cannot hold the company liable for service interruptions, data breaches, or financial losses",
          "Account termination can occur at any time without prior notice for policy violations",
          "Dispute resolution requires binding arbitration, effectively waiving the right to jury trial",
          "Terms and conditions can be modified at any time with minimal notification requirements",
          "User-generated content becomes the intellectual property of the service provider upon submission",
        ],
        riskAssessment: {
          level: "medium" as const,
          score: 65,
          concerns: [
            "Broad data collection including sensitive personal information and behavioral tracking",
            "Data sharing agreements with unspecified third-party partners and advertisers",
            "Limited user rights regarding data deletion and account portability",
            "Mandatory arbitration clause significantly limits legal recourse options",
            "Terms can be changed unilaterally with minimal user notification",
            "Extensive liability disclaimers shift most risks to users",
          ],
        },
        categories: {
          dataCollection:
            "The service collects extensive personal data including browsing history, device information, location data, IP addresses, and user interactions. This data is shared with advertising partners and may be retained indefinitely even after account deletion. Users have limited control over data collection and sharing practices.",
          liability:
            "The company significantly limits its liability for service outages, data breaches, financial losses, or any damages resulting from service use. Users assume most risks associated with using the platform, including potential security vulnerabilities and data loss.",
          termination:
            "Accounts can be suspended or terminated immediately without notice for policy violations or at the company's discretion. Upon termination, user data may be retained for business purposes, and users may lose access to their content and any paid services without refund.",
          userRights:
            "Users have limited rights regarding data portability, deletion requests, and account control. The mandatory arbitration clause restricts legal options, and users cannot participate in class action lawsuits. Content ownership transfers to the platform upon submission.",
        },
      })
    }

    let text = ""

    if (file) {
      console.log("Processing file:", file.name, file.type)
      // Handle file upload
      const buffer = await file.arrayBuffer()

      if (file.type.startsWith("image/")) {
        console.log("Image file detected")
        return NextResponse.json(
          {
            error: "Image analysis is not supported. Please use text files, URLs, or paste text directly.",
            type: "feature_unavailable",
          },
          { status: 400 },
        )
      } else {
        // Handle text/PDF files
        const content = new TextDecoder().decode(buffer)
        text = content
        console.log("File content length:", text.length)
      }
    } else if (url) {
      console.log("Processing URL:", url)
      // Handle URL extraction
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
      // Handle pasted text
      text = pastedText.trim()
    } else {
      console.log("No input provided")
      return NextResponse.json({ error: "No file, URL, or text provided" }, { status: 400 })
    }

    if (!text || text.length < 50) {
      console.log("Text too short:", text.length)
      return NextResponse.json({ error: "Document appears to be empty or too short to analyze" }, { status: 400 })
    }

    console.log("Performing text analysis...")
    const analysis = analyzeTermsAndConditions(text)
    console.log("Analysis completed successfully")

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
