"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, XCircle } from "lucide-react"

export default function PendingApprovalPage() {
  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login/admin")
      return
    }

    // If user is already an approved admin, redirect to dashboard
    if (userRole === "admin" || userRole === "super_admin") {
      router.push("/admin/dashboard")
    }
  }, [user, userRole, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Admin Approval Pending</CardTitle>
          <CardDescription className="text-center">Your admin account request is awaiting approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Your request has been submitted to the super admin</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>You will receive an email notification once your request is approved</span>
              </li>
              <li className="flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span>Until then, you won't be able to access admin features</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/login/employee")}>
            Continue as Employee
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
