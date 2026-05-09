import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, type Translations } from './locales/en';
import { fr } from './locales/fr';
import { ptBR } from './locales/pt-BR';

export type Locale = 'en' | 'fr' | 'pt-BR';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'pt-BR'];

const STORAGE_KEY = 'scrcpy_locale';

const localeBundles: Record<Locale, Translations> = {
    en,
    fr,
    'pt-BR': ptBR
};

type Primitive = string | number | boolean;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return (override === undefined || override === null) ? base : (override as T);
    }
    const result: Record<string, unknown> = { ...base };
    for (const key of Object.keys(override)) {
        const baseVal = (base as Record<string, unknown>)[key];
        const overrideVal = (override as Record<string, unknown>)[key];
        if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
            result[key] = deepMerge(baseVal, overrideVal);
        } else if (overrideVal === undefined || overrideVal === null || overrideVal === '') {
            result[key] = baseVal;
        } else {
            result[key] = overrideVal;
        }
    }
    return result as T;
}

function detectInitialLocale(): Locale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && (SUPPORTED_LOCALES as string[]).includes(stored)) {
            return stored as Locale;
        }
    } catch {
        // ignore storage failures (e.g. SSR)
    }

    const navigatorLanguages: string[] = [];
    if (typeof navigator !== 'undefined') {
        if (Array.isArray(navigator.languages)) navigatorLanguages.push(...navigator.languages);
        if (navigator.language) navigatorLanguages.push(navigator.language);
    }

    for (const raw of navigatorLanguages) {
        if (!raw) continue;
        const lower = raw.toLowerCase();
        if (lower === 'pt-br' || lower.startsWith('pt-br')) return 'pt-BR';
        if (lower.startsWith('pt')) return 'pt-BR';
        if (lower.startsWith('fr')) return 'fr';
        if (lower.startsWith('en')) return 'en';
    }

    return 'en';
}

function resolveByPath(source: unknown, path: string): unknown {
    if (!path) return source;
    const segments = path.split('.');
    let current: unknown = source;
    for (const segment of segments) {
        if (isPlainObject(current) && segment in current) {
            current = (current as Record<string, unknown>)[segment];
        } else {
            return undefined;
        }
    }
    return current;
}

function formatTemplate(template: string, vars?: Record<string, Primitive>): string {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        const value = vars[key];
        return value === undefined || value === null ? match : String(value);
    });
}

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, vars?: Record<string, Primitive>) => string;
    translations: Translations;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
    children: React.ReactNode;
    initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectInitialLocale());

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, locale);
        } catch {
            // ignore storage failures
        }
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('lang', locale);
        }
    }, [locale]);

    const translations = useMemo<Translations>(() => {
        const overrides = localeBundles[locale] ?? en;
        // Deep-merge into the English base so that any missing key in another
        // locale falls back to the English string automatically.
        return deepMerge(en, overrides);
    }, [locale]);

    const value = useMemo<I18nContextValue>(() => {
        const t = (key: string, vars?: Record<string, Primitive>): string => {
            const localized = resolveByPath(translations, key);
            if (typeof localized === 'string') {
                return formatTemplate(localized, vars);
            }
            const fallback = resolveByPath(en, key);
            if (typeof fallback === 'string') {
                return formatTemplate(fallback, vars);
            }
            return key;
        };
        return {
            locale,
            setLocale: setLocaleState,
            t,
            translations
        };
    }, [locale, translations]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        // Allow components to be used outside the provider in tests by falling
        // back to a no-op implementation backed by English.
        const t = (key: string, vars?: Record<string, Primitive>): string => {
            const fallback = resolveByPath(en, key);
            if (typeof fallback === 'string') return formatTemplate(fallback, vars);
            return key;
        };
        return {
            locale: 'en',
            setLocale: () => undefined,
            t,
            translations: en
        };
    }
    return ctx;
}

export function useTranslation() {
    const { t, locale, setLocale, translations } = useI18n();
    return { t, locale, setLocale, translations };
}
