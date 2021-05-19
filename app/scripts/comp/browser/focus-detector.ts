import { Events } from 'util/events';
import { Launcher } from 'comp/launcher';
import { Features } from 'util/features';

const FocusDetector = {
    isFocused: false,
    detectsFocusWithEvents: false,

    init(): void {
        this.isFocused = true;
        this.detectsFocusWithEvents = !Features.isDesktop && !Features.isMobile;
        if (this.detectsFocusWithEvents) {
            window.addEventListener('focus', () => {
                if (!FocusDetector.isFocused) {
                    FocusDetector.isFocused = true;
                    Events.emit('main-window-focus');
                }
            });
            window.addEventListener('blur', () => {
                if (FocusDetector.isFocused) {
                    FocusDetector.isFocused = false;
                    Events.emit('main-window-blur');
                }
            });
        }
    },

    hasFocus(): Promise<boolean> {
        if (this.detectsFocusWithEvents) {
            return Promise.resolve(this.isFocused);
        } else if (Launcher) {
            return Launcher.ipcRenderer.invoke('is-app-focused');
        } else {
            return Promise.resolve(true);
        }
    }
};

export { FocusDetector };
