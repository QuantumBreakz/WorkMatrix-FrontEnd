export type User = {
  id: string
  auth_id: string | null
  email: string
  full_name: string | null
  role: "admin" | "employee"
  is_active: boolean
  created_at: string
  last_login: string | null
}

export type Employee = {
  id: string
  user_id: string
  position: string | null
  department: string | null
  hire_date: string
  is_active: boolean
  location: string | null
  phone: string | null
  profile_image: string | null
  created_at: string
  updated_at: string
}

export type TimeLog = {
  id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  activity_type: string
  notes: string | null
  created_at: string
}

export type Screenshot = {
  id: string
  user_id: string
  filename: string
  file_path: string
  content_type: string
  file_size: number
  capture_time: string
  notes: string | null
  created_at: string
}

export type Keystroke = {
  id: string
  user_id: string
  application_name: string | null
  window_title: string | null
  count: number
  timestamp: string
  created_at: string
}

export type Ticket = {
  id: string
  user_id: string
  title: string
  description: string
  category: string | null
  priority: string
  status: string
  resolution: string | null
  created_at: string
  last_updated: string
  closed_at: string | null
}
