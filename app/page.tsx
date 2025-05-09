import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "WorkMatrix - Employee Monitoring Solution",
  description: "Comprehensive employee monitoring and productivity tracking platform for remote teams",
}

export default function RootPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-blue-600 sm:text-5xl">WorkMatrix</h1>
      <p className="mt-4 text-lg text-slate-600 max-w-md">
        Comprehensive employee monitoring and productivity tracking platform for remote teams
      </p>
      <div className="mt-8">
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/home">Enter WorkMatrix</Link>
        </Button>
      </div>
    </div>
  )
}
