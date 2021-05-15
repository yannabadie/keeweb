import { Launcher } from 'comp/launcher';
import { StringFormat } from 'util/formatting/string-format';
import { Logger } from 'util/logger';

const logger = new Logger('settings');

const SettingsStore = {
    async load(key: string): Promise<unknown> {
        let data: string | null;
        if (Launcher) {
            data = await Launcher.loadConfig(key);
        } else {
            data = localStorage?.getItem(StringFormat.camelCase(key));
        }
        if (!data) {
            return Promise.resolve();
        }
        try {
            const parsed = JSON.parse(data) as unknown;
            if (typeof parsed !== 'object' || !parsed) {
                logger.error(`Error loading ${key}: read not an object`, parsed);
                return Promise.resolve();
            }
            return Promise.resolve(parsed as Record<string, unknown>);
        } catch (err) {
            logger.error(`Error loading ${key}`, err);
            return Promise.resolve();
        }
    },

    async save(key: string, data: unknown): Promise<void> {
        if (Launcher) {
            try {
                await Launcher.saveConfig(key, JSON.stringify(data));
            } catch (err) {
                logger.error(`Error saving ${key}`, err);
            }
        } else {
            localStorage?.setItem(StringFormat.camelCase(key), JSON.stringify(data));
        }
        return Promise.resolve();
    }
};

export { SettingsStore };
