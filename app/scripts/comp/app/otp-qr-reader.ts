import { Events } from 'util/events';
import { Shortcuts } from 'comp/app/shortcuts';
import { Alert, Alerts } from 'comp/ui/alerts';
import { Features } from 'util/features';
import { Locale } from 'util/locale';
import { Logger } from 'util/logger';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const QrCode = require('jsqrcode');

const logger = new Logger('otp-qr-reader');

class OtpQrReader {
    private _alert?: Alert;
    private _fileInput?: HTMLInputElement;

    constructor() {
        this.pasteEvent = this.pasteEvent.bind(this);
    }

    read() {
        let screenshotKey = Shortcuts.screenshotToClipboardShortcut();
        if (screenshotKey) {
            screenshotKey = Locale.detSetupOtpAlertBodyWith.with(screenshotKey);
        }
        const pasteKey = Features.isMobile
            ? ''
            : Locale.detSetupOtpAlertBodyWith.with(Shortcuts.actionShortcutSymbol() + 'V');
        this.startListenClipboard();
        const buttons = [
            { result: 'manually', title: Locale.detSetupOtpManualButton, silent: true },
            Alerts.buttons.cancel
        ];
        if (Features.isMobile) {
            buttons.unshift({ result: 'select', title: Locale.detSetupOtpScanButton });
        }
        const line3 = Features.isMobile
            ? Locale.detSetupOtpAlertBody3Mobile
            : Locale.detSetupOtpAlertBody3.with(pasteKey || '');
        this._alert = Alerts.alert({
            icon: 'qrcode',
            header: Locale.detSetupOtpAlert,
            body: [
                Locale.detSetupOtpAlertBody,
                Locale.detSetupOtpAlertBody1,
                Locale.detSetupOtpAlertBody2.with(screenshotKey || ''),
                line3,
                Locale.detSetupOtpAlertBody4
            ].join('\n'),
            esc: '',
            click: '',
            enter: '',
            buttons,
            complete: (res) => {
                this._alert = undefined;
                this.stopListenClipboard();
                if (res === 'select') {
                    this.selectFile();
                } else if (res === 'manually') {
                    this.enterManually();
                }
            }
        });
    }

    selectFile() {
        if (!this._fileInput) {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('capture', 'camera');
            input.setAttribute('accept', 'image/*');
            input.setAttribute('class', 'hide-by-pos');
            this._fileInput = input;
            this._fileInput.onchange = () => this.fileSelected();
        }
        this._fileInput.click();
    }

    private fileSelected() {
        const file = this._fileInput?.files?.[0];
        if (!file || file.type.indexOf('image') < 0) {
            return;
        }
        this.readFile(file);
    }

    private startListenClipboard() {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        document.addEventListener('paste', this.pasteEvent);
    }

    private stopListenClipboard() {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        document.removeEventListener('paste', this.pasteEvent);
    }

    private pasteEvent(e: ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) {
            logger.debug('Empty clipboard data');
            return;
        }
        const item = [...items].find(
            (item) => item.kind === 'file' && item.type.indexOf('image') !== -1
        );
        if (!item) {
            logger.debug('Paste without file');
            return;
        }
        logger.info('Reading pasted image', item.type);
        if (this._alert) {
            this._alert.change({
                header: Locale.detOtpImageReading
            });
        }
        const file = item.getAsFile();
        if (file) {
            this.readFile(file);
        } else {
            logger.debug('Empty file');
        }
    }

    private readFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                logger.debug('Read not a string');
                return;
            }
            logger.debug('Image data loaded');
            this.readQr(reader.result);
        };
        reader.readAsDataURL(file);
    }

    private readQr(imageData: string) {
        const image = new Image();
        image.onload = () => {
            logger.debug('Image format loaded');
            try {
                const ts = logger.ts();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
                const url = new QrCode(image).decode();
                logger.info('QR code read', logger.ts(ts));
                this.removeAlert();
                if (typeof url === 'string' && url) {
                    Events.emit('qr-url-read', url);
                } else {
                    logger.error('Error reading QR code');
                    Alerts.error({
                        header: Locale.detOtpQrWrong,
                        body: Locale.detOtpQrWrongBody
                    });
                }
            } catch (e) {
                logger.error('Error reading QR code', e);
                this.removeAlert();
                Alerts.error({
                    header: Locale.detOtpQrError,
                    body: Locale.detOtpQrErrorBody
                });
            }
        };
        image.onerror = () => {
            logger.debug('Image load error');
            this.removeAlert();
            Alerts.error({
                header: Locale.detOtpImageError,
                body: Locale.detOtpImageErrorBody
            });
        };
        image.src = imageData;
    }

    private enterManually() {
        Events.emit('qr-enter-manually');
    }

    private removeAlert() {
        if (this._alert) {
            this._alert.closeImmediate();
        }
    }
}

const instance = new OtpQrReader();

export { instance as OtpQrReader };
