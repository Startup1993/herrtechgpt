// ═══════════════════════════════════════════════════════════
// SHARED VIDEO TYPES (Editor + Creator)
// ═══════════════════════════════════════════════════════════

export interface TranscriptSegment {
  id: number
  start: number   // Sekunden
  end: number     // Sekunden
  text: string
}

export interface SceneAnalysis {
  sceneId: string
  startTime: number
  endTime: number
  description: string
  suggestedCut: boolean
  cutReason?: string
  bRollSuggestion?: string
  highlightScore: number // 0-10
}

export interface VideoProject {
  id: string
  originalFile: string
  filePath?: string
  audioFile?: string
  transcript?: TranscriptSegment[]
  scenes?: SceneAnalysis[]
  outputPath?: string
  downloadUrl?: string
  status: 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'rendering' | 'done' | 'error'
  error?: string
  createdAt: Date
}

// ═══════════════════════════════════════════════════════════
// VIDEO CREATOR TYPES
// ═══════════════════════════════════════════════════════════

export interface CreatorScene {
  id: string
  index: number
  title: string
  description: string
  voiceover: string
  imagePrompt?: string
  imageUrl?: string
  videoUrl?: string
  status: 'pending' | 'generating-image' | 'generating-video' | 'done' | 'error'
}

export interface CreatorProject {
  id: string
  prompt: string
  scenes: CreatorScene[]
  status: 'idle' | 'generating-scenes' | 'generating-images' | 'generating-videos' | 'composing' | 'done' | 'error'
  error?: string
  createdAt: Date
}
