import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSupabase } from '../lib/supabase';
import { cloudConfigured, currentEmail, downloadAll, signIn, signOut, signUp, uploadAll } from '../store/cloud';
import { useGuest } from '../store/useGuestState';

function usePrevious<T>(v: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = v;
  }, [v]);
  return ref.current;
}

/** Optional cloud account. Guest mode keeps working without it. */
export default function Account({ onAuthed }: { onAuthed?: () => void }) {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [who, setWho] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [armDownload, setArmDownload] = useState(false);

  useEffect(() => {
    void currentEmail().then(setWho);
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setWho(session?.user.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const authed = who !== null;
  const prevAuthed = usePrevious(authed);
  useEffect(() => {
    if (authed && !prevAuthed) onAuthed?.();
  }, [authed, prevAuthed, onAuthed]);

  useEffect(() => {
    if (!armDownload) return;
    const t = setTimeout(() => setArmDownload(false), 10000);
    return () => clearTimeout(t);
  }, [armDownload]);

  if (!cloudConfigured()) return <p>{t('account.notConfigured')}</p>;

  async function run(fn: () => Promise<string | null>) {
    setMsg('');
    setBusy(true);
    try {
      const err = await fn();
      setMsg(err ?? t('account.done'));
      setWho(await currentEmail());
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    setMsg('');
    setBusy(true);
    try {
      const { counts } = await uploadAll(state);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setMsg(`${t('account.uploaded')}: ${total}`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!armDownload) {
      setArmDownload(true);
      setMsg(t('account.downloadConfirm'));
      return;
    }
    setArmDownload(false);
    setBusy(true);
    try {
      const fresh = await downloadAll();
      update(() => fresh);
      setMsg(t('account.downloaded'));
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>{t('account.title')}</h1>
      {who ? (
        <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
          <p>{t('account.loggedInAs')}: {who}</p>
          <p><small>{t('account.uploadNote')}</small></p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={busy} onClick={upload}>{t('account.upload')}</button>
            <button disabled={busy} onClick={download}>{armDownload ? t('account.downloadConfirmTap') : t('account.download')}</button>
            <button disabled={busy} onClick={() => run(async () => { await signOut(); return null; })}>{t('account.logout')}</button>
          </div>
          <p><small>{t('account.downloadNote')}</small></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
          <label>{t('account.email')}: <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>{t('account.password')}: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={busy} onClick={() => run(() => signUp(email, password))}>{t('account.signup')}</button>
            <button disabled={busy} onClick={() => run(() => signIn(email, password))}>{t('account.login')}</button>
          </div>
        </div>
      )}
      {msg && <p role="status" style={{ minHeight: 24 }}>{msg}</p>}
    </section>
  );
}
