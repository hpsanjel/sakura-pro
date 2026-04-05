"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"

export default function DebugSession() {
  const { data: session, status } = useSession()
  const [apiTest, setApiTest] = useState<string>("")

  useEffect(() => {
    if (session) {
      setApiTest("Session available, testing API...")
      
      // Test API call
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          setApiTest(`API Session: ${JSON.stringify(data, null, 2)}`)
        })
        .catch(err => {
          setApiTest(`API Error: ${err.message}`)
        })
    } else {
      setApiTest("No session available")
    }
  }, [session])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Session Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session:</strong> {session ? 'Available' : 'None'}</p>
          {session && (
            <div className="mt-4">
              <h3 className="font-semibold">Session Data:</h3>
              <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">API Test</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {apiTest}
          </pre>
        </div>

        {session && (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
