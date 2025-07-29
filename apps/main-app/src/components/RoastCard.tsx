import { useState } from 'react'
import { Roast } from '@roast-battle/ui'
import { Play, Pause, Volume2 } from 'lucide-react'

interface RoastCardProps {
  roast: Roast
}

export function RoastCard({ roast }: RoastCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  const handlePlayAudio = async () => {
    if (!roast.audioUrl) return

    if (audio && !audio.paused) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      const audioElement = new Audio(roast.audioUrl)
      audioElement.onended = () => setIsPlaying(false)
      audioElement.onplay = () => setIsPlaying(true)
      audioElement.onpause = () => setIsPlaying(false)

      await audioElement.play()
      setAudio(audioElement)
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const speakerColor = roast.speaker === 'human' ? 'bg-blue-600' : 'bg-red-600'
  const speakerIcon = roast.speaker === 'human' ? '🧑' : '🤖'
  const speakerName = roast.speaker === 'human' ? 'HUMAN' : 'AI AGENT'

  return (
    <div
      className={`bg-white/10 backdrop-blur rounded-lg p-6 border-l-4 ${
        roast.speaker === 'human' ? 'border-blue-500' : 'border-red-500'
      } battle-entrance`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full ${speakerColor} flex items-center justify-center text-white font-bold`}
          >
            {speakerIcon}
          </div>
          <div>
            <div className="text-white font-bold">{speakerName}</div>
            <div className="text-gray-400 text-sm">
              Round {roast.round} • {new Date(roast.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {roast.audioUrl && (
          <button
            onClick={handlePlayAudio}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
            <Volume2 className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <div className="text-white text-lg leading-relaxed">{roast.text}</div>

      {/* Roast quality indicator */}
      <div className="mt-4 flex items-center space-x-2">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className="text-yellow-500">
              🔥
            </span>
          ))}
        </div>
        <span className="text-gray-400 text-sm">Savage level: MAX</span>
      </div>
    </div>
  )
}
