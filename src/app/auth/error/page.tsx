"use client"

import Link from "next/link"

export default function AuthError() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Authentication Error</h2>
            <p className="mt-2 text-gray-600">
              There was a problem signing you in. Please try again.
            </p>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-center">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
