import { Model } from 'util/model';
import { SettingsStore } from 'comp/settings/settings-store';
import { noop } from 'util/fn';
import { Logger } from 'util/logger';
import { NonFunctionPropertyNames } from 'util/types';

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
    // generatorPresets: unknown = null; // presets used in the password generator
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
                return setOptionalString(this, 'theme', value);
            case 'autoSwitchTheme':
                return setBoolean(this, 'autoSwitchTheme', value);
            case 'locale':
                return setOptionalString(this, 'locale', value);
            case 'expandGroups':
                return setBoolean(this, 'expandGroups', value);
            case 'listViewWidth':
                return setOptionalPositiveNumber(this, 'listViewWidth', value);
            case 'menuViewWidth':
                return setOptionalPositiveNumber(this, 'menuViewWidth', value);
            case 'tagsViewHeight':
                return setOptionalPositiveNumber(this, 'tagsViewHeight', value);
            case 'autoUpdate':
                return setAutoUpdate(this, value);
            case 'clipboardSeconds':
                return setNonNegativeNumber(this, 'clipboardSeconds', value);
            case 'autoSave':
                return setBoolean(instance, 'autoSave', value);
            case 'autoSaveInterval':
                return setNumberWithMinus1(instance, 'autoSaveInterval', value);
            case 'rememberKeyFiles':
                return setRememberKeyFiles(instance, value);
            case 'idleMinutes':
                return setNonNegativeNumber(instance, 'idleMinutes', value);
            case 'minimizeOnClose':
                return setBoolean(instance, 'minimizeOnClose', value);
            case 'minimizeOnFieldCopy':
                return setBoolean(instance, 'minimizeOnFieldCopy', value);
            case 'tableView':
                return setBoolean(instance, 'tableView', value);
            case 'colorfulIcons':
                return setBoolean(instance, 'colorfulIcons', value);
            case 'useMarkdown':
                return setBoolean(instance, 'useMarkdown', value);
            case 'directAutotype':
                return setBoolean(instance, 'directAutotype', value);
            case 'autoTypeTitleFilterEnabled':
                return setBoolean(instance, 'autoTypeTitleFilterEnabled', value);
            case 'titlebarStyle':
                return setTitlebarStyle(instance, value);
            case 'lockOnMinimize':
                return setBoolean(instance, 'lockOnMinimize', value);
            case 'lockOnCopy':
                return setBoolean(instance, 'lockOnCopy', value);
            case 'lockOnAutoType':
                return setBoolean(instance, 'lockOnAutoType', value);
            case 'lockOnOsLock':
                return setBoolean(instance, 'lockOnOsLock', value);
            case 'helpTipCopyShown':
                return setBoolean(instance, 'helpTipCopyShown', value);
            case 'templateHelpShown':
                return setBoolean(instance, 'templateHelpShown', value);
            case 'skipOpenLocalWarn':
                return setBoolean(instance, 'skipOpenLocalWarn', value);
            case 'hideEmptyFields':
                return setBoolean(instance, 'hideEmptyFields', value);
            case 'skipHttpsWarning':
                return setBoolean(instance, 'skipHttpsWarning', value);
            case 'demoOpened':
                return setBoolean(instance, 'demoOpened', value);
            case 'fontSize':
                return setFontSize(instance, value);
            case 'tableViewColumns':
                return setTableViewColumns(instance, value);
            // case 'generatorPresets':
            //     return false;
            case 'generatorHidePassword':
                return setBoolean(instance, 'generatorHidePassword', value);
            case 'cacheConfigSettings':
                return setBoolean(instance, 'cacheConfigSettings', value);
            case 'allowIframes':
                return setBoolean(instance, 'allowIframes', value);
            case 'useGroupIconForEntries':
                return setBoolean(instance, 'useGroupIconForEntries', value);
            case 'enableUsb':
                return setBoolean(instance, 'enableUsb', value);
            case 'fieldLabelDblClickAutoType':
                return setBoolean(instance, 'fieldLabelDblClickAutoType', value);
            case 'auditPasswords':
                return setBoolean(instance, 'auditPasswords', value);
            case 'auditPasswordEntropy':
                return setBoolean(instance, 'auditPasswordEntropy', value);
            case 'excludePinsFromAudit':
                return setBoolean(instance, 'excludePinsFromAudit', value);
            case 'checkPasswordsOnHIBP':
                return setBoolean(instance, 'checkPasswordsOnHIBP', value);
            case 'auditPasswordAge':
                return setNonNegativeNumber(instance, 'auditPasswordAge', value);
            case 'deviceOwnerAuth':
                return setDeviceOwnerAuth(instance, value);
            case 'deviceOwnerAuthTimeoutMinutes':
                return setNonNegativeNumber(instance, 'deviceOwnerAuthTimeoutMinutes', value);
            case 'disableOfflineStorage':
                return setBoolean(instance, 'disableOfflineStorage', value);
            case 'shortLivedStorageToken':
                return setBoolean(instance, 'shortLivedStorageToken', value);
            case 'extensionFocusIfLocked':
                return setBoolean(instance, 'extensionFocusIfLocked', value);
            case 'extensionFocusIfEmpty':
                return setBoolean(instance, 'extensionFocusIfEmpty', value);
            case 'yubiKeyShowIcon':
                return setBoolean(instance, 'yubiKeyShowIcon', value);
            case 'yubiKeyAutoOpen':
                return setBoolean(instance, 'yubiKeyAutoOpen', value);
            case 'yubiKeyMatchEntries':
                return setBoolean(instance, 'yubiKeyMatchEntries', value);
            case 'yubiKeyShowChalResp':
                return setBoolean(instance, 'yubiKeyShowChalResp', value);
            case 'yubiKeyRememberChalResp':
                return setBoolean(instance, 'yubiKeyRememberChalResp', value);
            case 'yubiKeyStuckWorkaround':
                return setBoolean(instance, 'yubiKeyStuckWorkaround', value);
            case 'canOpen':
                return setBoolean(instance, 'canOpen', value);
            case 'canOpenDemo':
                return setBoolean(instance, 'canOpenDemo', value);
            case 'canOpenSettings':
                return setBoolean(instance, 'canOpenSettings', value);
            case 'canCreate':
                return setBoolean(instance, 'canCreate', value);
            case 'canImportXml':
                return setBoolean(instance, 'canImportXml', value);
            case 'canImportCsv':
                return setBoolean(instance, 'canImportCsv', value);
            case 'canRemoveLatest':
                return setBoolean(instance, 'canRemoveLatest', value);
            case 'canExportXml':
                return setBoolean(instance, 'canExportXml', value);
            case 'canExportHtml':
                return setBoolean(instance, 'canExportHtml', value);
            case 'canSaveTo':
                return setBoolean(instance, 'canSaveTo', value);
            case 'canOpenStorage':
                return setBoolean(instance, 'canOpenStorage', value);
            case 'canOpenGenerator':
                return setBoolean(instance, 'canOpenGenerator', value);
            case 'canOpenOtpDevice':
                return setBoolean(instance, 'canOpenOtpDevice', value);
            case 'dropbox':
                return setBoolean(instance, 'dropbox', value);
            case 'dropboxFolder':
                return setOptionalString(instance, 'dropboxFolder', value);
            case 'dropboxAppKey':
                return setOptionalString(instance, 'dropboxAppKey', value);
            case 'dropboxSecret':
                return setOptionalString(instance, 'dropboxSecret', value);
            case 'webdav':
                return setBoolean(instance, 'webdav', value);
            case 'webdavSaveMethod':
                return setWebdavSaveMethod(instance, value);
            case 'webdavStatReload':
                return setBoolean(instance, 'webdavStatReload', value);
            case 'gdrive':
                return setBoolean(instance, 'gdrive', value);
            case 'gdriveClientId':
                return setOptionalString(instance, 'gdriveClientId', value);
            case 'gdriveClientSecret':
                return setOptionalString(instance, 'gdriveClientSecret', value);
            case 'onedrive':
                return setBoolean(instance, 'onedrive', value);
            case 'onedriveClientId':
                return setOptionalString(instance, 'onedriveClientId', value);
            case 'onedriveClientSecret':
                return setOptionalString(instance, 'onedriveClientSecret', value);
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
}

