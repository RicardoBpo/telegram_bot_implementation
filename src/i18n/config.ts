import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';


export const initI18n = async () => {
  await i18next
    .use(Backend)
    .init({
      fallbackLng: 'en',
      preload: ['en', 'es'],
      backend: {
        loadPath: path.resolve(__dirname, '../../locales/{{lng}}/{{lng}}.json')
      },
      interpolation: {
        escapeValue: false // no necesario para Telegram
      }
    });

  return i18next;
};
