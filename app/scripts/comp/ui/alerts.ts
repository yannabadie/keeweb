import { Locale } from 'util/locale';

export interface AlertButton {
    result: string;
    title: string;
    error?: boolean;
}

export interface AlertConfig {
    header: string;
    body: string;
    icon?: string;
    buttons?: AlertButton[];
    esc?: string;
    click?: string;
    enter?: string;
    skipIfAlertDisplayed?: boolean;
    pre?: string;

    success?: (result: string, checked?: boolean) => void;
    complete?: (result: string, checked?: boolean) => void;
    cancel?: () => void;
}

const alertDisplayed = false;

export class Alert {
    visible = false;
    result: string | undefined;

    wait(): Promise<string> {
        throw new Error('Not implemented');
    }

    closeWithResult(result: string): void {
        this.result = result;
        throw new Error('Not implemented');
    }

    closeImmediate(): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    change(config: { header?: string }): void {
        throw new Error('Not implemented');
    }
}

export const Alerts = {
    get alertDisplayed(): boolean {
        return alertDisplayed;
    },

    buttons: {
        ok: {
            result: 'yes',
            get title() {
                return Locale.alertOk;
            }
        },
        yes: {
            result: 'yes',
            get title() {
                return Locale.alertYes;
            }
        },
        allow: {
            result: 'yes',
            get title() {
                return Locale.alertAllow;
            }
        },
        no: {
            result: '',
            get title() {
                return Locale.alertNo;
            }
        },
        cancel: {
            result: '',
            get title() {
                return Locale.alertCancel;
            }
        },
        deny: {
            result: '',
            get title() {
                return Locale.alertDeny;
            }
        }
    } as Record<string, AlertButton>,

    alert(config: AlertConfig): Alert {
        const alert = new Alert();
        if (config.skipIfAlertDisplayed && Alerts.alertDisplayed) {
            alert.visible = false;
            return alert;
        }
        throw new Error('Not implemented');
        // Alerts.alertDisplayed = true;
        // const view = new ModalView(config);
        // view.render();
        // view.once('result', (res, check) => {
        //     if (res && config.success) {
        //         config.success(res, check);
        //     }
        //     if (!res && config.cancel) {
        //         config.cancel();
        //     }
        //     if (config.complete) {
        //         config.complete(res, check);
        //     }
        // });
        // view.on('will-close', () => {
        //     Alerts.alertDisplayed = false;
        // });
        // return view;
    },

    notImplemented(): Alert {
        return this.alert({
            header: Locale.notImplemented,
            body: '',
            icon: 'exclamation-triangle',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: ''
        });
    },

    info(config: AlertConfig): Alert {
        return this.alert({
            icon: 'info',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: '',
            ...config
        });
    },

    error(config: AlertConfig): Alert {
        return this.alert({
            icon: 'exclamation-circle',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: '',
            ...config
        });
    },

    yesno(config: AlertConfig): Alert {
        return this.alert({
            icon: 'question',
            buttons: [this.buttons.yes, this.buttons.no],
            esc: '',
            click: '',
            enter: 'yes',
            ...config
        });
    }
};
