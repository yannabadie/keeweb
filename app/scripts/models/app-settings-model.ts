import { Model } from 'util/model';
import { SettingsStore } from 'comp/settings/settings-store';
import { noop } from 'util/fn';
import { Logger } from 'util/logger';
import { BooleanPropertyNames, NonFunctionPropertyNames } from 'util/types';
import {
    CharRange,
    CharRanges,
    PasswordGeneratorAppSetting,
    PasswordGeneratorCustomPreset
} from 'util/generators/password-generator';

const logger = new Logger('app-settings');

let changeListener: () => void;

class AppSettingsModel extends Model {
    theme: string | null = null; // UI theme
    autoSwitchTheme = false; // automatically switch between light and dark theme
    locale: string | null = null; // user interface language
    expandGroups = true; // show entries from all subgroups
    listViewWidth: number | null = null; // width of the entry list representation
    menuViewWidth: number | null = null; // width of the left menu
    tagsViewHeight: number | null = null; // tags menu section height
    autoUpdate: 'install' | 'check' | null = 'install'; // auto-update options
    clipboardSeconds = 0; // number of seconds after which the clipboard will be cleared
    autoSave = true; // auto-save open files
    autoSaveInterval = 0; // interval between performing automatic sync, minutes, -1: on every change
    rememberKeyFiles: 'path' | 'data' = 'path'; // remember keyfiles selected on the Open screen
    idleMinutes = 15; // app lock timeout after inactivity, minutes
    minimizeOnClose = false; // minimise the app instead of closing
    minimizeOnFieldCopy = false; // minimise the app on copy
    tableView = false; // view entries as a table instead of list
    colorfulIcons = false; // use colorful custom icons instead of grayscale
    useMarkdown = true; // use Markdown in Notes field
    directAutotype = true; // if only one matching entry is found, select that one automatically
    autoTypeTitleFilterEnabled = true; // enable the title filtering in auto-type by default
    titlebarStyle: 'default' | 'hidden' | 'hidden-inset' = 'default'; // window titlebar style
    lockOnMinimize = true; // lock the app when it's minimized
    lockOnCopy = false; // lock the app after a password was copied
    lockOnAutoType = false; // lock the app after performing auto-type
    lockOnOsLock = false; // lock the app when the computer is locked
    helpTipCopyShown = false; // disable the tooltip about copying fields
    templateHelpShown = false; // disable the tooltip about entry templates
    skipOpenLocalWarn = false; // disable the warning about opening a local file
    hideEmptyFields = false; // hide empty fields in entries
    skipHttpsWarning = false; // disable the non-HTTPS warning
    demoOpened = false; // hide the demo button inside the More... menu
    fontSize: 0 | 1 | 2 = 0; // font size
    tableViewColumns: string[] | null = null; // columns displayed in the table view
    generatorPresets: PasswordGeneratorAppSetting | null = null; // presets used in the password generator
    generatorHidePassword = false; // hide password in the generator
    cacheConfigSettings = false; // cache config settings and use them if the config can't be loaded
    allowIframes = false; // allow displaying the app in IFrames
    useGroupIconForEntries = false; // automatically use group icon when creating new entries
    enableUsb = true; // enable interaction with USB devices
    fieldLabelDblClickAutoType = false; // trigger auto-type by doubleclicking field label
    auditPasswords = true; // enable password audit
    auditPasswordEntropy = true; // show warnings for weak passwords
    excludePinsFromAudit = true; // exclude PIN codes from audit
    checkPasswordsOnHIBP = false; // check passwords on Have I Been Pwned
    auditPasswordAge = 0; // show warnings about old passwords, number of years, 0 = disabled
    deviceOwnerAuth: 'memory' | 'file' | null = null; // where to save password encrypted with Touch ID
    deviceOwnerAuthTimeoutMinutes = 0; // how often master password is required with Touch ID
    disableOfflineStorage = false; // don't cache loaded files in offline storage
    shortLivedStorageToken = false; // short-lived sessions in cloud storage providers
    extensionFocusIfLocked = true; // focus KeeWeb if a browser extension tries to connect while KeeWeb is locked
    extensionFocusIfEmpty = true; // show the entry selection screen if there's no match found by URL

