export interface Profile {
  id: string
  background: string
  market: string
  target_audience: string
  offer: string
  platforms: string[]
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
