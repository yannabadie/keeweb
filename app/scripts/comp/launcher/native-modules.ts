// import * as kdbxweb from 'kdbxweb';
import { Events } from 'util/events';
import { Logger } from 'util/logger';
import { noop, unreachable } from 'util/fn';
import { Launcher } from 'comp/launcher';
import { Timeouts } from 'const/timeouts';
import { NativeModuleCalls, NativeModuleHostCallbackMessage, YubiKeyInfo } from './desktop-ipc';

const logger = new Logger('native-module-connector');

type YkChalRespCallback = (err?: Error) => void;

interface PendingCall {
    cmd: string;
    resolve: (result: unknown) => void;
    reject: (err: unknown) => void;
}

class NativeModules {
    private _hostRunning = false;
    private _hostStartPromise: Promise<void> | undefined;
    private _usbListenerRunning = false;
    private _callId = 0;
    private _pendingCalls = new Map<number, PendingCall>();
    private _ykChalRespCallbacks = new Map<number, YkChalRespCallback>();

    constructor() {
        if (!Launcher) {
            return;
        }

        Launcher.ipcRenderer.on('native-module-host-callback', (e, msg) => {
            this.hostCallback(msg);
        });
        Launcher.ipcRenderer.on('native-module-host-error', (e, err) => {
            this.hostError(err);
        });
        Launcher.ipcRenderer.on('native-module-host-exit', (e, code, sig) => {
            this.hostExit(code, sig);
        });
        Launcher.ipcRenderer.on('native-module-host-disconnect', () => {
            this.hostDisconnect();
        });
    }

    private startHost(): Promise<void> {
        if (this._hostRunning) {
            return Promise.resolve();
        }
        if (this._hostStartPromise) {
            return this._hostStartPromise;
        }

        logger.debug('Starting native module host');

        this._hostStartPromise = this.call('start').then(() => {
            this._hostStartPromise = undefined;
            this._hostRunning = true;

            if (this._usbListenerRunning) {
                return this.call('start-usb-listener');
            }
        });

        return this._hostStartPromise;
    }

    private hostError(e: unknown): void {
        logger.error('Host error', e);
    }

    private hostDisconnect(): void {
        logger.error('Host disconnected');
    }

    private hostExit(code: number | undefined, sig: string | undefined): void {
        logger.error(`Host exited with code ${String(code)} and signal ${String(sig)}`);

        this._hostRunning = false;

        const err = new Error('Native module host crashed');

        for (const call of this._pendingCalls.values()) {
            call.reject(err);
        }
        this._pendingCalls.clear();

        for (const callback of this._ykChalRespCallbacks.values()) {
            callback(err);
        }
        this._ykChalRespCallbacks.clear();

        if (code !== 0) {
            this.autoRestartHost();
        }
    }

    private hostCallback(msg: NativeModuleHostCallbackMessage): void {
        switch (msg.cmd) {
            case 'yubikeys':
                this.numYubiKeysReceived(msg.numYubiKeys);
                return;
        }
        unreachable('Unexpected native host callback', msg.cmd);
    }

    private autoRestartHost(): void {
        setTimeout(() => {
            try {
                this.startHost().catch(noop);
            } catch (e) {
                logger.error('Native module host failed to auto-restart', e);
            }
        }, Timeouts.NativeModuleHostRestartTime);
    }

    private async call<Cmd extends keyof NativeModuleCalls>(
        cmd: Cmd,
        ...args: Parameters<NativeModuleCalls[Cmd]>
    ): Promise<ReturnType<NativeModuleCalls[Cmd]>> {
        if (cmd !== 'start') {
            await this.startHost();
        }

        return new Promise<unknown>((resolve, reject) => {
            this._callId++;
            if (this._callId === Number.MAX_SAFE_INTEGER) {
                this._callId = 1;
            }

            this._pendingCalls.set(this._callId, { cmd, resolve, reject });
            Launcher?.ipcRenderer.send('native-module-call', cmd, ...args);
        }) as Promise<ReturnType<NativeModuleCalls[Cmd]>>;
    }

