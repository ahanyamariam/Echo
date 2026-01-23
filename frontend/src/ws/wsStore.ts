import { create } from 'zustand';

interface WSState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  isConnecting: false,
  error: null,
};

export const useWSStore = create<WSState>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ isConnected: connected, isConnecting: false }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

export default useWSStore;