import { Events } from 'util/events';
import { Logger } from 'util/logger';
import { NativeModules } from 'comp/launcher/native-modules';
import { AppSettingsModel } from 'models/app-settings-model';
import { Features } from 'util/features';
import { noop } from 'util/fn';

const logger = new Logger('usb-listener');

const UsbListener = {
    supported: Features.isDesktop,
    attachedYubiKeys: 0,

    init(): void {
        if (!this.supported) {
            return;
        }

        Events.on('native-modules-yubikeys', (numYubiKeys) => {
            if (numYubiKeys !== this.attachedYubiKeys) {
                logger.debug(`YubiKeys changed ${this.attachedYubiKeys} => ${numYubiKeys}`);
                this.attachedYubiKeys = numYubiKeys;
                Events.emit('usb-devices-changed');
            }
        });

        AppSettingsModel.onChange('enableUsb', (enabled) => {
            if (enabled) {
                this.start().catch(noop);
            } else {
                this.stop().catch(noop);
            }
        });

        if (AppSettingsModel.enableUsb) {
            this.start().catch(noop);
        }
    },

    async start(): Promise<void> {
        logger.info('Starting USB listener');

        try {
            await NativeModules.startUsbListener();
        } catch (e) {
            logger.error('Error starting USB listener', e);
        }
    },

    async stop(): Promise<void> {
        logger.info('Stopping USB listener');

        try {
            await NativeModules.stopUsbListener();
        } catch (e) {
            logger.error('Error stopping USB listener', e);
        }

        if (this.attachedYubiKeys) {
            this.attachedYubiKeys = 0;
            Events.emit('usb-devices-changed');
        }
    }
};

export { UsbListener };
