import { Launcher } from 'comp/launcher';
import { Alert, Alerts } from 'comp/ui/alerts';
import { Features } from 'util/features';
import { Locale } from 'util/locale';
import { RuntimeDataModel } from 'models/runtime-data-model';
import * as fs from 'fs';

const InstalledAppPath = '/Applications/KeeWeb.app';
let alert: Alert | undefined;

const AppRightsChecker = {
    async init(): Promise<void> {
        if (!Launcher || !Features.isMac) {
            return;
        }
        if (RuntimeDataModel.skipFolderRightsWarning) {
            return;
        }
        const appPath = await Launcher.ipcRenderer.invoke('get-app-path');
        if (!appPath.startsWith(InstalledAppPath)) {
            return;
        }
        const needRun = await this.needRunInstaller();
        if (needRun) {
            this.showAlert();
            await this.runInstaller();
        }
    },

    async needRunInstaller(): Promise<boolean> {
        const stat = await fs.promises.stat(InstalledAppPath);
        const folderIsRoot = stat && stat.uid === 0;
        return !folderIsRoot;
    },

    showAlert(): void {
        const command = `sudo chown -R root ${InstalledAppPath}`;
        alert = Alerts.alert({
            icon: 'lock',
            header: Locale.appRightsAlert,
            body: Locale.appRightsAlertBody1 + '\n' + Locale.appRightsAlertBody2,
            pre: command,
            buttons: [
                { result: 'skip', title: Locale.alertDoNotAsk, error: true },
                Alerts.buttons.ok
            ],
            success: async (result) => {
                if (result === 'skip') {
                    await this.dontAskAnymore();
                }
                alert = undefined;
            }
        });
    },

    async runInstaller(): Promise<void> {
        await Launcher?.spawn({
            cmd: `${InstalledAppPath}/Contents/Installer/KeeWeb Installer.app/Contents/MacOS/applet`,
            args: ['--install']
        });

        const needRun = await this.needRunInstaller();
        if (alert && !needRun) {
            alert.closeWithResult('cancel');
        }
    },

    async dontAskAnymore(): Promise<void> {
        const needRun = await this.needRunInstaller();
        if (needRun) {
            RuntimeDataModel.skipFolderRightsWarning = true;
        }
    }
};

export { AppRightsChecker };
