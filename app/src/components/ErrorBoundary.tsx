import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  crashed: boolean;
  message: string;
}

/** Last-resort crash guard so one bad screen never wipes the whole session. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return { crashed: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown): void {
    try {
      const key = 'sbms-errors';
      const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as { at: string; message: string }[];
      prev.push({ at: new Date().toISOString(), message: err instanceof Error ? err.message : String(err) });
      localStorage.setItem(key, JSON.stringify(prev.slice(-20)));
    } catch {
      /* storage full/blocked: still show the fallback */
    }
  }

  render(): ReactNode {
    if (!this.state.crashed) return this.props.children;
    return (
      <main style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        <h1>Something went wrong</h1>
        <p>Your saved records are safe on this device. Reload to continue.</p>
        {this.state.message && <p><code>{this.state.message}</code></p>}
        <button onClick={() => window.location.reload()}>Reload</button>
      </main>
    );
  }
}

/** Log async/boot failures to the same on-device ring buffer (max 20). */
export function logError(message: string): void {
  try {
    const key = 'sbms-errors';
    const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as { at: string; message: string }[];
    prev.push({ at: new Date().toISOString(), message });
    localStorage.setItem(key, JSON.stringify(prev.slice(-20)));
  } catch {
    /* ignore */
  }
}

export function readErrors(): { at: string; message: string }[] {
  try {
    return JSON.parse(localStorage.getItem('sbms-errors') ?? '[]') as { at: string; message: string }[];
  } catch {
    return [];
  }
}

export function clearErrors(): void {
  try {
    localStorage.removeItem('sbms-errors');
  } catch {
    /* ignore */
  }
}
