"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type UserRole = "employee" | "admin" | "super_admin"

type AuthContextType = {
  user: User | null
  session: Session | null
  userRole: UserRole | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  requestAdminAccess: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowser()
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserRole(session.user.id)
      }

      setIsLoading(false)

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
        }

        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    fetchSession()
  }, [])

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from("users").select("role").eq("auth_id", userId).single()

    if (data) {
      setUserRole(data.role as UserRole)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      // First, check if the email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .limit(1)

      if (checkError) throw checkError

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("Email already in use. Please use a different email or try to log in.")
      }

      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })

      if (error) throw error

      // Create user record in our users table
      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
            created_at: new Date().toISOString(),
          },
        ])

        if (profileError) throw profileError
      }

      return data
    } catch (error: any) {
      console.error("Error in signUp:", error)

      // Improve error messages for common issues
      if (error.message.includes("email_exists")) {
        throw new Error("This email is already registered. Please log in instead.")
      } else if (error.message.includes("invalid")) {
        throw new Error("Email address is invalid or not supported. Please use a different email address.")
      } else if (error.message.includes("weak password")) {
        throw new Error("Password is too weak. Please use a stronger password.")
      }

      throw error
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const requestAdminAccess = async () => {
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase.from("admin_requests").insert({
      user_id: user.id,
      status: "pending",
      requested_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        requestAdminAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