    private result(callId: number, result: unknown, error: unknown) {
        const call = this._pendingCalls.get(callId);
        if (call) {
            this._pendingCalls.delete(callId);
            if (error) {
                logger.error('Received an error', call.cmd, error);
                call.reject(error);
            } else {
                call.resolve(result);
            }
        }
    }

    private numYubiKeysReceived(numYubiKeys: number) {
        Events.emit('native-modules-yubikeys', numYubiKeys);
    }

    // private yubiKeyChallengeResponseResult({ callbackId, error, result }) {
    //     const callback = ykChalRespCallbacks[callbackId];
    //     if (callback) {
    //         const willBeCalledAgain = error && error.touchRequested;
    //         if (!willBeCalledAgain) {
    //             delete ykChalRespCallbacks[callbackId];
    //         }
    //         callback(error, result);
    //     }
    // }

    startUsbListener(): Promise<void> {
        return this.call('start-usb-listener');
        this._usbListenerRunning = true;
    }

    stopUsbListener(): Promise<void> {
        this._usbListenerRunning = false;
        if (this._hostRunning) {
            return this.call('stop-usb-listener');
        }
        return Promise.resolve();
    }

    getYubiKeys(): Promise<YubiKeyInfo[]> {
        return this.call('get-yubikeys');
    }

    // yubiKeyChallengeResponse(yubiKey, challenge, slot, callback) {
    //     ykChalRespCallbacks[callId] = callback;
    //     return this.call('yubiKeyChallengeResponse', yubiKey, challenge, slot, callId);
    // }
    //
    // yubiKeyCancelChallengeResponse(): Promise<void> {
    //     if (this._hostRunning) {
    //         return this.call('yubikey-cancel-chal-resp');
    //     }
    //     return Promise.resolve();
    // }
    //
    // argon2(password: number[], salt: number[], options) {
    //     return this.call('argon2', password, salt, options);
    // }
    //
    // hardwareCryptoDeleteKey: () => {
    //     return Launcher.ipcRenderer.invoke('hardwareCryptoDeleteKey');
    // },
    //
    // hardwareEncrypt: async (value) => {
    //     const { data, salt } = await ipcRenderer.invoke('hardwareEncrypt', value.dataAndSalt());
    //     return new kdbxweb.ProtectedValue(data, salt);
    // },
    //
    // hardwareDecrypt: async (value, touchIdPrompt) => {
    //     const { data, salt } = await ipcRenderer.invoke(
    //         'hardwareDecrypt',
    //         value.dataAndSalt(),
    //         touchIdPrompt
    //     );
    //     return new kdbxweb.ProtectedValue(data, salt);
    // },
    //
    // kbdGetActiveWindow(options) {
    //     return this.call('kbdGetActiveWindow', options);
    // },
    //
    // kbdGetActivePid() {
    //     return this.call('kbdGetActivePid');
    // },
    //
    // kbdShowWindow(win) {
    //     return this.call('kbdShowWindow', win);
    // },
    //
    // kbdText(str) {
    //     return this.call('kbdText', str);
    // },
    //
    // kbdTextAsKeys(str, mods) {
    //     return this.call('kbdTextAsKeys', str, mods);
    // },
    //
    // kbdKeyPress(code, modifiers) {
    //     return this.call('kbdKeyPress', code, modifiers);
    // },
    //
    // kbdShortcut(code, modifiers) {
    //     return this.call('kbdShortcut', code, modifiers);
    // },
    //
    // kbdKeyMoveWithModifier(down, modifiers) {
    //     return this.call('kbdKeyMoveWithModifier', down, modifiers);
    // },
    //
    // kbdKeyPressWithCharacter(character, code, modifiers) {
    //     return this.call('kbdKeyPressWithCharacter', character, code, modifiers);
    // },
    //
    // kbdEnsureModifierNotPressed() {
    //     return this.call('kbdEnsureModifierNotPressed');
    // }
}

const instance = new NativeModules();

export { instance as NativeModules };
