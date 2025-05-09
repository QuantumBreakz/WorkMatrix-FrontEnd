"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  getCurrentUser,
  getUserProfile,
  getTimeLogs,
  getScreenshots,
  type User,
  type TimeLog,
  type Screenshot,
} from "@/services/supabase-service"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase"

export default function DashboardOverview() {
  const [user, setUser] = useState<User | null>(null)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          router.push("/login/employee")
          return
        }

        const userProfile = await getUserProfile(currentUser.id)
        if (userProfile) {
          setUser(userProfile)

          // Load time logs and screenshots
          const logs = await getTimeLogs(currentUser.id)
          const shots = await getScreenshots(currentUser.id)

          setTimeLogs(logs)
          setScreenshots(shots)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push("/login/employee")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-logs">Time Logs</TabsTrigger>
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timeLogs.reduce((total, log) => total + (log.duration || 0), 0) / 3600} hrs
                </div>
                <p className="text-xs text-muted-foreground">+20% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Screenshots</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{screenshots.length}</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {screenshots.length > 0
                    ? Math.round(screenshots.reduce((sum, s) => sum + (s.activity_level || 0), 0) / screenshots.length)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">+5% from yesterday</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your productivity over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Activity chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Time Logs</CardTitle>
                <CardDescription>Your latest tracked time entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{log.task_description || "No description"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.start_time).toLocaleString()}
                          {log.end_time ? ` - ${new Date(log.end_time).toLocaleString()}` : " (In progress)"}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {log.duration
                          ? `${Math.floor(log.duration / 3600)}h ${Math.floor((log.duration % 3600) / 60)}m`
                          : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Logs</CardTitle>
              <CardDescription>View all your tracked time entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No time logs found</p>
                ) : (
                  timeLogs.map((log) => (
                    <div key={log.id} className="flex items-center border-b pb-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{log.task_description || "No description"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.start_time).toLocaleString()}
                          {log.end_time ? ` - ${new Date(log.end_time).toLocaleString()}` : " (In progress)"}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {log.duration
                          ? `${Math.floor(log.duration / 3600)}h ${Math.floor((log.duration % 3600) / 60)}m`
                          : "-"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screenshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Screenshots</CardTitle>
              <CardDescription>View all captured screenshots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenshots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 col-span-3">No screenshots found</p>
                ) : (
                  screenshots.map((screenshot) => (
                    <div key={screenshot.id} className="border rounded-md overflow-hidden">
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Screenshot preview</p>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(screenshot.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs">Activity: {screenshot.activity_level || 0}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
