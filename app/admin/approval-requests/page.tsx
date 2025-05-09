"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

type AdminRequest = {
  id: string
  user_id: string
  status: string
  requested_at: string
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  user: {
    email: string
    full_name: string
  }
}

export default function AdminApprovalRequestsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, userRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login/admin")
      return
    }

    // If user is not a super admin, redirect to dashboard
    if (userRole !== "super_admin") {
      router.push("/admin/dashboard")
      return
    }

    fetchRequests()
  }, [user, userRole, router])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_requests")
        .select(`
          *,
          user:user_id (
            email,
            full_name
          )
        `)
        .order("requested_at", { ascending: false })

      if (error) throw error

      setRequests(data as AdminRequest[])
    } catch (error) {
      console.error("Error fetching admin requests:", error)
      toast({
        title: "Error",
        description: "Failed to load admin requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      // Update the admin request
      const { error: requestError } = await supabase
        .from("admin_requests")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (requestError) throw requestError

      // Update the user role to admin
      const { error: userError } = await supabase
        .from("users")
        .update({
          role: "admin",
        })
        .eq("auth_id", userId)

      if (userError) throw userError

      toast({
        title: "Request approved",
        description: "The user has been granted admin access",
      })

      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve the request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("admin_requests")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      toast({
        title: "Request rejected",
        description: "The admin access request has been rejected",
      })

      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject the request",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Access Requests</CardTitle>
          <CardDescription>Manage requests for admin access to WorkMatrix</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No admin access requests found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user.full_name || "N/A"}</TableCell>
                    <TableCell>{request.user.email}</TableCell>
                    <TableCell>{formatDate(request.requested_at)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            onClick={() => handleApprove(request.id, request.user_id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                            onClick={() => handleReject(request.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {request.status !== "pending" && (
                        <span className="text-gray-500 text-sm">
                          {request.status === "approved" ? "Approved" : "Rejected"} on{" "}
                          {request.approved_at ? formatDate(request.approved_at) : "N/A"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
