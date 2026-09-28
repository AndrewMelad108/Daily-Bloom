import translations from "./translations.json";
export type Language = "ar" | "en";
export type TranslationKey = keyof typeof translations;
export type Translator = (key: TranslationKey) => string;
export const translate = (language: Language, key: TranslationKey) =>
  language === "ar" ? key : translations[key];
