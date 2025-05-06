import { allLanguages, DEFAULT_LANGUAGE } from "../config/global";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import { Language } from "../types/language";

const languagePacks: Record<Language, any> = { ar, en };
const getLang = (name?: string): Language =>
  allLanguages.includes(name as Language)
    ? (name as Language)
    : DEFAULT_LANGUAGE;

export const t = (name: string, language?: string) => {
  const pack = languagePacks[getLang(language)];

  const path = name.split(".");

  let current = pack;

  for (const part of path) {
    if (current[part] === undefined) {
      return name;
    }
    current = current[part];
  }

  return current;
};
