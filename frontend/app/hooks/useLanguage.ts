import { useTranslation } from 'react-i18next';

// Custom hook that provides a simpler interface for language features
export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = i18n.language;
  const isNepali = currentLanguage === 'np';
  const isEnglish = currentLanguage === 'en';

  return {
    t,
    i18n,
    currentLanguage,
    isNepali,
    isEnglish,
    changeLanguage
  };
};

// Type for supported languages
export type SupportedLanguage = 'en' | 'np';
