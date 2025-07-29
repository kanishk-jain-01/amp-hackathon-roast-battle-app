import { useState } from 'react'
import { Settings, X, Mic, Brain } from 'lucide-react'
import {
  useSettingsStore,
  defaultAIModels,
  defaultVoices,
  defaultTopics,
} from '@/store/settingsStore'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { aiModel, voice, topics, setAIModel, setVoice, setTopics } = useSettingsStore()
  const [selectedTopics, setSelectedTopics] = useState<string[]>(topics)

  const handleTopicToggle = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic))
    } else if (selectedTopics.length < 3) {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  const handleSave = () => {
    setTopics(selectedTopics)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="fixed right-0 top-0 h-full w-96 bg-white/10 backdrop-blur border-l border-white/20 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Battle Settings</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* AI Model Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">AI Model</h3>
            </div>
            <div className="space-y-2">
              {defaultAIModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => setAIModel(model)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    aiModel.id === model.id
                      ? 'bg-blue-600/50 border-blue-400 text-white'
                      : 'bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm opacity-75 capitalize">{model.provider}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Mic className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">AI Voice</h3>
            </div>
            <div className="space-y-2">
              {defaultVoices.map(voiceOption => (
                <button
                  key={voiceOption.id}
                  onClick={() => setVoice(voiceOption)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    voice.id === voiceOption.id
                      ? 'bg-green-600/50 border-green-400 text-white'
                      : 'bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">{voiceOption.name}</div>
                  {voiceOption.description && (
                    <div className="text-sm opacity-75">{voiceOption.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Battle Topics ({selectedTopics.length}/3)
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {defaultTopics.map(topic => {
                const isSelected = selectedTopics.includes(topic)
                const isDisabled = !isSelected && selectedTopics.length >= 3

                return (
                  <button
                    key={topic}
                    onClick={() => handleTopicToggle(topic)}
                    disabled={isDisabled}
                    className={`text-left p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-purple-600/50 border-purple-400 text-white'
                        : isDisabled
                          ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">{topic}</span>
                    {isSelected && <span className="float-right">✓</span>}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Select exactly 3 topics for your 3-round battle
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-white mb-2">Current Setup</h4>
            <div className="space-y-1 text-xs text-gray-300">
              <div>Model: {aiModel.name}</div>
              <div>Voice: {voice.name}</div>
              <div>Topics: {selectedTopics.join(', ')}</div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={selectedTopics.length !== 3}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
