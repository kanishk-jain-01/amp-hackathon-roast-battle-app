import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AIModel, Voice, Speaker } from '@roast-battle/ui'

interface SettingsState {
  aiModel: AIModel
  voice: Voice
  coinFlipResult?: Speaker
  topics: string[]
}

interface SettingsActions {
  setAIModel: (model: AIModel) => void
  setVoice: (voice: Voice) => void
  setCoinFlipResult: (result: Speaker) => void
  setTopics: (topics: string[]) => void
}

const defaultAIModels: AIModel[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
]

const defaultVoices: Voice[] = [
  { id: 'adam', name: 'Adam', description: 'Deep, authoritative' },
  { id: 'antoni', name: 'Antoni', description: 'Well-rounded' },
  { id: 'arnold', name: 'Arnold', description: 'Crisp, dynamic' },
  { id: 'bella', name: 'Bella', description: 'Soft, pleasant' },
  { id: 'domi', name: 'Domi', description: 'Strong, confident' },
  { id: 'elli', name: 'Elli', description: 'Emotional, expressive' },
]

const defaultTopics = [
  'New York City',
  'Gen Z',
  'Social Media Influencers',
  'Coffee Culture',
  'Remote Work',
  'Cryptocurrency',
  'Dating Apps',
  'Fast Fashion',
  'Food Trends',
  'Gaming Culture',
]

const initialState: SettingsState = {
  aiModel: defaultAIModels[0],
  voice: defaultVoices[0],
  topics: defaultTopics.slice(0, 3), // Default to first 3 topics
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    set => ({
      ...initialState,

      setAIModel: model => set({ aiModel: model }),
      setVoice: voice => set({ voice }),
      setCoinFlipResult: result => set({ coinFlipResult: result }),
      setTopics: topics => set({ topics }),
    }),
    {
      name: 'roast-battle-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export { defaultAIModels, defaultVoices, defaultTopics }