    yubiKeyShowIcon = true; // show an icon to open OTP codes from YubiKey
    yubiKeyAutoOpen = false; // auto-load one-time codes when there are open files
    yubiKeyMatchEntries = true; // show matching one-time codes in entries
    yubiKeyShowChalResp = true; // show YubiKey challenge-response option
    yubiKeyRememberChalResp = false; // remember YubiKey challenge-response codes while the app is open
    yubiKeyStuckWorkaround = false; // enable the workaround for stuck YubiKeys

    canOpen = true; // can select and open new files
    canOpenDemo = true; // can open a demo file
    canOpenSettings = true; // can go to settings
    canCreate = true; // can create new files
    canImportXml = true; // can import files from XML
    canImportCsv = true; // can import files from CSV
    canRemoveLatest = true; // can remove files from the recent file list
    canExportXml = true; // can export files as XML
    canExportHtml = true; // can export files as HTML
    canSaveTo = true; // can save existing files to filesystem
    canOpenStorage = true; // can open files from cloud storage providers
    canOpenGenerator = true; // can open password generator
    canOpenOtpDevice = true; // can open OTP codes from USB tokens

    globalShortcutCopyPassword: string | null = null; // system-wide shortcut to copy password
    globalShortcutCopyUser: string | null = null; // system-wide shortcut to copy username
    globalShortcutCopyUrl: string | null = null; // system-wide shortcut to copy website
    globalShortcutCopyOtp: string | null = null; // system-wide shortcut to copy otp
    globalShortcutAutoType: string | null = null; // system-wide shortcut to launch auto-type
    globalShortcutRestoreApp: string | null = null; // system-wide shortcut to show the app

    dropbox = true; // enable Dropbox integration
    dropboxFolder: string | null = null; // default folder path
    dropboxAppKey: string | null = null; // custom Dropbox app key
    dropboxSecret: string | null = null; // custom Dropbox app secret

    webdav = true; // enable WebDAV integration
    webdavSaveMethod: 'move' | 'put' = 'move'; // how to save files with WebDAV
    webdavStatReload = false; // WebDAV: reload the file instead of relying on Last-Modified

    gdrive = true; // enable Google Drive integration
    gdriveClientId: string | null = null; // custom Google Drive client id
    gdriveClientSecret: string | null = null; // custom Google Drive client secret

    onedrive = true; // enable OneDrive integration
    onedriveClientId: string | null = null; // custom OneDrive client id
    onedriveClientSecret: string | null = null; // custom OneDrive client secret

    async init(): Promise<void> {
        await this.load();

        changeListener = () => this.save().catch(noop);
        this.on('change', changeListener);
    }

    disableSaveOnChange(): void {
        this.off('change', changeListener);
    }

    private async load() {
        const data = await SettingsStore.load('app-settings');
        if (data) {
            const record = data as Record<string, unknown>;
            AppSettingsModel.upgrade(record);

            this.batchSet(() => {
                for (const [key, value] of Object.entries(record)) {
                    if (!this.set(key as NonFunctionPropertyNames<AppSettingsModel>, value)) {
                        logger.warn('Bad setting', key, value);
                    }
                }
            });
        }
    }

    private static upgrade(data: Record<string, unknown>): void {
        if (data.rememberKeyFiles === true) {
            data.rememberKeyFiles = 'data';
        }
        if (data.locale === 'en') {
            data.locale = 'en-US';
        }
        if (data.theme === 'macdark') {
            data.theme = 'dark';
        }
        if (data.theme === 'wh') {
            data.theme = 'light';
        }
        if (data.autoUpdate === true) {
            data.autoUpdate = 'check';
        }
    }