function setOptionalString(
    instance: AppSettingsModel,
    key:
        | 'theme'
        | 'locale'
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
            instance[key] = value;
            return true;
        }
    } else {
        instance[key] = null;
        return true;
    }
    return false;
}

function setOptionalPositiveNumber(
    instance: AppSettingsModel,
    key: 'listViewWidth' | 'menuViewWidth' | 'tagsViewHeight',
    value: unknown
): boolean {
    if (value) {
        if (typeof value === 'number' && value > 0) {
            instance[key] = value;
            return true;
        }
    } else {
        instance[key] = null;
        return true;
    }
    return false;
}

function setNonNegativeNumber(
    instance: AppSettingsModel,
    key: 'clipboardSeconds' | 'idleMinutes' | 'auditPasswordAge' | 'deviceOwnerAuthTimeoutMinutes',
    value: unknown
): boolean {
    if (typeof value === 'number' && value >= 0) {
        instance[key] = value;
        return true;
    } else if (!value) {
        instance[key] = 0;
    }
    return false;
}

function setNumberWithMinus1(
    instance: AppSettingsModel,
    key: 'autoSaveInterval',
    value: unknown
): boolean {
    if (typeof value === 'number' && (value >= 0 || value === -1)) {
        instance[key] = value;
        return true;
    } else if (!value) {
        instance[key] = 0;
    }
    return false;
}

