import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../i18n/locales/en';
import np from '../i18n/locales/np';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      np: { translation: np }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
