import { Events } from 'util/events';
import { Launcher } from 'comp/launcher';
import { Alerts } from 'comp/ui/alerts';
import { Timeouts } from 'const/timeouts';
import { Locale } from 'util/locale';

const PopupNotifier = {
    init(): void {
        if (Launcher) {
            window.open = () => null;
        } else {
            const windowOpen = window.open;
            window.open = function (...args) {
                const win = windowOpen.apply(window, args);
                if (win) {
                    PopupNotifier.deferCheckClosed(win);
                    Events.emit('popup-opened', win);
                } else if (!Alerts.alertDisplayed) {
                    Alerts.error({
                        header: Locale.authPopupRequired,
                        body: Locale.authPopupRequiredBody
                    });
                }
                return win;
            };
        }
    },

    deferCheckClosed(win: Window): void {
        setTimeout(PopupNotifier.checkClosed.bind(PopupNotifier, win), Timeouts.CheckWindowClosed);
    },

    checkClosed(win: Window): void {
        if (win.closed) {
            setTimeout(
                PopupNotifier.triggerClosed.bind(PopupNotifier, win),
                Timeouts.CheckWindowClosed
            );
        } else {
            const loc = PopupNotifier.tryGetLocationSearch(win);
            if (loc) {
                try {
                    win.close();
                } catch {}
                PopupNotifier.triggerClosed(win, loc);
                return;
            }
            PopupNotifier.deferCheckClosed(win);
        }
    },

    tryGetLocationSearch(win: Window): string | undefined {
        try {
            if (win.location.host === location.host) {
                return win.location.search;
            }
        } catch {}
    },

    triggerClosed(window: Window, locationSearch?: string): void {
        Events.emit('popup-closed', window, locationSearch);
    }
};

export { PopupNotifier };
