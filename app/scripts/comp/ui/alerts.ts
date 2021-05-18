import { Locale } from 'util/locale';

export interface AlertButton {
    result: string;
    title: string;
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
}

type AlertResult = string | undefined;

const alertDisplayed = false;

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

    alert(config: AlertConfig): Promise<AlertResult> {
        if (config.skipIfAlertDisplayed && Alerts.alertDisplayed) {
            return Promise.resolve(undefined);
        }
        return Promise.reject('Not implemented');
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

    notImplemented(): Promise<AlertResult> {
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

    info(config: AlertConfig): Promise<AlertResult> {
        return this.alert({
            icon: 'info',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: '',
            ...config
        });
    },

    error(config: AlertConfig): Promise<AlertResult> {
        return this.alert({
            icon: 'exclamation-circle',
            buttons: [this.buttons.ok],
            esc: '',
            click: '',
            enter: '',
            ...config
        });
    },

    yesno(config: AlertConfig): Promise<AlertResult> {
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
