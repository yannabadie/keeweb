import { Launcher } from 'comp/launcher';
import { Keys } from 'const/keys';
import { AppSettingsFieldName, AppSettingsModel } from 'models/app-settings-model';
import { Features } from 'util/features';
import { Locale } from 'util/locale';

let allowedKeys: Map<number, string>;

function getAllowedKeys(): Map<number, string> {
    if (!allowedKeys) {
        allowedKeys = new Map<number, string>();
        for (const [name, code] of Object.entries(Keys)) {
            if (typeof code === 'string') {
                continue;
            }
            const keyName = name.replace('DOM_VK_', '');
            if (/^([0-9A-Z]|F\d{1,2})$/.test(keyName)) {
                allowedKeys.set(code, keyName);
            }
        }
    }
    return allowedKeys;
}

const AllGlobalShortcuts = {
    copyPassword: { mac: 'Ctrl+Alt+C', all: 'Shift+Alt+C' },
    copyUser: { mac: 'Ctrl+Alt+B', all: 'Shift+Alt+B' },
    copyUrl: { mac: 'Ctrl+Alt+U', all: 'Shift+Alt+U' },
    copyOtp: undefined,
    autoType: { mac: 'Ctrl+Alt+T', all: 'Shift+Alt+T' },
    restoreApp: undefined
};

const GlobalShortcutAppSettingsFields: Record<
    keyof typeof AllGlobalShortcuts,
    AppSettingsFieldName
> = {
    copyPassword: 'globalShortcutCopyPassword',
    copyUser: 'globalShortcutCopyUser',
    copyUrl: 'globalShortcutCopyUrl',
    copyOtp: 'globalShortcutCopyOtp',
    autoType: 'globalShortcutAutoType',
    restoreApp: 'globalShortcutRestoreApp'
};

const Shortcuts = {
    keyEventToShortcut(event: KeyboardEvent): { valid: boolean; value: string } {
        const modifiers = [];
        if (event.ctrlKey) {
            modifiers.push('Ctrl');
        }
        if (event.altKey) {
            modifiers.push('Alt');
        }
        if (event.shiftKey) {
            modifiers.push('Shift');
        }
        if (Features.isMac && event.metaKey) {
            modifiers.push('Meta');
        }
        const keyName = getAllowedKeys().get(event.which);
        return {
            value: modifiers.join('+') + '+' + (keyName || '…'),
            valid: modifiers.length > 0 && !!keyName
        };
    },

    presentShortcut(shortcutValue: string | undefined, formatting?: boolean): string {
        if (!shortcutValue) {
            return '-';
        }
        return shortcutValue
            .split(/\+/g)
            .map((part) => {
                switch (part) {
                    case 'Ctrl':
                        return this.ctrlShortcutSymbol(formatting);
                    case 'Alt':
                        return this.altShortcutSymbol(formatting);
                    case 'Shift':
                        return this.shiftShortcutSymbol(formatting);
                    case 'Meta':
                        return this.actionShortcutSymbol(formatting);
                    default:
                        return part;
                }
            })
            .join('');
    },

    actionShortcutSymbol(formatting?: boolean): string {
        return Features.isMac ? '⌘' : this.formatShortcut(Locale.ctrlKey, formatting);
    },

    altShortcutSymbol(formatting?: boolean): string {
        return Features.isMac ? '⌥' : this.formatShortcut(Locale.altKey, formatting);
    },

    shiftShortcutSymbol(formatting?: boolean): string {
        return Features.isMac ? '⇧' : this.formatShortcut(Locale.shiftKey, formatting);
    },

    ctrlShortcutSymbol(formatting?: boolean): string {
        return Features.isMac ? '⌃' : this.formatShortcut(Locale.ctrlKey, formatting);
    },

    formatShortcut(shortcut: string, formatting?: boolean): string {
        return formatting ? `${shortcut} + ` : `${shortcut}+`;
    },

    globalShortcutText(type: keyof typeof AllGlobalShortcuts, formatting?: boolean): string {
        return this.presentShortcut(this.globalShortcut(type), formatting);
    },

    globalShortcut(type: keyof typeof AllGlobalShortcuts): string | undefined {
        const setting = GlobalShortcutAppSettingsFields[type];
        const appSettingsShortcut = AppSettingsModel[setting];
        if (typeof appSettingsShortcut === 'string') {
            return appSettingsShortcut;
        }
        const globalShortcut = AllGlobalShortcuts[type];
        if (globalShortcut) {
            if (Features.isMac && globalShortcut.mac) {
                return globalShortcut.mac;
            }
            return globalShortcut.all;
        }
        return undefined;
    },

    setGlobalShortcut(type: keyof typeof AllGlobalShortcuts, value: string): void {
        if (!AllGlobalShortcuts[type]) {
            throw new Error('Bad shortcut: ' + type);
        }
        const setting = GlobalShortcutAppSettingsFields[type];
        if (value) {
            AppSettingsModel.set(setting, value);
        } else {
            AppSettingsModel.delete(setting);
        }
        Launcher?.ipcRenderer.invoke('set-global-shortcuts', { [setting]: value });
    },

    screenshotToClipboardShortcut(): string {
        if (Features.isiOS) {
            return 'Sleep+Home';
        }
        if (Features.isMobile) {
            return '';
        }
        if (Features.isMac) {
            return 'Command-Shift-Control-4';
        }
        if (Features.isWindows) {
            return 'Alt+PrintScreen';
        }
        return '';
    }
};

export { Shortcuts };
