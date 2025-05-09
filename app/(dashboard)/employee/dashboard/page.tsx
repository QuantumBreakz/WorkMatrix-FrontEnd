"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import TimeTracker from "@/components/time-tracker"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Camera,
  Keyboard,
  Calendar,
  BarChart2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Activity,
  Zap,
  Coffee,
  Monitor,
  FileText,
} from "lucide-react"
import type { TimeLog } from "@/types/database"

export default function EmployeeDashboardPage() {
  const [todayHours, setTodayHours] = useState<number | null>(null)
  const [weekHours, setWeekHours] = useState<number | null>(null)
  const [screenshotCount, setScreenshotCount] = useState<number | null>(null)
  const [keystrokeCount, setKeystrokeCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [productivityScore, setProductivityScore] = useState(78)
  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: "screenshot",
      time: "10:30 AM",
      description: "Screenshot captured",
    },
    {
      id: 2,
      type: "time",
      time: "9:15 AM",
      description: "Started work session",
    },
    {
      id: 3,
      type: "keyboard",
      time: "Yesterday",
      description: "High activity detected",
    },
    {
      id: 4,
      type: "break",
      time: "Yesterday",
      description: "Break completed - 15 minutes",
    },
    {
      id: 5,
      type: "report",
      time: "Yesterday",
      description: "Weekly report generated",
    },
  ])
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Complete project proposal",
      status: "in-progress",
      dueDate: "Today",
      priority: "high",
    },
    {
      id: 2,
      title: "Review team reports",
      status: "completed",
      dueDate: "Yesterday",
      priority: "medium",
    },
    {
      id: 3,
      title: "Client meeting preparation",
      status: "not-started",
      dueDate: "Tomorrow",
      priority: "high",
    },
    {
      id: 4,
      title: "Update documentation",
      status: "in-progress",
      dueDate: "Friday",
      priority: "medium",
    },
    {
      id: 5,
      title: "Team retrospective",
      status: "not-started",
      dueDate: "Next Monday",
      priority: "low",
    },
  ])
  const [appUsage, setAppUsage] = useState([
    { name: "VS Code", time: 180, percentage: 45 },
    { name: "Chrome", time: 120, percentage: 30 },
    { name: "Slack", time: 60, percentage: 15 },
    { name: "Zoom", time: 40, percentage: 10 },
  ])

  const { user, userRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login/employee")
      return
    }

    // If user is an admin, redirect to admin dashboard
    if (userRole === "admin" || userRole === "super_admin") {
      router.push("/admin/dashboard")
      return
    }

    fetchUserStats()
  }, [user, userRole, router])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // Get user ID from the users table
      const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

      if (!userData) {
        console.error("User not found in the database")
        return
      }

      const userId = userData.id

      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get start of the week (Sunday)
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())

      // Fetch today's time logs
      const { data: todayLogs } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", today.toISOString())

      // Fetch this week's time logs
      const { data: weekLogs } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", startOfWeek.toISOString())

      // Calculate total hours for today
      const todayTotalMinutes = calculateTotalMinutes(todayLogs as TimeLog[])
      setTodayHours(todayTotalMinutes / 60)

      // Calculate total hours for the week
      const weekTotalMinutes = calculateTotalMinutes(weekLogs as TimeLog[])
      setWeekHours(weekTotalMinutes / 60)

      // Fetch screenshot count
      const { count: screenshotCountData } = await supabase
        .from("screenshots")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      setScreenshotCount(screenshotCountData)

      // Fetch keystroke count for today
      const { data: keystrokeData } = await supabase
        .from("keystrokes")
        .select("count")
        .eq("user_id", userId)
        .gte("timestamp", today.toISOString())

      const totalKeystrokes = keystrokeData?.reduce((sum, item) => sum + item.count, 0) || 0
      setKeystrokeCount(totalKeystrokes)
    } catch (error) {
      console.error("Error fetching user stats:", error)
      toast({
        title: "Error",
        description: "Failed to load your activity data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalMinutes = (logs: TimeLog[]): number => {
    if (!logs || logs.length === 0) return 0

    return logs.reduce((total, log) => {
      if (log.duration_minutes) {
        return total + log.duration_minutes
      }

      if (log.start_time && log.end_time) {
        const startTime = new Date(log.start_time).getTime()
        const endTime = new Date(log.end_time).getTime()
        return total + (endTime - startTime) / 60000 // Convert ms to minutes
      }

      return total
    }, 0)
  }

  const formatHours = (hours: number | null): string => {
    if (hours === null) return "Loading..."
    return hours.toFixed(1)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "not-started":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "screenshot":
        return <Camera className="h-4 w-4 text-blue-500" />
      case "time":
        return <Clock className="h-4 w-4 text-green-500" />
      case "keyboard":
        return <Keyboard className="h-4 w-4 text-purple-500" />
      case "break":
        return <Coffee className="h-4 w-4 text-orange-500" />
      case "report":
        return <FileText className="h-4 w-4 text-indigo-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your productivity overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Take Screenshot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Hours"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          value={todayHours === null ? "Loading..." : `${formatHours(todayHours)} hrs`}
          loading={isLoading}
          description="Daily target: 8 hrs"
          trend={todayHours && todayHours > 4 ? "up" : "down"}
          trendValue={todayHours ? `${Math.round((todayHours / 8) * 100)}%` : "0%"}
        />
        <StatCard
          title="This Week"
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          value={weekHours === null ? "Loading..." : `${formatHours(weekHours)} hrs`}
          loading={isLoading}
          description="Weekly target: 40 hrs"
          trend={weekHours && weekHours > 30 ? "up" : "down"}
          trendValue={weekHours ? `${Math.round((weekHours / 40) * 100)}%` : "0%"}
        />
        <StatCard
          title="Screenshots"
          icon={<Camera className="h-5 w-5 text-blue-500" />}
          value={screenshotCount === null ? "Loading..." : `${screenshotCount}`}
          loading={isLoading}
          description="Captured today"
          trend="neutral"
        />
        <StatCard
          title="Keystrokes Today"
          icon={<Keyboard className="h-5 w-5 text-blue-500" />}
          value={keystrokeCount === null ? "Loading..." : `${keystrokeCount}`}
          loading={isLoading}
          description="Activity level"
          trend={keystrokeCount && keystrokeCount > 1000 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <TimeTracker />
        </div>
        <div className="lg:col-span-2">
          <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
            <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Productivity Overview
              </CardTitle>
              <CardDescription>Your performance metrics for the current week</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="daily">
                <TabsList className="mb-4 bg-blue-50 dark:bg-blue-900/20">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Daily
                  </TabsTrigger>
                  <TabsTrigger
                    value="weekly"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Monthly
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="daily">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Productivity Score</div>
                        <div className="text-sm font-medium">{productivityScore}%</div>
                      </div>
                      <Progress
                        value={productivityScore}
                        className="h-2 bg-blue-100 dark:bg-blue-900/30"
                        indicatorClassName="bg-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-blue-100 dark:border-blue-900/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Active Time</div>
                            <Clock className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="text-2xl font-bold mt-2">5.2 hrs</div>
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
                            12% from yesterday
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-100 dark:border-blue-900/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Focus Score</div>
                            <Zap className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="text-2xl font-bold mt-2">82%</div>
                          <div className="text-xs text-red-600 mt-1 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4 mr-1"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
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
                            <div className="text-sm font-medium">Break Time</div>
                            <Coffee className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="text-2xl font-bold mt-2">45 min</div>
                          <div className="text-xs text-muted-foreground mt-1">Within recommended range</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Application Usage</h3>
                      <div className="space-y-3">
                        {appUsage.map((app) => (
                          <div key={app.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{app.name}</span>
                              <span>
                                {Math.floor(app.time / 60)}h {app.time % 60}m ({app.percentage}%)
                              </span>
                            </div>
                            <Progress
                              value={app.percentage}
                              className="h-2 bg-blue-100 dark:bg-blue-900/30"
                              indicatorClassName="bg-blue-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center gap-4">
                      <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full">
                        <Monitor className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Productivity Insight</h4>
                        <p className="text-sm text-muted-foreground">
                          Your most productive hours are between 9 AM and 11 AM. Consider scheduling important tasks
                          during this time.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="weekly">
                  <div className="space-y-6">
                    <div className="relative h-64 bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart2 className="h-10 w-10 text-blue-300 dark:text-blue-700" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">Weekly activity chart will appear here</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-blue-100 dark:border-blue-900/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Weekly Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Hours</span>
                              <span className="font-medium">32.5 hrs</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Average Daily</span>
                              <span className="font-medium">6.5 hrs</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Most Productive Day</span>
                              <span className="font-medium">Tuesday</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Least Productive Day</span>
                              <span className="font-medium">Friday</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-100 dark:border-blue-900/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Weekly Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Work Hours (40h)</span>
                                <span>81%</span>
                              </div>
                              <Progress
                                value={81}
                                className="h-2 bg-blue-100 dark:bg-blue-900/30"
                                indicatorClassName="bg-blue-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Tasks Completed (15)</span>
                                <span>73%</span>
                              </div>
                              <Progress
                                value={73}
                                className="h-2 bg-blue-100 dark:bg-blue-900/30"
                                indicatorClassName="bg-blue-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Focus Score (85%)</span>
                                <span>92%</span>
                              </div>
                              <Progress
                                value={92}
                                className="h-2 bg-blue-100 dark:bg-blue-900/30"
                                indicatorClassName="bg-blue-600"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="monthly">
                  <div className="h-64 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="text-center">
                      <BarChart2 className="h-10 w-10 text-blue-300 dark:text-blue-700 mx-auto mb-2" />
                      <p className="text-muted-foreground">Monthly activity chart will appear here</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest tracked activities</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 border-blue-50 dark:border-blue-900/20"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{activity.description}</p>
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
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Tasks
            </CardTitle>
            <CardDescription>Your current tasks and deadlines</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 border-blue-50 dark:border-blue-900/20"
                >
                  <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                      </div>
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
              View All Tasks <ArrowRight className="ml-1 h-4 w-4" />
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
}: {
  title: string
  icon: React.ReactNode
  value: string
  loading: boolean
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
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
            {trend && (
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
      </CardContent>
    </Card>
  )
}
