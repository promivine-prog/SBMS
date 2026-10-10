import { useEffect, useState } from 'react';

/** Honest connectivity label. Guest data is device-local, so offline only blocks future cloud sync. */
export default function OfflineBadge() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return (
    <span
      role="status"
      title={online ? 'Online' : 'Offline — changes stay saved on this device'}
      style={{
        fontSize: 12,
        padding: '2px 8px',
        borderRadius: 10,
        background: online ? '#e6f4ea' : '#fce8e6',
      }}
    >
      {online ? '● online' : '○ offline · saved on this device'}
    </span>
  );
}
