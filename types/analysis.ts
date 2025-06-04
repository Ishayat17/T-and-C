export interface TextHighlight {
  start: number
  end: number
  category: string
  term: string
  severity: "low" | "medium" | "high"
}

export interface KeyPoint {
  text: string
  category: string
  severity: "low" | "medium" | "high"
  evidence: string[]
  positions: number[]
}

export interface Concern {
  text: string
  severity: "low" | "medium" | "high"
  category: string
  positions: number[]
}

export interface CategoryDetail {
  summary: string
  details: Array<{ term: string; count: number; positions: number[] }>
  score: number
  riskLevel: "low" | "medium" | "high"
}

export interface AnalysisResult {
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
