import { expect } from 'chai';
import { AppSettingsFieldName, AppSettingsModel } from 'models/app-settings-model';

describe('AppSettingsModel', () => {
    afterEach(() => {
        AppSettingsModel.reset();
    });

    it('does not set an unknown setting', () => {
        expect(AppSettingsModel.set('unknown' as AppSettingsFieldName, 'x')).eql(false);
        expect(AppSettingsModel.toJSON()).to.eql({});
    });

    it('sets a known setting', () => {
        expect(AppSettingsModel.set('theme', 'x')).to.eql(true);
        expect(AppSettingsModel.theme).to.eql('x');
        expect(AppSettingsModel.toJSON()).to.eql({ theme: 'x' });
    });

    it('resets all settings', () => {
        expect(AppSettingsModel.set('locale', 'x')).to.eql(true);
        expect(AppSettingsModel.locale).to.eql('x');
        expect(AppSettingsModel.toJSON()).to.eql({ locale: 'x' });

        AppSettingsModel.reset();
        expect(AppSettingsModel.locale).to.eql(null);
        expect(AppSettingsModel.toJSON()).to.eql({});
    });

    it('deletes a setting', () => {
        AppSettingsModel.theme = 'x';
        AppSettingsModel.rememberKeyFiles = 'data';

        expect(AppSettingsModel.theme).to.eql('x');
        expect(AppSettingsModel.rememberKeyFiles).to.eql('data');
        expect(AppSettingsModel.toJSON()).to.eql({ theme: 'x', rememberKeyFiles: 'data' });

        AppSettingsModel.delete('theme');
        AppSettingsModel.delete('rememberKeyFiles');
        AppSettingsModel.delete('unknown' as AppSettingsFieldName);

        expect(AppSettingsModel.theme).to.eql(null);
        expect(AppSettingsModel.rememberKeyFiles).to.eql('path');
        expect(AppSettingsModel.toJSON()).to.eql({});
    });

    it('sets all settings', () => {
        const allSettings: Record<AppSettingsFieldName, unknown> = {
            theme: 'th',
            autoSwitchTheme: true,
            locale: 'loc',
            expandGroups: false,
            listViewWidth: 1,
            menuViewWidth: 2,
            tagsViewHeight: 3,
            autoUpdate: 'check',
            clipboardSeconds: 4,
            autoSave: false,
            autoSaveInterval: 5,
            rememberKeyFiles: 'data',
            idleMinutes: 6,
            minimizeOnClose: true,
            minimizeOnFieldCopy: true,
            tableView: true,
            colorfulIcons: true,
            useMarkdown: false,
            directAutotype: false,
            autoTypeTitleFilterEnabled: false,
            titlebarStyle: 'hidden-inset',
            lockOnMinimize: false,
            lockOnCopy: true,
            lockOnAutoType: true,
            lockOnOsLock: true,
            helpTipCopyShown: true,
            templateHelpShown: true,
            skipOpenLocalWarn: true,
            hideEmptyFields: true,
            skipHttpsWarning: true,
            demoOpened: true,
            fontSize: 1,
            tableViewColumns: ['x', 'y', 'z'],
            generatorHidePassword: true,
            cacheConfigSettings: true,
            allowIframes: true,
            useGroupIconForEntries: true,
            enableUsb: false,
            fieldLabelDblClickAutoType: true,
            auditPasswords: false,
            auditPasswordEntropy: false,
            excludePinsFromAudit: false,
            checkPasswordsOnHIBP: true,
            auditPasswordAge: 7,
            deviceOwnerAuth: 'memory',
            deviceOwnerAuthTimeoutMinutes: 8,
            disableOfflineStorage: true,
            shortLivedStorageToken: true,
            extensionFocusIfLocked: false,
            extensionFocusIfEmpty: false,
            yubiKeyShowIcon: false,
            yubiKeyAutoOpen: true,
            yubiKeyMatchEntries: false,
            yubiKeyShowChalResp: false,
            yubiKeyRememberChalResp: true,
            yubiKeyStuckWorkaround: true,
            canOpen: false,
            canOpenDemo: false,
            canOpenSettings: false,
            canCreate: false,
            canImportXml: false,
            canImportCsv: false,
            canRemoveLatest: false,
            canExportXml: false,
            canExportHtml: false,
            canSaveTo: false,
            canOpenStorage: false,
            canOpenGenerator: false,
            canOpenOtpDevice: false,
            dropbox: false,
            dropboxFolder: 'df',
            dropboxAppKey: 'dk',
            dropboxSecret: 'ds',
            webdav: false,
            webdavSaveMethod: 'put',
            webdavStatReload: true,
            gdrive: false,
            gdriveClientId: 'gc',
            gdriveClientSecret: 'gs',
            onedrive: false,
            onedriveClientId: 'oc',
            onedriveClientSecret: 'os'
        };

        for (const [key, value] of Object.entries(allSettings)) {
            AppSettingsModel.set(key as AppSettingsFieldName, value);
        }
        expect(AppSettingsModel.toJSON()).to.eql(allSettings);
    });

    it('loads settings and saves them on change', async () => {
        localStorage.setItem('appSettings', '{ "theme":"x" }');

        expect(AppSettingsModel.theme).to.eql(null);

        await AppSettingsModel.init();

        expect(AppSettingsModel.theme).to.eql('x');
        expect(localStorage.getItem('appSettings')).to.eql('{ "theme":"x" }');

        AppSettingsModel.theme = 'x';
        expect(localStorage.getItem('appSettings')).to.eql('{ "theme":"x" }');

        AppSettingsModel.theme = 'y';
        expect(localStorage.getItem('appSettings')).to.eql('{"theme":"y"}');

        AppSettingsModel.disableSaveOnChange();

        AppSettingsModel.theme = 'z';
        expect(localStorage.getItem('appSettings')).to.eql('{"theme":"y"}');
    });
});
