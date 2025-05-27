'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Redirect based on user role
    if (session.user.role === "PROFESSOR") {
      router.push("/professor")
    } else if (session.user.role === "STUDENT") {
      router.push("/student")
    } else {
      router.push("/")
    }
  }, [session, status, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
} 