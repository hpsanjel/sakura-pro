"use client"

import { useState } from "react"
import { CheckCircle, Circle, Clock, FileText, Send, FileCheck, CreditCard, Plane, AlertCircle, X } from "lucide-react"

const getStageColor = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-300' },
    green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-300' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300' },
    red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-300' }
  }
  return colorMap[color] || colorMap.blue
}

interface VisaTimelineProps {
  currentStatus: string
  className?: string
}

const visaStages = [
  {
    status: "NEW_LEAD",
    label: "Initial Application",
    description: "Your journey begins! We've received your initial inquiry and are excited to help you study in Japan.",
    details: {
      what: "Initial consultation and application submission",
      timeline: "Day 1-3",
      requirements: ["Basic personal information", "Study preferences", "Initial consultation"],
      nextSteps: ["Complete student profile", "Submit required documents"]
    },
    icon: AlertCircle,
    color: "blue"
  },
  {
    status: "DOCS_PENDING", 
    label: "Document Collection",
    description: "Time to gather your important documents! This is a crucial step for your Japanese student visa application.",
    details: {
      what: "Collection and verification of all required documents",
      timeline: "Week 1-2",
      requirements: ["Passport copy", "Academic transcripts", "Bank statements", "Birth certificate", "Police clearance", "Medical certificate", "Passport photos", "Language proficiency certificate", "Statement of purpose", "Sponsorship documents"],
      nextSteps: ["Upload all documents", "Wait for counselor review", "Address any document issues"]
    },
    icon: FileText,
    color: "yellow"
  },
  {
    status: "DOCS_VERIFIED",
    label: "Document Verification", 
    description: "Great! Your documents have been reviewed and approved. Now we prepare your application for Japan.",
    details: {
      what: "Document verification and application preparation",
      timeline: "Week 2-3",
      requirements: ["All documents verified", "Application forms completed", "School selection finalized"],
      nextSteps: ["Application sent to Japanese schools", "Wait for school acceptance"]
    },
    icon: FileCheck,
    color: "green"
  },
  {
    status: "SENT_TO_JAPAN",
    label: "School Application",
    description: "Your application has been sent to Japanese schools! Now we wait for their decision.",
    details: {
      what: "Application submission to Japanese language schools",
      timeline: "Week 3-6",
      requirements: ["Complete application package", "School fees payment", "Application forms submitted"],
      nextSteps: ["Wait for school acceptance letter", "Prepare for Certificate of Eligibility application"]
    },
    icon: Send,
    color: "purple"
  },
  {
    status: "COE_APPLIED",
    label: "Certificate of Eligibility",
    description: "We've applied for your Certificate of Eligibility - the key document for your Japanese visa!",
    details: {
      what: "Application for Certificate of Eligibility (COE) through Japanese immigration",
      timeline: "Month 2-3",
      requirements: ["School acceptance letter", "COE application forms", "Supporting documents"],
      nextSteps: ["Wait for COE approval", "Prepare visa application documents"]
    },
    icon: Clock,
    color: "orange"
  },
  {
    status: "COE_APPROVED",
    label: "COE Approved",
    description: "Excellent! Your Certificate of Eligibility has been approved. You're one step closer to Japan!",
    details: {
      what: "Certificate of Eligibility received and approved",
      timeline: "Month 3-4",
      requirements: ["Original COE document", "Visa application ready", "Travel preparations"],
      nextSteps: ["Submit visa application", "Book flight tickets", "Arrange accommodation"]
    },
    icon: CheckCircle,
    color: "green"
  },
  {
    status: "VISA_APPLIED",
    label: "Visa Application",
    description: "Your visa application has been submitted to the embassy. The final step!",
    details: {
      what: "Student visa application submission",
      timeline: "Month 4-5",
      requirements: ["COE document", "Visa application form", "Passport", "Photos", "Visa fee payment"],
      nextSteps: ["Wait for visa approval", "Prepare for travel", "Attend pre-departure briefing"]
    },
    icon: CreditCard,
    color: "blue"
  },
  {
    status: "VISA_APPROVED",
    label: "Visa Approved - Ready for Japan!",
    description: "Congratulations! Your visa has been approved. Get ready for your Japanese adventure!",
    details: {
      what: "Student visa approved and ready",
      timeline: "Month 5-6",
      requirements: ["Approved visa in passport", "Flight tickets booked", "Accommodation arranged", "Travel insurance"],
      nextSteps: ["Pack your bags", "Attend orientation", "Fly to Japan!", "Start your Japanese journey"]
    },
    icon: Plane,
    color: "green"
  },
  {
    status: "REJECTED",
    label: "Application Rejected",
    description: "Unfortunately, your application was rejected. Let's discuss next steps.",
    details: {
      what: "Application rejection review",
      timeline: "Varies",
      requirements: ["Rejection letter review", "Alternative options assessment"],
      nextSteps: ["Contact counselor immediately", "Discuss appeal options", "Consider alternative pathways"]
    },
    icon: X,
    color: "red"
  }
]