    toJSON(): Record<string, unknown> {
        const values: Record<string, unknown> = {};
        const defaultValues = new AppSettingsModel();
        for (const [key, value] of Object.entries(this)) {
            if (defaultValues[key as keyof AppSettingsModel] !== value) {
                values[key] = value;
            }
        }
        return values;
    }

    async save(): Promise<void> {
        await SettingsStore.save('app-settings', this).catch(noop);
    }

    set(key: NonFunctionPropertyNames<AppSettingsModel>, value: unknown): boolean {
        // noinspection PointlessBooleanExpressionJS
        return !!this.setInternal(key, value);
    }

    private setInternal(key: NonFunctionPropertyNames<AppSettingsModel>, value: unknown): boolean {
        switch (key) {
            case 'theme':
                return this.setOptionalString('theme', value);
            case 'autoSwitchTheme':
                return this.setBoolean('autoSwitchTheme', value);
            case 'locale':
                return this.setOptionalString('locale', value);
            case 'expandGroups':
                return this.setBoolean('expandGroups', value);
            case 'listViewWidth':
                return this.setOptionalPositiveNumber('listViewWidth', value);
            case 'menuViewWidth':
                return this.setOptionalPositiveNumber('menuViewWidth', value);
            case 'tagsViewHeight':
                return this.setOptionalPositiveNumber('tagsViewHeight', value);
            case 'autoUpdate':
                return this.setAutoUpdate(value);
            case 'clipboardSeconds':
                return this.setNonNegativeNumber('clipboardSeconds', value);
            case 'autoSave':
                return this.setBoolean('autoSave', value);
            case 'autoSaveInterval':
                return this.setNumberWithMinus1('autoSaveInterval', value);
            case 'rememberKeyFiles':
                return this.setRememberKeyFiles(value);
            case 'idleMinutes':
                return this.setNonNegativeNumber('idleMinutes', value);
            case 'minimizeOnClose':
                return this.setBoolean('minimizeOnClose', value);
            case 'minimizeOnFieldCopy':
                return this.setBoolean('minimizeOnFieldCopy', value);
            case 'tableView':
                return this.setBoolean('tableView', value);
            case 'colorfulIcons':
                return this.setBoolean('colorfulIcons', value);
            case 'useMarkdown':
                return this.setBoolean('useMarkdown', value);
            case 'directAutotype':
                return this.setBoolean('directAutotype', value);
            case 'autoTypeTitleFilterEnabled':
                return this.setBoolean('autoTypeTitleFilterEnabled', value);
            case 'titlebarStyle':
                return this.setTitlebarStyle(value);
            case 'lockOnMinimize':
                return this.setBoolean('lockOnMinimize', value);
            case 'lockOnCopy':
                return this.setBoolean('lockOnCopy', value);
            case 'lockOnAutoType':
                return this.setBoolean('lockOnAutoType', value);
            case 'lockOnOsLock':
                return this.setBoolean('lockOnOsLock', value);
            case 'helpTipCopyShown':
                return this.setBoolean('helpTipCopyShown', value);
            case 'templateHelpShown':
                return this.setBoolean('templateHelpShown', value);
            case 'skipOpenLocalWarn':
                return this.setBoolean('skipOpenLocalWarn', value);
            case 'hideEmptyFields':
                return this.setBoolean('hideEmptyFields', value);
            case 'skipHttpsWarning':
                return this.setBoolean('skipHttpsWarning', value);
            case 'demoOpened':
                return this.setBoolean('demoOpened', value);
            case 'fontSize':
                return this.setFontSize(value);
            case 'tableViewColumns':
                return this.setTableViewColumns(value);
            case 'generatorPresets':
                return this.setGeneratorPresets(value);
            case 'generatorHidePassword':
                return this.setBoolean('generatorHidePassword', value);
            case 'cacheConfigSettings':
                return this.setBoolean('cacheConfigSettings', value);
            case 'allowIframes':
                return this.setBoolean('allowIframes', value);
            case 'useGroupIconForEntries':
                return this.setBoolean('useGroupIconForEntries', value);
            case 'enableUsb':
                return this.setBoolean('enableUsb', value);
            case 'fieldLabelDblClickAutoType':
                return this.setBoolean('fieldLabelDblClickAutoType', value);
            case 'auditPasswords':
                return this.setBoolean('auditPasswords', value);
            case 'auditPasswordEntropy':
                return this.setBoolean('auditPasswordEntropy', value);
            case 'excludePinsFromAudit':
                return this.setBoolean('excludePinsFromAudit', value);
            case 'checkPasswordsOnHIBP':
                return this.setBoolean('checkPasswordsOnHIBP', value);
            case 'auditPasswordAge':
                return this.setNonNegativeNumber('auditPasswordAge', value);
            case 'deviceOwnerAuth':
                return this.setDeviceOwnerAuth(value);
            case 'deviceOwnerAuthTimeoutMinutes':
                return this.setNonNegativeNumber('deviceOwnerAuthTimeoutMinutes', value);
            case 'disableOfflineStorage':
                return this.setBoolean('disableOfflineStorage', value);
            case 'shortLivedStorageToken':
                return this.setBoolean('shortLivedStorageToken', value);
            case 'extensionFocusIfLocked':
                return this.setBoolean('extensionFocusIfLocked', value);
            case 'extensionFocusIfEmpty':
                return this.setBoolean('extensionFocusIfEmpty', value);
            case 'yubiKeyShowIcon':
                return this.setBoolean('yubiKeyShowIcon', value);
            case 'yubiKeyAutoOpen':
                return this.setBoolean('yubiKeyAutoOpen', value);
            case 'yubiKeyMatchEntries':
                return this.setBoolean('yubiKeyMatchEntries', value);
            case 'yubiKeyShowChalResp':
                return this.setBoolean('yubiKeyShowChalResp', value);
            case 'yubiKeyRememberChalResp':
                return this.setBoolean('yubiKeyRememberChalResp', value);
            case 'yubiKeyStuckWorkaround':
                return this.setBoolean('yubiKeyStuckWorkaround', value);
            case 'canOpen':
                return this.setBoolean('canOpen', value);
            case 'canOpenDemo':
                return this.setBoolean('canOpenDemo', value);
            case 'canOpenSettings':
                return this.setBoolean('canOpenSettings', value);
            case 'canCreate':
                return this.setBoolean('canCreate', value);
            case 'canImportXml':
                return this.setBoolean('canImportXml', value);
            case 'canImportCsv':
                return this.setBoolean('canImportCsv', value);
            case 'canRemoveLatest':
                return this.setBoolean('canRemoveLatest', value);
            case 'canExportXml':
                return this.setBoolean('canExportXml', value);
            case 'canExportHtml':
                return this.setBoolean('canExportHtml', value);
            case 'canSaveTo':
                return this.setBoolean('canSaveTo', value);
            case 'canOpenStorage':
                return this.setBoolean('canOpenStorage', value);
            case 'canOpenGenerator':
                return this.setBoolean('canOpenGenerator', value);
            case 'canOpenOtpDevice':
                return this.setBoolean('canOpenOtpDevice', value);
            case 'globalShortcutCopyPassword':
                return this.setOptionalString('globalShortcutCopyPassword', value);
            case 'globalShortcutCopyUser':
                return this.setOptionalString('globalShortcutCopyUser', value);
            case 'globalShortcutCopyUrl':
                return this.setOptionalString('globalShortcutCopyUrl', value);
            case 'globalShortcutCopyOtp':
                return this.setOptionalString('globalShortcutCopyOtp', value);
            case 'globalShortcutAutoType':
                return this.setOptionalString('globalShortcutAutoType', value);
            case 'globalShortcutRestoreApp':
                return this.setOptionalString('globalShortcutRestoreApp', value);
            case 'dropbox':
                return this.setBoolean('dropbox', value);
            case 'dropboxFolder':
                return this.setOptionalString('dropboxFolder', value);
            case 'dropboxAppKey':
                return this.setOptionalString('dropboxAppKey', value);
            case 'dropboxSecret':
                return this.setOptionalString('dropboxSecret', value);
            case 'webdav':
                return this.setBoolean('webdav', value);
            case 'webdavSaveMethod':
                return this.setWebdavSaveMethod(value);
            case 'webdavStatReload':
                return this.setBoolean('webdavStatReload', value);
            case 'gdrive':
                return this.setBoolean('gdrive', value);
            case 'gdriveClientId':
                return this.setOptionalString('gdriveClientId', value);
            case 'gdriveClientSecret':
                return this.setOptionalString('gdriveClientSecret', value);
            case 'onedrive':
                return this.setBoolean('onedrive', value);
            case 'onedriveClientId':
                return this.setOptionalString('onedriveClientId', value);
            case 'onedriveClientSecret':
                return this.setOptionalString('onedriveClientSecret', value);
        }
    }

