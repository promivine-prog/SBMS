import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { loadGuest, saveGuest, type GuestState } from './guest';

type Updater = (prev: GuestState) => GuestState;

const GuestCtx = createContext<{ state: GuestState; update: (fn: Updater) => void } | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuestState>(loadGuest);
  const update = useCallback((fn: Updater) => {
    setState((prev) => {
      const next = fn(prev);
      saveGuest(next);
      return next;
    });
  }, []);
  return <GuestCtx.Provider value={{ state, update }}>{children}</GuestCtx.Provider>;
}

export function useGuest(): { state: GuestState; update: (fn: Updater) => void } {
  const ctx = useContext(GuestCtx);
  if (!ctx) throw new Error('useGuest must be used inside GuestProvider');
  return ctx;
}
