"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline' // Import icons
import PasswordStrength from "@/components/PasswordStrength" // Import the new component
import { XMarkIcon } from '@heroicons/react/24/outline' // Import XMarkIcon

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT"
  })
  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // New state for password visibility
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const router = useRouter()

  const isPasswordValid = 
    formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!passwordsMatch) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError("Password does not meet the requirements.")
      setLoading(false)
      return
    }

    if (!consentChecked) {
      setError("You must consent to data tracking to create an account")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requiresVerification) {
          // Redirect to verification page with email
          router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`)
        } else {
          // Fallback to signin if no verification required
          router.push("/auth/signin?message=Account created successfully. Please sign in.")
        }
      } else {
        setError(data.error || "An error occurred")
      }
    } catch (error) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    if (name === "password" || name === "confirmPassword") {
      setPasswordsMatch(newFormData.password === newFormData.confirmPassword);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center mb-2">
              <img src="/trace_logo.png" alt="TRACE" className="h-12 w-12 mr-3" />
              <h1 className="text-4xl font-bold text-[#222e3e]">TRACE</h1>
            </div>
          </Link>
          <p className="text-gray-600">AI-Powered Educational Intelligence Platform</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#222e3e] mb-2">
              Create your account
            </h2>
            <p className="text-gray-600">
              Join thousands of educators and students using TRACE
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#222e3e] mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#222e3e] mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-[#222e3e] mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:border-transparent transition-all text-gray-900 bg-white"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="STUDENT">Student</option>
                <option value="PROFESSOR">Professor</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#222e3e] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} // Toggle type based on state
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:border-transparent transition-all text-gray-900 placeholder-gray-500 pr-10" // Added pr-10 for icon space
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-sm leading-5 text-gray-500"
                >
                  <span className="flex items-center justify-center h-5 w-5">
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                    )}
                  </span>
                </button>
              </div>
              <PasswordStrength password={formData.password} /> {/* Add the component here */}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#222e3e] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"} // Toggle type based on state
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:border-transparent transition-all text-gray-900 placeholder-gray-500 pr-10" // Added pr-10 for icon space
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-sm leading-5 text-gray-500"
                >
                  <span className="flex items-center justify-center h-5 w-5">
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                    )}
                  </span>
                </button>
              </div>
              {!passwordsMatch && formData.confirmPassword && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <XMarkIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                  <span>Passwords do not match.</span>
                </div>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="w-4 h-4 text-[#222e3e] bg-gray-100 border-gray-300 rounded focus:ring-[#222e3e] focus:ring-2"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="consent" className="font-semibold text-amber-800 cursor-pointer">
                    I consent to data tracking and monitoring
                  </label>
                  <p className="text-amber-700 mt-1 text-xs leading-relaxed">
                    By registering, you consent to comprehensive monitoring during assignments/tests including: <strong>keystroke logging</strong>, <strong>window activity tracking</strong>, <strong>URL monitoring</strong>, and <strong>behavioral pattern analysis</strong> through our Chrome extension for academic integrity purposes.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !consentChecked || !passwordsMatch}
              className="w-full bg-[#222e3e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#1a242f] focus:outline-none focus:ring-2 focus:ring-[#222e3e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="font-semibold text-[#222e3e] hover:text-[#1a242f] transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure Registration
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              FERPA Compliant
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Free 14-Day Trial
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 