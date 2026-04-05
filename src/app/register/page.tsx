// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"

// const css = `
//   * { box-sizing: border-box; margin: 0; padding: 0; }

//   body {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//     color: #111827;
//     -webkit-font-smoothing: antialiased;
//     min-height: 100vh;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//   }

//   .container {
//     width: 100%;
//     max-width: 600px;
//     padding: 20px;
//   }

//   .card {
//     background: #ffffff;
//     border-radius: 16px;
//     padding: 40px;
//     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//   }

//   .header {
//     text-align: center;
//     margin-bottom: 32px;
//   }

//   .logo {
//     font-size: 32px;
//     font-weight: 800;
//     color: #667eea;
//     margin-bottom: 8px;
//   }

//   .subtitle {
//     font-size: 14px;
//     color: #6b7280;
//   }

//   .section-title {
//     font-size: 16px;
//     font-weight: 700;
//     color: #374151;
//     margin-bottom: 16px;
//     padding-bottom: 8px;
//     border-bottom: 2px solid #e5e7eb;
//   }

//   .form-group {
//     margin-bottom: 20px;
//   }

//   .form-label {
//     display: block;
//     font-size: 14px;
//     font-weight: 600;
//     color: #374151;
//     margin-bottom: 8px;
//   }

//   .form-input {
//     width: 100%;
//     padding: 12px 16px;
//     border: 1px solid #d1d5db;
//     border-radius: 8px;
//     font-size: 14px;
//     color: #111827;
//     transition: all 0.2s;
//   }

//   .form-input:focus {
//     outline: none;
//     border-color: #667eea;
//     box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
//   }

//   .form-error {
//     font-size: 13px;
//     color: #dc2626;
//     margin-top: 4px;
//   }

//   .success-message {
//     background: #dcfce7;
//     color: #16a34a;
//     padding: 12px 16px;
//     border-radius: 8px;
//     margin-bottom: 20px;
//     font-size: 14px;
//     font-weight: 500;
//   }

//   .btn-primary {
//     width: 100%;
//     padding: 14px;
//     background: #667eea;
//     color: #ffffff;
//     border: none;
//     border-radius: 8px;
//     font-size: 15px;
//     font-weight: 600;
//     cursor: pointer;
//     transition: all 0.2s;
//   }

//   .btn-primary:hover {
//     background: #5568d3;
//     transform: translateY(-1px);
//     box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
//   }

//   .btn-primary:disabled {
//     background: #9ca3af;
//     cursor: not-allowed;
//     transform: none;
//   }

//   .footer {
//     text-align: center;
//     margin-top: 24px;
//     font-size: 14px;
//     color: #6b7280;
//   }

//   .footer a {
//     color: #667eea;
//     text-decoration: none;
//     font-weight: 600;
//   }

//   .footer a:hover {
//     text-decoration: underline;
//   }

//   .section-spacing {
//     margin-top: 32px;
//   }
// `

// export default function RegisterPage() {
//   const router = useRouter()
//   const [formData, setFormData] = useState({
//     consultancyName: "",
//     consultancyEmail: "",
//     consultancyPhone: "",
//     consultancyAddress: "",
//     adminName: "",
//     adminEmail: "",
//     adminPassword: "",
//   })
//   const [error, setError] = useState("")
//   const [success, setSuccess] = useState(false)
//   const [submitting, setSubmitting] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError("")
//     setSubmitting(true)

//     try {
//       const response = await fetch("/api/consultancies", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       })

//       const data = await response.json()

//       if (response.ok) {
//         setSuccess(true)
//         setTimeout(() => {
//           router.push("/auth/signin")
//         }, 2000)
//       } else {
//         setError(data.error || "Failed to register consultancy")
//       }
//     } catch (err) {
//       setError("An error occurred. Please try again.")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <>
//       <style>{css}</style>
//       <div className="container">
//         <div className="card">
//           <div className="header">
//             <div className="logo">StudyAbroad Pro</div>
//             <div className="subtitle">Register Your Consultancy</div>
//           </div>

//           {success && (
//             <div className="success-message">
//               ✓ Consultancy registered successfully! Redirecting to login...
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             <div className="section-title">Consultancy Information</div>

