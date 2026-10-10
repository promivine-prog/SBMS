import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ha from './locales/ha.json';
import ig from './locales/ig.json';
import pcm from './locales/pcm.json';
import yo from './locales/yo.json';

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'pcm', label: 'Naija (Pidgin)' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
] as const;

export type LangCode = (typeof LANGS)[number]['code'];

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('sbms-lang')) || 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, yo: { translation: yo }, pcm: { translation: pcm }, ig: { translation: ig }, ha: { translation: ha } },
  lng: stored,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLang(code: LangCode): void {
  void i18n.changeLanguage(code);
  try {
    localStorage.setItem('sbms-lang', code);
  } catch {
    /* private mode: language still switches for this session */
  }
}

export default i18n;