    reset(): void {
        const defaultValues = new AppSettingsModel();
        this.batchSet(() => {
            for (const [key, value] of Object.entries(defaultValues)) {
                this.set(key as NonFunctionPropertyNames<AppSettingsModel>, value);
            }
        });
    }

    delete(key: NonFunctionPropertyNames<AppSettingsModel>): void {
        const defaultValues = new AppSettingsModel();
        this.set(key, defaultValues[key]);
    }

    private setOptionalString(
        key:
            | 'theme'
            | 'locale'
            | 'globalShortcutCopyPassword'
            | 'globalShortcutCopyUser'
            | 'globalShortcutCopyUrl'
            | 'globalShortcutCopyOtp'
            | 'globalShortcutAutoType'
            | 'globalShortcutRestoreApp'
            | 'dropboxFolder'
            | 'dropboxAppKey'
            | 'dropboxSecret'
            | 'gdriveClientId'
            | 'gdriveClientSecret'
            | 'onedriveClientId'
            | 'onedriveClientSecret',
        value: unknown
    ): boolean {
        if (value) {
            if (typeof value === 'string') {
                this[key] = value;
                return true;
            }
        } else {
            this[key] = null;
            return true;
        }
        return false;
    }

    private setOptionalPositiveNumber(
        key: 'listViewWidth' | 'menuViewWidth' | 'tagsViewHeight',
        value: unknown
    ): boolean {
        if (value) {
            if (typeof value === 'number' && value > 0) {
                this[key] = value;
                return true;
            }
        } else {
            this[key] = null;
            return true;
        }
        return false;
    }

