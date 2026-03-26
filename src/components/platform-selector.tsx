'use client'

const platforms = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
]

interface PlatformSelectorProps {
  selected: string[]
  onChange: (platforms: string[]) => void
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id)
        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => toggle(platform.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              isSelected
                ? 'bg-red-50 border-primary/40 text-primary'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {platform.label}
          </button>
        )
      })}
    </div>
  )
}
