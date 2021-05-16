import { Events } from 'util/events';
import { Features } from 'util/features';
import { Locale } from 'util/locale';
import { ThemeWatcher } from 'comp/browser/theme-watcher';
import { AppSettingsModel } from 'models/app-settings-model';
import { Logger } from 'util/logger';
import { Launcher } from 'comp/launcher';
import { noop } from 'util/fn';

const logger = new Logger('settings-manager');

const DesktopLocaleKeys = [
    'sysMenuAboutKeeWeb',
    'sysMenuServices',
    'sysMenuHide',
    'sysMenuHideOthers',
    'sysMenuUnhide',
    'sysMenuQuit',
    'sysMenuEdit',
    'sysMenuUndo',
    'sysMenuRedo',
    'sysMenuCut',
    'sysMenuCopy',
    'sysMenuPaste',
    'sysMenuSelectAll',
    'sysMenuWindow',
    'sysMenuMinimize',
    'sysMenuClose'
];

const SettingsManager = {
    activeLocale: 'en-US',
    activeTheme: null as string | null,

    allLocales: {
        'en-US': 'English',
        'de-DE': 'Deutsch',
        'fr-FR': 'Français'
    },

    allThemes: {
        dark: 'setGenThemeDark',
        light: 'setGenThemeLight',
        sd: 'setGenThemeSd',
        sl: 'setGenThemeSl',
        fb: 'setGenThemeFb',
        bl: 'setGenThemeBl',
        db: 'setGenThemeDb',
        lb: 'setGenThemeLb',
        te: 'setGenThemeTe',
        lt: 'setGenThemeLt',
        dc: 'setGenThemeDc',
        hc: 'setGenThemeHc'
    },

    // changing something here? don't forget about desktop/app.js
    autoSwitchedThemes: [
        {
            name: 'setGenThemeDefault',
            dark: 'dark',
            light: 'light'
        },
        {
            name: 'setGenThemeSol',
            dark: 'sd',
            light: 'sl'
        },
        {
            name: 'setGenThemeBlue',
            dark: 'fb',
            light: 'bl'
        },
        {
            name: 'setGenThemeBrown',
            dark: 'db',
            light: 'lb'
        },
        {
            name: 'setGenThemeTerminal',
            dark: 'te',
            light: 'lt'
        },
        {
            name: 'setGenThemeHighContrast',
            dark: 'dc',
            light: 'hc'
        }
    ],

    customLocales: new Map<string, Record<string, string>>(),

    init(): void {
        Events.on('dark-mode-changed', () => this.darkModeChanged());
    },

    setBySettings(): void {
        this.setTheme(AppSettingsModel.theme);
        this.setFontSize(AppSettingsModel.fontSize);
        const locale = AppSettingsModel.locale;
        try {
            if (locale) {
                this.setLocale(AppSettingsModel.locale);
            } else {
                this.setLocale(this.getBrowserLocale());
            }
        } catch (ex) {}
    },

    getDefaultTheme(): string {
        return 'dark';
    },

    setTheme(theme: string | undefined | null): void {
        if (!theme) {
            if (this.activeTheme) {
                return;
            }
            theme = this.getDefaultTheme();
        }
        for (const cls of document.body.classList) {
            if (/^th-/.test(cls)) {
                document.body.classList.remove(cls);
            }
        }
        if (AppSettingsModel.autoSwitchTheme) {
            theme = this.selectDarkOrLightTheme(theme);
        }
        document.body.classList.add(this.getThemeClass(theme));
        const metaThemeColor = document.head.querySelector('meta[name=theme-color]') as
            | HTMLMetaElement
            | undefined;
        if (metaThemeColor) {
            metaThemeColor.content = window.getComputedStyle(document.body).backgroundColor;
        }
        this.activeTheme = theme;
        logger.debug('Theme changed', theme);
        Events.emit('theme-applied');
    },

    getThemeClass(theme: string): string {
        return 'th-' + theme;
    },

    selectDarkOrLightTheme(theme: string): string {
        for (const config of this.autoSwitchedThemes) {
            if (config.light === theme || config.dark === theme) {
                return ThemeWatcher.dark ? config.dark : config.light;
            }
        }
        return theme;
    },

    darkModeChanged(): void {
        if (AppSettingsModel.autoSwitchTheme) {
            for (const config of this.autoSwitchedThemes) {
                if (config.light === this.activeTheme || config.dark === this.activeTheme) {
                    const newTheme = ThemeWatcher.dark ? config.dark : config.light;
                    logger.debug('Setting theme triggered by system settings change', newTheme);
                    this.setTheme(newTheme);
                    break;
                }
            }
        }
    },

    setFontSize(fontSize: number): void {
        const defaultFontSize = Features.isMobile ? 14 : 12;
        const sizeInPx = defaultFontSize + (fontSize || 0) * 2;
        document.documentElement.style.fontSize = `${sizeInPx}px`;
    },

    setLocale(loc: string | undefined | null): void {
        if (!loc || loc === this.activeLocale) {
            return;
        }
        let localeValues;
        if (loc !== 'en-US') {
            localeValues = this.customLocales.get(loc);
            if (!localeValues) {
                localeValues = require('locales/' + loc + '.json') as Record<string, string>;
            }
        }
        Locale.set(localeValues);
        this.activeLocale = loc;
        Events.emit('set-locale', loc);

        if (Launcher) {
            const localeValuesForDesktopApp: Record<string, string> = {};
            for (const key of DesktopLocaleKeys) {
                localeValuesForDesktopApp[key] = Locale.get(key);
            }
            Launcher.ipcRenderer.invoke('set-locale', loc, localeValuesForDesktopApp).catch(noop);
        }
    },

    getBrowserLocale(): string {
        const language = (navigator.languages && navigator.languages[0]) || navigator.language;
        if (language && language.startsWith('en')) {
            return 'en-US';
        }
        return language;
    }
};

export { SettingsManager };