    private setNonNegativeNumber(
        key:
            | 'clipboardSeconds'
            | 'idleMinutes'
            | 'auditPasswordAge'
            | 'deviceOwnerAuthTimeoutMinutes',
        value: unknown
    ): boolean {
        if (typeof value === 'number' && value >= 0) {
            this[key] = value;
            return true;
        } else if (!value) {
            this[key] = 0;
        }
        return false;
    }

    private setNumberWithMinus1(key: 'autoSaveInterval', value: unknown): boolean {
        if (typeof value === 'number' && (value >= 0 || value === -1)) {
            this[key] = value;
            return true;
        } else if (!value) {
            this[key] = 0;
        }
        return false;
    }

    private setBoolean(
        key: NonNullable<BooleanPropertyNames<AppSettingsModel>>,
        value: unknown
    ): boolean {
        if (typeof value === 'boolean') {
            this[key] = value;
            return true;
        }
        return true;
    }

    private setAutoUpdate(value: unknown) {
        if (value) {
            if (value === 'install' || value === 'check') {
                this.autoUpdate = value;
                return true;
            }
        } else {
            this.autoUpdate = null;
            return true;
        }
        return false;
    }

    private setRememberKeyFiles(value: unknown) {
        if (value === 'path' || value === 'data') {
            this.rememberKeyFiles = value;
            return true;
        }
        return false;
    }

