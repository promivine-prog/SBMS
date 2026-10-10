import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cloudConfigured, currentEmail, downloadAll, signIn, signOut, signUp, uploadAll } from '../store/cloud';
import { useGuest } from '../store/useGuestState';

/** Optional cloud account. Guest mode keeps working without it. */
export default function Account() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [who, setWho] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void currentEmail().then(setWho);
  }, []);

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
    setMsg('');
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
            <button disabled={busy} onClick={download}>{t('account.download')}</button>
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
      {msg && <p role="status">{msg}</p>}
    </section>
  );
}
