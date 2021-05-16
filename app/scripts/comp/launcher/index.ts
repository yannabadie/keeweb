import { LauncherElectron } from './launcher-electron';

let Launcher: LauncherElectron | undefined;

if (global.process?.versions?.electron) {
    Launcher = new LauncherElectron();
}

export { Launcher };