    private setTitlebarStyle(value: unknown) {
        if (value === 'default' || value === 'hidden' || value === 'hidden-inset') {
            this.titlebarStyle = value;
            return true;
        }
        return false;
    }

    private setFontSize(value: unknown) {
        if (value === 0 || value === 1 || value === 2) {
            this.fontSize = value;
            return true;
        }
        return false;
    }

    private setTableViewColumns(value: unknown) {
        if (!value) {
            this.tableViewColumns = null;
            return true;
        }
        if (!Array.isArray(value)) {
            return false;
        }
        for (const item of value) {
            if (typeof item !== 'string') {
                return false;
            }
        }
        this.tableViewColumns = value;
        return true;
    }

    private setDeviceOwnerAuth(value: unknown) {
        if (value === 'memory' || value === 'file') {
            this.deviceOwnerAuth = value;
            return true;
        } else if (!value) {
            this.deviceOwnerAuth = null;
        }
        return false;
    }

    private setWebdavSaveMethod(value: unknown) {
        if (value === 'put' || value === 'move') {
            this.webdavSaveMethod = value;
            return true;
        }
        return false;
    }

    private setGeneratorPresets(value: unknown) {
        if (!value) {
            this.generatorPresets = null;
            return true;
        }
        if (typeof value !== 'object' || Array.isArray(value)) {
            return false;
        }

        let defaultPreset: string | undefined;
        const disabled: Record<string, boolean> = {};
        const user: PasswordGeneratorCustomPreset[] = [];

        const record = value as Record<string, unknown>;
        if (typeof record.default === 'string') {
            defaultPreset = record.default;
        }
        if (
            record.disabled &&
            typeof record.disabled === 'object' &&
            !Array.isArray(record.disabled)
        ) {
            const disabledRecord = record.disabled as Record<string, unknown>;
            for (const [preset, isDisabled] of Object.entries(disabledRecord)) {
                disabled[preset] = !!isDisabled;
            }
        }
        if (Array.isArray(record.user)) {
            for (const item of record.user as unknown[]) {
                if (!item || typeof item !== 'object' || Array.isArray(item)) {
                    continue;
                }
                const itemRecord = item as Record<string, unknown>;
                if (!itemRecord.name || typeof itemRecord.name !== 'string') {
                    continue;
                }
                if (!itemRecord.title || typeof itemRecord.title !== 'string') {
                    continue;
                }
                if (!itemRecord.length || typeof itemRecord.length !== 'number') {
                    continue;
                }
                const customPreset: PasswordGeneratorCustomPreset = {
                    name: itemRecord.name,
                    title: itemRecord.title,
                    length: itemRecord.length
                };
                user.push(customPreset);

                if (typeof itemRecord.include === 'string') {
                    customPreset.include = itemRecord.include;
                }
                if (typeof itemRecord.pattern === 'string') {
                    customPreset.pattern = itemRecord.pattern;
                }
                for (const prop of Object.keys(CharRanges)) {
                    const charRange = prop as CharRange;
                    const enabled = itemRecord[charRange];
                    if (typeof enabled === 'boolean') {
                        customPreset[charRange] = enabled;
                    }
                }
            }
        }

        this.generatorPresets = {
            default: defaultPreset,
            user,
            disabled
        };

        return true;
    }
}

type AppSettingsFieldName = NonFunctionPropertyNames<AppSettingsModel>;

const instance = new AppSettingsModel();

export { instance as AppSettingsModel, AppSettingsFieldName };
