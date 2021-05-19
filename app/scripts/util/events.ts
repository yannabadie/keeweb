import { TypedEmitter } from 'tiny-typed-emitter';

interface EventSpec {
    'app-minimized': () => void;
    'app-maximized': () => void;
    'app-unmaximized': () => void;
    'dark-mode-changed': (dark: boolean) => void;
    'before-user-idle': () => void;
    'user-idle': () => void;
    'power-monitor-resume': () => void;
    'theme-applied': () => void;
    'set-locale': (locale: string) => void;
    'native-modules-yubikeys': (numYubiKeys: number) => void;
    'second-instance': () => void;
    'usb-devices-changed': () => void;
    'main-window-focus': () => void;
    'main-window-blur': () => void;
    'main-window-will-close': () => void;
    'keypress': (e: KeyboardEvent) => void;
    'keypress-modal': (e: KeyboardEvent, modal: string) => void;
}

class Events extends TypedEmitter<EventSpec> {
    constructor() {
        super();
        this.setMaxListeners(1000);
    }
}

const instance = new Events();

export { instance as Events };
