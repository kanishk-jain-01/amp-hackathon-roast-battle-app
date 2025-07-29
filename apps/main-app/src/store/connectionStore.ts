import { create } from 'zustand'

interface ConnectionState {
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  latency: number
  errors: string[]
  lastHeartbeat: number
}

interface ConnectionActions {
  setWSStatus: (status: ConnectionState['wsStatus']) => void
  setLatency: (latency: number) => void
  addError: (error: string) => void
  clearErrors: () => void
  setLastHeartbeat: (timestamp: number) => void
}

const initialState: ConnectionState = {
  wsStatus: 'disconnected',
  latency: 0,
  errors: [],
  lastHeartbeat: 0,
}

export const useConnectionStore = create<ConnectionState & ConnectionActions>(set => ({
  ...initialState,

  setWSStatus: status => set({ wsStatus: status }),
  setLatency: latency => set({ latency }),
  addError: error =>
    set(state => ({
      errors: [...state.errors, error].slice(-5), // Keep last 5 errors
    })),
  clearErrors: () => set({ errors: [] }),
  setLastHeartbeat: timestamp => set({ lastHeartbeat: timestamp }),
}))
