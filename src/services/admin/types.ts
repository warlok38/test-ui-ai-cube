export type CubeStats = {
  total_queries: number
  daily_queries: number
  likes: number
  dislikes: number
  success_rate: number
}

export type AdminQueryLog = {
  event_tech_id: string
  start_time: string
  user: string | null
  event: string
  status: string
  query: string
}
