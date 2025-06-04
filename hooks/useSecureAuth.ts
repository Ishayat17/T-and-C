"use client"

import { useState, useEffect } from "react"
import { SecureDatabase, type SecureUser, hashPassword, verifyPassword, generateUserId } from "@/lib/auth"

export interface User {
  id: string
  email: string
  name: string
}

export function useSecureAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("tc-analyzer-current-user")
        if (savedUser) {
          const userData = JSON.parse(savedUser)

          // Verify user still exists in database
          const dbUser = SecureDatabase.findUserById(userData.id)
          if (dbUser) {
            setUser({
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
            })
          } else {
            // User was deleted, clear local storage
            localStorage.removeItem("tc-analyzer-current-user")
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error)
        localStorage.removeItem("tc-analyzer-current-user")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbUser = SecureDatabase.findUserByEmail(email)

      if (!dbUser) {
        return { success: false, error: "Invalid email or password" }
      }

      const isValidPassword = await verifyPassword(password, dbUser.passwordHash)

      if (!isValidPassword) {
        return { success: false, error: "Invalid email or password" }
      }

      // Update last login
      const updatedUser: SecureUser = {
        ...dbUser,
        lastLogin: new Date().toISOString(),
      }

      await SecureDatabase.saveUser(updatedUser)

      const userData: User = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      }

      setUser(userData)
      localStorage.setItem("tc-analyzer-current-user", JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Login failed. Please try again." }
    }
  }

  // Signup function
  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if user already exists
      const existingUser = SecureDatabase.findUserByEmail(email)
      if (existingUser) {
        return { success: false, error: "User with this email already exists" }
      }

      // Validate password strength
      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" }
      }

      // Hash password
      const passwordHash = await hashPassword(password)

      // Generate encryption key for user's private data
      const encryptionKey = Math.random().toString(36).substr(2, 16)

      const newUser: SecureUser = {
        id: generateUserId(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        encryptionKey,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      await SecureDatabase.saveUser(newUser)

      const userData: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      }

      setUser(userData)
      localStorage.setItem("tc-analyzer-current-user", JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: "Signup failed. Please try again." }
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("tc-analyzer-current-user")
  }

  // Update user profile
  const updateProfile = async (name: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not logged in" }

    try {
      const dbUser = SecureDatabase.findUserById(user.id)
      if (!dbUser) {
        return { success: false, error: "User not found" }
      }

      const updatedUser: SecureUser = {
        ...dbUser,
        name: name.trim(),
      }

      await SecureDatabase.saveUser(updatedUser)

      const userData: User = {
        ...user,
        name: name.trim(),
      }

      setUser(userData)
      localStorage.setItem("tc-analyzer-current-user", JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      console.error("Profile update error:", error)
      return { success: false, error: "Failed to update profile" }
    }
  }

  // Change password
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not logged in" }

    try {
      const dbUser = SecureDatabase.findUserById(user.id)
      if (!dbUser) {
        return { success: false, error: "User not found" }
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash)
      if (!isValidPassword) {
        return { success: false, error: "Current password is incorrect" }
      }

      // Validate new password
      if (newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long" }
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      const updatedUser: SecureUser = {
        ...dbUser,
        passwordHash: newPasswordHash,
      }

      await SecureDatabase.saveUser(updatedUser)

      return { success: true }
    } catch (error) {
      console.error("Password change error:", error)
      return { success: false, error: "Failed to change password" }
    }
  }

  return {
    user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
  }
}
