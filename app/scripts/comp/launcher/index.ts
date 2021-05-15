import { LauncherElectron } from './launcher-electron';

let Launcher: LauncherElectron | undefined;

if (window.process && window.process.versions && window.process.versions.electron) {
    Launcher = new LauncherElectron();
}

export { Launcher };
