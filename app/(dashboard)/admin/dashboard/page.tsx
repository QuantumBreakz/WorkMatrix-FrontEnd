"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Users, Clock, CheckSquare, XCircle, BarChart2, ArrowRight, Camera, FileText, Activity } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

export default function AdminDashboardPage() {
  const [employeeCount, setEmployeeCount] = useState<number | null>(null)
  const [activeEmployees, setActiveEmployees] = useState<number | null>(null)
  const [pendingRequests, setPendingRequests] = useState<number | null>(null)
  const [totalHoursToday, setTotalHoursToday] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [topEmployees, setTopEmployees] = useState([
    {
      id: 1,
      name: "John Smith",
      productivity: 92,
      hours: 38.5,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 2,
      name: "Emily Johnson",
      productivity: 88,
      hours: 40.0,
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 3,
      name: "Michael Brown",
      productivity: 85,
      hours: 37.2,
      avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    },
    {
      id: 4,
      name: "Sarah Davis",
      productivity: 82,
      hours: 39.8,
      avatar: "https://randomuser.me/api/portraits/women/67.jpg",
    },
    {
      id: 5,
      name: "David Wilson",
      productivity: 78,
      hours: 35.5,
      avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    },
  ])
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, user: "John Smith", action: "Started work session", time: "10 minutes ago" },
    { id: 2, user: "Emily Johnson", action: "Uploaded screenshot", time: "25 minutes ago" },
    { id: 3, user: "Michael Brown", action: "Completed task", time: "1 hour ago" },
    { id: 4, user: "Sarah Davis", action: "Ended work session", time: "2 hours ago" },
    { id: 5, user: "David Wilson", action: "Requested time off", time: "3 hours ago" },
  ])

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

    // If user is not an admin, redirect to employee dashboard
    if (userRole !== "admin" && userRole !== "super_admin") {
      router.push("/employee/dashboard")
      return
    }

    fetchDashboardStats()
  }, [user, userRole, router])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      // Get employee count
      const { count: employeeCountData } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "employee")

      setEmployeeCount(employeeCountData)

      // Get active employees count
      const { count: activeEmployeesData } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "employee")
        .eq("is_active", true)

      setActiveEmployees(activeEmployeesData)

      // Get pending admin requests count
      const { count: pendingRequestsData } = await supabase
        .from("admin_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      setPendingRequests(pendingRequestsData)

      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get total hours worked today
      const { data: todayLogs } = await supabase
        .from("time_logs")
        .select("duration_minutes")
        .gte("start_time", today.toISOString())
        .not("duration_minutes", "is", null)

      const totalMinutes = todayLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0
      setTotalHoursToday(totalMinutes / 60)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your team overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            View All Employees
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          icon={<Users className="h-5 w-5 text-blue-500" />}
          value={employeeCount === null ? "Loading..." : `${employeeCount}`}
          loading={isLoading}
          description="Team members"
          trend="neutral"
        />
        <StatCard
          title="Active Employees"
          icon={<CheckSquare className="h-5 w-5 text-blue-500" />}
          value={activeEmployees === null ? "Loading..." : `${activeEmployees}`}
          loading={isLoading}
          description="Currently working"
          trend={activeEmployees && employeeCount ? (activeEmployees / employeeCount > 0.7 ? "up" : "down") : "neutral"}
          trendValue={activeEmployees && employeeCount ? `${Math.round((activeEmployees / employeeCount) * 100)}%` : ""}
        />
        <StatCard
          title="Hours Today"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          value={totalHoursToday === null ? "Loading..." : `${totalHoursToday.toFixed(1)} hrs`}
          loading={isLoading}
          description="Team productivity"
          trend={
            totalHoursToday && activeEmployees
              ? totalHoursToday / (activeEmployees * 8) > 0.7
                ? "up"
                : "down"
              : "neutral"
          }
        />
        <StatCard
          title="Pending Requests"
          icon={<XCircle className="h-5 w-5 text-blue-500" />}
          value={pendingRequests === null ? "Loading..." : `${pendingRequests}`}
          loading={isLoading}
          description="Awaiting approval"
          trend={pendingRequests && pendingRequests > 0 ? "down" : "neutral"}
          action={
            pendingRequests && pendingRequests > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => router.push("/admin/approval-requests")}
              >
                View
              </Button>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Team Activity
            </CardTitle>
            <CardDescription>Productivity overview for all employees</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-64 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="text-center">
                <BarChart2 className="h-10 w-10 text-blue-300 dark:text-blue-700 mx-auto mb-2" />
                <p className="text-muted-foreground">Team activity chart will appear here</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="border-blue-100 dark:border-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Average Hours</div>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold mt-2">6.8 hrs</div>
                  <div className="text-xs text-green-600 mt-1 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                        clipRule="evenodd"
                      />
                    </svg>
                    8% from yesterday
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-100 dark:border-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Productivity</div>
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold mt-2">85%</div>
                  <div className="text-xs text-green-600 mt-1 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                        clipRule="evenodd"
                      />
                    </svg>
                    3% from yesterday
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-100 dark:border-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Screenshots</div>
                    <Camera className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold mt-2">124</div>
                  <div className="text-xs text-muted-foreground mt-1">Captured today</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Employees with highest productivity</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {topEmployees.map((employee, index) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 pb-3 border-b last:border-0 border-blue-50 dark:border-blue-900/20"
                >
                  <div className="flex-shrink-0 relative">
                    <Image
                      src={employee.avatar || "/placeholder.svg"}
                      alt={employee.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{employee.name}</p>
                      <span className="text-sm font-medium text-blue-600">{employee.productivity}%</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">{employee.hours} hrs this week</span>
                      <Progress
                        value={employee.productivity}
                        className="w-20 h-1.5 bg-blue-100 dark:bg-blue-900/30"
                        indicatorClassName="bg-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-50 dark:border-blue-900/20">
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              View All Employees <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest team activities</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 border-blue-50 dark:border-blue-900/20"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p>
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-50 dark:border-blue-900/20">
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              View All Activity <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Reports
            </CardTitle>
            <CardDescription>Generated reports and analytics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <BarChart2 className="h-4 w-4 text-blue-500 mr-2" />
                  Weekly Productivity Report
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Summary of team productivity metrics for the current week
                </p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Generate Report
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  Time Tracking Summary
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed breakdown of hours worked by each team member
                </p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Generate Report
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Users className="h-4 w-4 text-blue-500 mr-2" />
                  Team Performance Analysis
                </h3>
                <p className="text-sm text-muted-foreground mb-3">Comparative analysis of team performance metrics</p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-50 dark:border-blue-900/20">
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              View All Reports <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  icon,
  value,
  loading,
  description,
  trend,
  trendValue,
  action,
}: {
  title: string
  icon: React.ReactNode
  value: string
  loading: boolean
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  action?: React.ReactNode
}) {
  return (
    <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-blue-50 dark:border-blue-900/20">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{description}</p>
            {trend && trend !== "neutral" && (
              <div className="flex items-center">
                {trend === "up" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend === "down" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trendValue && <span className="text-xs ml-1">{trendValue}</span>}
              </div>
            )}
          </div>
        )}
        {action && <div className="mt-3 flex justify-end">{action}</div>}
      </CardContent>
    </Card>
  )
}
