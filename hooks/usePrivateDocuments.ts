"use client"

import { useState, useEffect } from "react"
import { SecureDatabase, type PrivateDocument } from "@/lib/auth"
import type { AnalysisResult } from "@/types/analysis"

export interface PrivateDocumentSummary {
  id: string
  title: string
  date: string
  riskLevel: "low" | "medium" | "high"
  score: number
  createdAt: string
  updatedAt: string
}

export function usePrivateDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<PrivateDocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user's private documents
  useEffect(() => {
    if (!userId) {
      setDocuments([])
      setIsLoading(false)
      return
    }

    const loadDocuments = () => {
      try {
        const userDocs = SecureDatabase.getUserPrivateDocuments(userId)
        const documentSummaries = userDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          date: doc.date,
          riskLevel: doc.riskLevel,
          score: doc.score,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }))

        setDocuments(documentSummaries)
      } catch (error) {
        console.error("Failed to load private documents:", error)
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [userId])

  // Save a new document
  const saveDocument = async (
    title: string,
    analysis: AnalysisResult,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: "Not logged in" }

    try {
      const document: PrivateDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: title.trim(),
        date: "Just now",
        riskLevel: analysis.riskAssessment.level,
        score: analysis.riskAssessment.score,
        analysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await SecureDatabase.savePrivateDocument(document)

      // Update local state
      const newDocumentSummary: PrivateDocumentSummary = {
        id: document.id,
        title: document.title,
        date: document.date,
        riskLevel: document.riskLevel,
        score: document.score,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }

      setDocuments((prev) => [newDocumentSummary, ...prev])

      return { success: true }
    } catch (error) {
      console.error("Failed to save document:", error)
      return { success: false, error: "Failed to save document" }
    }
  }

  // Load full document with analysis
  const loadDocument = (documentId: string): AnalysisResult | null => {
    try {
      const allDocuments = SecureDatabase.getAllPrivateDocuments()
      const document = allDocuments.find((doc) => doc.id === documentId && doc.userId === userId)

      return document?.analysis || null
    } catch (error) {
      console.error("Failed to load document:", error)
      return null
    }
  }

  // Delete a document
  const deleteDocument = async (documentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: "Not logged in" }

    try {
      const success = SecureDatabase.deletePrivateDocument(documentId, userId)

      if (success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        return { success: true }
      } else {
        return { success: false, error: "Failed to delete document" }
      }
    } catch (error) {
      console.error("Failed to delete document:", error)
      return { success: false, error: "Failed to delete document" }
    }
  }

  // Update document title
  const updateDocumentTitle = async (
    documentId: string,
    newTitle: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: "Not logged in" }

    try {
      const allDocuments = SecureDatabase.getAllPrivateDocuments()
      const document = allDocuments.find((doc) => doc.id === documentId && doc.userId === userId)

      if (!document) {
        return { success: false, error: "Document not found" }
      }

      const updatedDocument: PrivateDocument = {
        ...document,
        title: newTitle.trim(),
        updatedAt: new Date().toISOString(),
      }

      await SecureDatabase.savePrivateDocument(updatedDocument)

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, title: newTitle.trim(), updatedAt: updatedDocument.updatedAt } : doc,
        ),
      )

      return { success: true }
    } catch (error) {
      console.error("Failed to update document title:", error)
      return { success: false, error: "Failed to update document title" }
    }
  }

  return {
    documents,
    isLoading,
    saveDocument,
    loadDocument,
    deleteDocument,
    updateDocumentTitle,
  }
}
