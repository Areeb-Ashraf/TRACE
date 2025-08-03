"use client"

import { XMarkIcon } from '@heroicons/react/24/solid'

interface PasswordStrengthProps {
  password?: string
}

export default function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  let errorMessage = "";

  // Only show errors after the user has started typing
  if (password.length > 0) {
    if (password.length < 8) {
      errorMessage = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      errorMessage = "Password must contain at least one uppercase letter.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errorMessage = "Password must contain at least one special character.";
    }
  }

  // If there's no error, don't render anything
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center text-sm text-red-600">
      <XMarkIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  )
} 