type BooleanPropertyNames<T> = {
    [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

function setBoolean(
    instance: AppSettingsModel,
    key: NonNullable<BooleanPropertyNames<AppSettingsModel>>,
    value: unknown
): boolean {
    if (typeof value === 'boolean') {
        instance[key] = value;
        return true;
    }
    return true;
}

function setAutoUpdate(instance: AppSettingsModel, value: unknown) {
    if (value) {
        if (value === 'install' || value === 'check') {
            instance.autoUpdate = value;
            return true;
        }
    } else {
        instance.autoUpdate = null;
        return true;
    }
    return false;
}

function setRememberKeyFiles(instance: AppSettingsModel, value: unknown) {
    if (value === 'path' || value === 'data') {
        instance.rememberKeyFiles = value;
        return true;
    }
    return false;
}

function setTitlebarStyle(instance: AppSettingsModel, value: unknown) {
    if (value === 'default' || value === 'hidden' || value === 'hidden-inset') {
        instance.titlebarStyle = value;
        return true;
    }
    return false;
}

function setFontSize(instance: AppSettingsModel, value: unknown) {
    if (value === 0 || value === 1 || value === 2) {
        instance.fontSize = value;
        return true;
    }
    return false;
}

function setTableViewColumns(instance: AppSettingsModel, value: unknown) {
    if (!value) {
        instance.tableViewColumns = null;
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
    instance.tableViewColumns = value;
    return true;
}

function setDeviceOwnerAuth(instance: AppSettingsModel, value: unknown) {
    if (value === 'memory' || value === 'file') {
        instance.deviceOwnerAuth = value;
        return true;
    } else if (!value) {
        instance.deviceOwnerAuth = null;
    }
    return false;
}

function setWebdavSaveMethod(instance: AppSettingsModel, value: unknown) {
    if (value === 'put' || value === 'move') {
        instance.webdavSaveMethod = value;
        return true;
    }
    return false;
}

type AppSettingsFieldName = NonFunctionPropertyNames<AppSettingsModel>;

const instance = new AppSettingsModel();

export { instance as AppSettingsModel, AppSettingsFieldName };