export default function VisaTimeline({ currentStatus, className = "" }: VisaTimelineProps) {
  const [selectedStage, setSelectedStage] = useState<typeof visaStages[0] | null>(null)

  const currentIndex = visaStages.findIndex(stage => stage.status === currentStatus)
  const isRejected = currentStatus === "REJECTED"

  // Determine which stages to show based on current status
  const getVisibleStages = () => {
    // If student has reached VISA_APPLIED or beyond, only show final outcomes
    if (currentStatus === "VISA_APPLIED" || currentStatus === "VISA_APPROVED" || currentStatus === "REJECTED") {
      return visaStages.filter(stage => 
        stage.status === "VISA_APPLIED" || 
        stage.status === "VISA_APPROVED" || 
        stage.status === "REJECTED"
      )
    }
    // Show all stages up to current point for earlier stages
    return visaStages.slice(0, Math.max(currentIndex + 1, 1))
  }

  const visibleStages = getVisibleStages()

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Visa Application Timeline</h2>
      
      {/* Special message for final stages */}
      {(currentStatus === "VISA_APPLIED" || currentStatus === "VISA_APPROVED" || currentStatus === "REJECTED") && (
        <div className={`mb-6 p-4 rounded-lg border ${
          currentStatus === "VISA_APPROVED" 
            ? "bg-green-50 border-green-200" 
            : currentStatus === "REJECTED"
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-start gap-3">
            {currentStatus === "VISA_APPROVED" ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : currentStatus === "REJECTED" ? (
              <X className="w-5 h-5 text-red-600 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${
                currentStatus === "VISA_APPROVED" 
                  ? "text-green-900" 
                  : currentStatus === "REJECTED"
                    ? "text-red-900"
                    : "text-blue-900"
              }`}>
                {currentStatus === "VISA_APPROVED" 
                  ? "🎉 Congratulations! Your Visa is Approved!"
                  : currentStatus === "REJECTED"
                    ? "Visa Application Result"
                    : "Final Decision Pending"
                }
              </h3>
              <p className={`text-sm mt-1 ${
                currentStatus === "VISA_APPROVED" 
                  ? "text-green-700" 
                  : currentStatus === "REJECTED"
                    ? "text-red-700"
                    : "text-blue-700"
              }`}>
                {currentStatus === "VISA_APPROVED" 
                  ? "Your student visa has been approved. You're ready to start your journey in Japan!"
                  : currentStatus === "REJECTED"
                    ? "Unfortunately, your visa application was not approved. Please contact your counselor for next steps."
                    : "Your visa application is under review. We'll update you as soon as we receive the decision."
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Timeline Progress */}
      <div className="relative">
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {visibleStages.map((stage, index) => {
            const Icon = stage.icon
            const stageColor = getStageColor(stage.color)
            const isCompleted = stage.status === "VISA_APPROVED" || (stage.status === "VISA_APPLIED" && currentStatus === "VISA_APPROVED")
            const isCurrent = stage.status === currentStatus
            const isUpcoming = false // No upcoming stages in final view
            const isSelected = selectedStage?.status === stage.status
            
            return (
              <div key={stage.status} className="relative flex items-start">
                {/* Timeline Dot */}
                <div className="relative z-10">
                  {isCompleted ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className={`w-8 h-8 ${stageColor.bg} rounded-full flex items-center justify-center animate-pulse`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Circle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Stage Content */}
                <div className="ml-6 flex-1">
                  <button
                    onClick={() => setSelectedStage(isSelected ? null : stage)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isCurrent 
                          ? 'border-blue-300 bg-blue-50/50'
                          : isCompleted
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-200 bg-gray-50/30 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <span className="text-green-600 text-sm font-medium">Completed</span>
                        )}
                        {isCurrent && (
                          <span className={`${stageColor.text} text-sm font-medium animate-pulse`}>Current</span>
                        )}
                        <Icon className={`w-5 h-5 ${stageColor.text}`} />
                      </div>
                    </div>
                  </button>

                  {/* Detailed Information */}
                  {isSelected && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Stage Details</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-gray-700 text-sm">What happens:</h5>
                          <p className="text-gray-600 text-sm">{stage.details.what}</p>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-700 text-sm">Timeline:</h5>
                          <p className="text-gray-600 text-sm">{stage.details.timeline}</p>
                        </div>
                        
                        {stage.status === "REJECTED" && (
                          <div>
                            <h5 className="font-medium text-red-700 text-sm">Next Steps:</h5>
                            <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                              <li>Contact your counselor immediately</li>
                              <li>Review rejection reasons</li>
                              <li>Discuss appeal or reapplication options</li>
                              <li>Consider alternative pathways</li>
                            </ul>
                          </div>
                        )}
                        
                        {stage.status === "VISA_APPROVED" && (
                          <div>
                            <h5 className="font-medium text-green-700 text-sm">Next Steps:</h5>
                            <ul className="list-disc list-inside text-green-600 text-sm space-y-1">
                              <li>Congratulations on your approval!</li>
                              <li>Prepare for travel to Japan</li>
                              <li>Attend pre-departure orientation</li>
                              <li>Pack and get ready for your journey</li>
                            </ul>
                          </div>
                        )}
                        
                        {stage.status === "VISA_APPLIED" && (
                          <div>
                            <h5 className="font-medium text-blue-700 text-sm">Current Status:</h5>
                            <ul className="list-disc list-inside text-blue-600 text-sm space-y-1">
                              <li>Your application is under review</li>
                              <li>Processing time varies (typically 2-8 weeks)</li>
                              <li>We'll notify you immediately of any updates</li>
                              <li>Keep your documents ready for any additional requests</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
