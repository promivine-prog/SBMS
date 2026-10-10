import { useTranslation } from 'react-i18next';
import { resetDemo } from '../store/guest';
import { LANGS, setLang, type LangCode } from '../i18n';
import { useGuest } from '../store/useGuestState';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { state, update } = useGuest();

  function download(filename: string, text: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section>
      <h1>{t('settings.title')}</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <label>
          {t('settings.language')}:{' '}
          <select value={i18n.language} onChange={(e) => setLang(e.target.value as LangCode)}>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.settings.cashReminder}
            onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, cashReminder: e.target.checked } }))}
          />{' '}
          {t('settings.cashReminder')}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => download('sbms-export.json', JSON.stringify(state, null, 2))}>{t('settings.export')}</button>
          <button onClick={() => { resetDemo(); window.location.reload(); }}>{t('settings.resetDemo')}</button>
          <button onClick={() => { resetDemo(); window.location.reload(); }}>{t('settings.delete')}</button>
        </div>
        <div>
          <h2>{t('settings.privacy')}</h2>
          <p>{t('settings.privacyText')}</p>
        </div>
      </div>
    </section>
  );
}
