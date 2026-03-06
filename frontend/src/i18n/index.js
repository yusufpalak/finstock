import { createI18n } from 'vue-i18n'
import tr from './locales/tr.json'
import en from './locales/en.json'

export const SUPPORTED_LOCALES = ['tr', 'en']
export const DEFAULT_LOCALE = 'tr'

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'en',
  messages: { tr, en },
})
