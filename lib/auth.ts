import bcrypt from "bcryptjs"

// Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Verify password against hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Generate secure user ID
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Encrypt sensitive data before storing
export function encryptData(data: string, key: string): string {
  // Simple encryption for demo - in production, use proper encryption libraries
  const encrypted = btoa(data + key)
  return encrypted
}

// Decrypt sensitive data
export function decryptData(encryptedData: string, key: string): string {
  try {
    const decrypted = atob(encryptedData)
    return decrypted.replace(key, "")
  } catch {
    return ""
  }
}

// Secure storage interface
export interface SecureUser {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
  lastLogin: string
  encryptionKey: string
}

export interface PrivateDocument {
  id: string
  userId: string
  title: string
  date: string
  riskLevel: "low" | "medium" | "high"
  score: number
  analysis: any
  encryptedContent?: string
  createdAt: string
  updatedAt: string
}

// Database operations
export class SecureDatabase {
  private static readonly USERS_KEY = "tc-analyzer-secure-users"
  private static readonly DOCUMENTS_KEY = "tc-analyzer-secure-documents"
  private static readonly BACKUP_KEY = "tc-analyzer-backup"

  // Save user securely
  static async saveUser(user: SecureUser): Promise<void> {
    try {
      const users = this.getAllUsers()
      const existingIndex = users.findIndex((u) => u.id === user.id)

      if (existingIndex >= 0) {
        users[existingIndex] = user
      } else {
        users.push(user)
      }

      localStorage.setItem(this.USERS_KEY, JSON.stringify(users))

      // Create backup
      this.createBackup()
    } catch (error) {
      console.error("Failed to save user:", error)
      throw new Error("Failed to save user data")
    }
  }

  // Get all users
  static getAllUsers(): SecureUser[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch (error) {
      console.error("Failed to load users:", error)
      return this.restoreFromBackup()?.users || []
    }
  }

  // Find user by email
  static findUserByEmail(email: string): SecureUser | null {
    const users = this.getAllUsers()
    return users.find((user) => user.email === email) || null
  }

  // Find user by ID
  static findUserById(id: string): SecureUser | null {
    const users = this.getAllUsers()
    return users.find((user) => user.id === id) || null
  }

  // Save private document
  static async savePrivateDocument(document: PrivateDocument): Promise<void> {
    try {
      const documents = this.getAllPrivateDocuments()
      const existingIndex = documents.findIndex((d) => d.id === document.id)

      if (existingIndex >= 0) {
        documents[existingIndex] = { ...document, updatedAt: new Date().toISOString() }
      } else {
        documents.push({ ...document, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      }

      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents))

      // Create backup
      this.createBackup()
    } catch (error) {
      console.error("Failed to save document:", error)
      throw new Error("Failed to save document")
    }
  }

  // Get all private documents
  static getAllPrivateDocuments(): PrivateDocument[] {
    try {
      const documents = localStorage.getItem(this.DOCUMENTS_KEY)
      return documents ? JSON.parse(documents) : []
    } catch (error) {
      console.error("Failed to load documents:", error)
      return this.restoreFromBackup()?.documents || []
    }
  }

  // Get user's private documents
  static getUserPrivateDocuments(userId: string): PrivateDocument[] {
    const allDocuments = this.getAllPrivateDocuments()
    return allDocuments.filter((doc) => doc.userId === userId)
  }

  // Delete private document
  static deletePrivateDocument(documentId: string, userId: string): boolean {
    try {
      const documents = this.getAllPrivateDocuments()
      const filteredDocuments = documents.filter((doc) => !(doc.id === documentId && doc.userId === userId))

      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(filteredDocuments))
      this.createBackup()

      return true
    } catch (error) {
      console.error("Failed to delete document:", error)
      return false
    }
  }

  // Create backup
  static createBackup(): void {
    try {
      const backup = {
        users: this.getAllUsers(),
        documents: this.getAllPrivateDocuments(),
        timestamp: new Date().toISOString(),
        version: "1.0",
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup))
    } catch (error) {
      console.error("Failed to create backup:", error)
    }
  }

  // Restore from backup
  static restoreFromBackup(): { users: SecureUser[]; documents: PrivateDocument[] } | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY)
      if (backup) {
        const parsedBackup = JSON.parse(backup)

        // Restore users
        if (parsedBackup.users) {
          localStorage.setItem(this.USERS_KEY, JSON.stringify(parsedBackup.users))
        }

        // Restore documents
        if (parsedBackup.documents) {
          localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(parsedBackup.documents))
        }

        return {
          users: parsedBackup.users || [],
          documents: parsedBackup.documents || [],
        }
      }
    } catch (error) {
      console.error("Failed to restore from backup:", error)
    }

    return null
  }

  // Clear all data (for testing/reset)
  static clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY)
    localStorage.removeItem(this.DOCUMENTS_KEY)
    localStorage.removeItem(this.BACKUP_KEY)
  }

  // Export user data (GDPR compliance)
  static exportUserData(userId: string): any {
    const user = this.findUserById(userId)
    const documents = this.getUserPrivateDocuments(userId)

    if (!user) return null

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        date: doc.date,
        riskLevel: doc.riskLevel,
        score: doc.score,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      exportedAt: new Date().toISOString(),
    }
  }
}
