import { Events } from 'util/events';
import { IdleTracker } from 'comp/browser/idle-tracker';
import { Keys } from 'const/keys';
import { FocusManager } from 'comp/app/focus-manager';

const shortcutKeyProp = navigator.platform.indexOf('Mac') >= 0 ? 'metaKey' : 'ctrlKey';

interface ShortcutDef {
    handler: (e: KeyboardEvent, code: number) => void;
    shortcut?: number;
    modal?: string;
    noPrevent?: boolean;
}

class KeyHandler {
    SHORTCUT_ACTION = 1;
    SHORTCUT_OPT = 2;
    SHORTCUT_SHIFT = 4;

    shortcuts = new Map<Keys, ShortcutDef[]>();

    init() {
        document.addEventListener('keypress', (e) => this.keypress(e));
        document.addEventListener('keydown', (e) => this.keydown(e));

        this.shortcuts.set(Keys.DOM_VK_A, [
            {
                handler: (e) => this.handleAKey(e),
                shortcut: this.SHORTCUT_ACTION,
                modal: '*',
                noPrevent: true
            }
        ]);
    }

    onKey(
        key: Keys,
        handler: (e: KeyboardEvent) => void,
        shortcut?: number,
        modal?: string,
        noPrevent?: boolean
    ): () => void {
        let keyShortcuts = this.shortcuts.get(key);
        if (!keyShortcuts) {
            keyShortcuts = [];
            this.shortcuts.set(key, keyShortcuts);
        }
        const def: ShortcutDef = {
            handler,
            shortcut,
            modal,
            noPrevent
        };
        keyShortcuts.push(def);

        return () => {
            const keyShortcuts = this.shortcuts.get(key);
            if (keyShortcuts) {
                const ix = keyShortcuts.indexOf(def);
                if (ix >= 0) {
                    keyShortcuts.splice(ix, 1);
                }
            }
        };
    }

    isActionKey(e: KeyboardEvent): boolean {
        return e[shortcutKeyProp];
    }

    keydown(e: KeyboardEvent): void {
        IdleTracker.regUserAction();
        const code = e.keyCode || e.which;
        const keyShortcuts = this.shortcuts.get(code);
        if (keyShortcuts && keyShortcuts.length) {
            for (const sh of keyShortcuts) {
                if (FocusManager.modal && sh.modal !== FocusManager.modal && sh.modal !== '*') {
                    e.stopPropagation();
                    continue;
                }
                const isActionKey = this.isActionKey(e);
                switch (sh.shortcut) {
                    case this.SHORTCUT_ACTION:
                        if (!isActionKey) {
                            continue;
                        }
                        break;
                    case this.SHORTCUT_OPT:
                        if (!e.altKey) {
                            continue;
                        }
                        break;
                    case this.SHORTCUT_SHIFT:
                        if (!e.shiftKey) {
                            continue;
                        }
                        break;
                    case this.SHORTCUT_ACTION + this.SHORTCUT_OPT:
                        if (!e.altKey || !isActionKey) {
                            continue;
                        }
                        break;
                    default:
                        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                            continue;
                        }
                        break;
                }
                let immediatePropagationStopped = false;
                e.stopImmediatePropagation = () => {
                    immediatePropagationStopped = true;
                    KeyboardEvent.prototype.stopImmediatePropagation.call(e);
                };
                sh.handler(e, code);
                if (isActionKey && !sh.noPrevent) {
                    e.preventDefault();
                }
                if (immediatePropagationStopped) {
                    break;
                }
            }
        }
    }

    keypress(e: KeyboardEvent): void {
        if (
            !FocusManager.modal &&
            e.which !== Keys.DOM_VK_RETURN &&
            e.which !== Keys.DOM_VK_ESCAPE &&
            e.which !== Keys.DOM_VK_TAB &&
            !e.altKey &&
            !e.ctrlKey &&
            !e.metaKey
        ) {
            Events.emit('keypress', e);
        } else if (FocusManager.modal) {
            Events.emit('keypress-modal', e, FocusManager.modal);
        }
    }

    reg() {
        IdleTracker.regUserAction();
    }

    handleAKey(e: KeyboardEvent): void {
        if (e.target instanceof HTMLInputElement && ['password', 'text'].includes(e.target.type)) {
            e.stopImmediatePropagation();
        } else {
            e.preventDefault();
        }
    }
}

const instance = new KeyHandler();

export { instance as KeyHandler };