//             <div className="form-group">
//               <label className="form-label">Consultancy Name *</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={formData.consultancyName}
//                 onChange={(e) => setFormData({ ...formData, consultancyName: e.target.value })}
//                 required
//                 disabled={success}
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Consultancy Email *</label>
//               <input
//                 type="email"
//                 className="form-input"
//                 value={formData.consultancyEmail}
//                 onChange={(e) => setFormData({ ...formData, consultancyEmail: e.target.value })}
//                 required
//                 disabled={success}
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Phone Number</label>
//               <input
//                 type="tel"
//                 className="form-input"
//                 value={formData.consultancyPhone}
//                 onChange={(e) => setFormData({ ...formData, consultancyPhone: e.target.value })}
//                 disabled={success}
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Address</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={formData.consultancyAddress}
//                 onChange={(e) => setFormData({ ...formData, consultancyAddress: e.target.value })}
//                 disabled={success}
//               />
//             </div>

//             <div className="section-title section-spacing">Admin Account</div>

//             <div className="form-group">
//               <label className="form-label">Admin Name *</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={formData.adminName}
//                 onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
//                 required
//                 disabled={success}
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Admin Email *</label>
//               <input
//                 type="email"
//                 className="form-input"
//                 value={formData.adminEmail}
//                 onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
//                 required
//                 disabled={success}
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Admin Password *</label>
//               <input
//                 type="password"
//                 className="form-input"
//                 value={formData.adminPassword}
//                 onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
//                 required
//                 minLength={6}
//                 disabled={success}
//               />
//             </div>

//             {error && (
//               <div className="form-error" style={{ marginBottom: "16px" }}>
//                 {error}
//               </div>
//             )}

//             <button
//               type="submit"
//               className="btn-primary"
//               disabled={submitting || success}
//             >
//               {submitting ? "Registering..." : "Register Consultancy"}
//             </button>
//           </form>

//           <div className="footer">
//             Already have an account? <Link href="/auth/signin">Sign In</Link>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    consultancyName: "",
    consultancyEmail: "",
    consultancyPhone: "",
    consultancyAddress: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/consultancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/auth/signin"), 2000)
      } else {
        setError(data.error || "Failed to register consultancy")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed"

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-3xl font-extrabold text-indigo-500 mb-2">StudyAbroad Pro</div>
            <div className="text-sm text-gray-500">Register Your Consultancy</div>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-5 text-sm font-medium">
              ✓ Consultancy registered successfully! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section: Consultancy Information */}
            <div className="text-base font-bold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200">
              Consultancy Information
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consultancy Name *</label>
              <input
                type="text"
                className={inputClass}
                value={formData.consultancyName}
                onChange={(e) => setFormData({ ...formData, consultancyName: e.target.value })}
                required
                disabled={success}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consultancy Email *</label>
              <input
                type="email"
                className={inputClass}
                value={formData.consultancyEmail}
                onChange={(e) => setFormData({ ...formData, consultancyEmail: e.target.value })}
                required
                disabled={success}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                className={inputClass}
                value={formData.consultancyPhone}
                onChange={(e) => setFormData({ ...formData, consultancyPhone: e.target.value })}
                disabled={success}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                className={inputClass}
                value={formData.consultancyAddress}
                onChange={(e) => setFormData({ ...formData, consultancyAddress: e.target.value })}
                disabled={success}
              />
            </div>

            {/* Section: Admin Account */}
            <div className="text-base font-bold text-gray-700 mt-8 mb-4 pb-2 border-b-2 border-gray-200">
              Admin Account
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Name *</label>
              <input
                type="text"
                className={inputClass}
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                required
                disabled={success}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email *</label>
              <input
                type="email"
                className={inputClass}
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                required
                disabled={success}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Password *</label>
              <input
                type="password"
                className={inputClass}
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                required
                minLength={6}
                disabled={success}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || success}
              className="w-full py-3.5 bg-indigo-500 text-white font-semibold text-[15px] rounded-lg transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
            >
              {submitting ? "Registering..." : "Register Consultancy"}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-indigo-500 font-semibold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}