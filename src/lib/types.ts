export interface Profile {
  id: string
  background: string
  market: string
  target_audience: string
  offer: string
  platforms: string[]
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface AgentConfig {
  id: string
  agent_id: string
  name: string
  description: string
  emoji: string
  system_prompt: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type CoreToolTier = 'primary' | 'secondary' | 'fallback'

export type CoreToolCategory =
  | 'ki-chat'
  | 'automation'
  | 'video'
  | 'video-edit'
  | 'video-avatar'
  | 'image'
  | 'coding'
  | 'knowledge'
  | 'design'
  | 'other'

export interface CoreTool {
  id: string
  name: string
  category: CoreToolCategory
  tier: CoreToolTier
  what_for: string
  why_we_use_it: string | null
  alternatives_handled: string[]
  relevant_agents: string[]
  url: string | null
  icon: string | null
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
