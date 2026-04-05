'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  password: string
  confirmPassword: string
}

interface FormErrors {
  password?: string
  confirmPassword?: string
}

function SetupPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing setup link')
      setTokenValid(false)
      return
    }
    
    // In a real implementation, you would validate the token here
    // For now, we'll assume any token is valid for demo purposes
    setTokenValid(true)
  }, [token])

  const validatePassword = (password: string) => {
    const requirements = [
      {
        test: password.length >= 8,
        text: 'At least 8 characters',
        icon: password.length >= 8 ? '✓' : '○'
      },
      {
        test: /[A-Z]/.test(password),
        text: 'One uppercase letter',
        icon: /[A-Z]/.test(password) ? '✓' : '○'
      },
      {
        test: /[a-z]/.test(password),
        text: 'One lowercase letter',
        icon: /[a-z]/.test(password) ? '✓' : '○'
      },
      {
        test: /[0-9]/.test(password),
        text: 'One number',
        icon: /[0-9]/.test(password) ? '✓' : '○'
      },
      {
        test: /[^A-Za-z0-9]/.test(password),
        text: 'One special character',
        icon: /[^A-Za-z0-9]/.test(password) ? '✓' : '○'
      }
    ]
    return requirements
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const levels = [
      { strength: 0, text: 'Very Weak', color: 'bg-red-500' },
      { strength: 1, text: 'Weak', color: 'bg-red-400' },
      { strength: 2, text: 'Fair', color: 'bg-yellow-500' },
      { strength: 3, text: 'Good', color: 'bg-blue-500' },
      { strength: 4, text: 'Strong', color: 'bg-green-500' },
      { strength: 5, text: 'Very Strong', color: 'bg-green-600' }
    ]

    return levels[Math.min(strength, 5)]
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!token) {
      setError('Invalid setup link')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // In a real implementation, you would:
      // 1. Validate the token from the database
      // 2. Get the user associated with this token
      // 3. Update the user's password
      // 4. Mark the token as used
      
      // For demo purposes, we'll simulate the process
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set password')
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating setup link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Setup Link</h2>
              <p className="mt-2 text-sm text-gray-600">
                {error || 'This password setup link is invalid or has expired.'}
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Password Set Successfully!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your password has been set. You will be redirected to the login page shortly.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordRequirements = validatePassword(formData.password)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Set Your Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a secure password for your StudyAbroad Pro account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Password Strength</span>
                    <span className="text-xs font-medium" style={{ color: passwordStrength.color.replace('bg-', '#').replace('-500', '').replace('-600', '') }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting Password...' : 'Set Password'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Password Requirements</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <ul className="space-y-2">
                {passwordRequirements.map((requirement, index) => (
                  <li 
                    key={index} 
                    className={`flex items-center ${
                      requirement.test ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    <span className="mr-2 text-lg font-bold">
                      {requirement.icon}
                    </span>
                    <span>{requirement.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SetupPasswordContent />
    </Suspense>
  )
}
