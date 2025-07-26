"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function VerifyEmailPage() {
  const [code, setCode] = useState(Array(6).fill(""))
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleInputChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return // Only allow numbers
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")

    const verificationCode = code.join("")

    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Email verified successfully! Redirecting to sign in...")
        setTimeout(() => router.push("/auth/signin"), 2000)
      } else {
        setError(data.error || "Invalid or expired code. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSuccessMessage("A new verification code has been sent to your email.")
        setCode(Array(6).fill(""))
        inputsRef.current[0]?.focus()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to resend code. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center mb-2">
              <img src="/trace_logo.png" alt="TRACE" className="h-12 w-12 mr-3" />
              <h1 className="text-4xl font-bold text-[#222e3e]">TRACE</h1>
            </div>
          </Link>
          <p className="text-gray-600">AI-Powered Educational Intelligence Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#222e3e] mb-2">
              Verify your email address
            </h2>
            <p className="text-gray-600">
              We've sent a 6-digit code to <span className="font-semibold text-[#222e3e]">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:border-transparent transition-all"
                  required
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <span className="text-red-800 text-sm font-medium">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <span className="text-green-800 text-sm font-medium">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#222e3e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#1a242f] focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Verifying..." : "Verify Account"}
            </button>
          </form>

          <div className="text-center pt-6 text-sm text-gray-600">
            <p>
              Didn't receive the code?{" "}
              <button onClick={handleResendCode} disabled={loading} className="font-semibold text-[#222e3e] hover:text-[#1a242f] disabled:opacity-50">
                Resend code
              </button>
            </p>
            <p className="mt-2">
              Wrong email?{" "}
              <Link href="/auth/signup" className="font-semibold text-[#222e3e] hover:text-[#1a242f]">
                Change email address
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 