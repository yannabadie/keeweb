import { Model } from 'util/model';
import { SettingsStore } from 'comp/settings/settings-store';
import { noop, omitEmpty } from 'util/fn';
import { Logger } from 'util/logger';
import { NonFunctionPropertyNames, OptionalBooleanPropertyNames } from 'util/types';

const logger = new Logger('runtime-data');

let changeListener: () => void;

class RuntimeDataModel extends Model {
    skipFolderRightsWarning?: boolean;

    async init(): Promise<void> {
        await this.load();

        changeListener = () => this.save().catch(noop);
        this.on('change', changeListener);
    }

    disableSaveOnChange(): void {
        this.off('change', changeListener);
    }

    reset() {
        const thisRec = this as Record<string, unknown>;
        for (const key of Object.keys(thisRec)) {
            delete thisRec[key];
        }
    }

    private async load() {
        const data = await SettingsStore.load('runtime-data');
        if (data) {
            this.batchSet(() => {
                for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
                    if (!this.set(key, value)) {
                        logger.warn('Bad property', key, value);
                    }
                }
            });
        }
    }

    set(key: string, value: unknown): boolean {
        switch (key as NonFunctionPropertyNames<RuntimeDataModel>) {
            case 'skipFolderRightsWarning':
                return this.setBoolean('skipFolderRightsWarning', value);
        }
        const thisRec = this as Record<string, unknown>;
        thisRec[key] = value;
        return true;
    }

    async save() {
        await SettingsStore.save('runtime-data', this);
    }

    toJSON(): Record<string, unknown> {
        return omitEmpty(this as Record<string, unknown>);
    }

    private setBoolean(
        key: NonNullable<OptionalBooleanPropertyNames<RuntimeDataModel>>,
        value: unknown
    ): boolean {
        if (typeof value === 'boolean') {
            this[key] = value;
            return true;
        }
        if (!value) {
            this[key] = undefined;
            return true;
        }
        return true;
    }
}

const instance = new RuntimeDataModel();

export { instance as RuntimeDataModel };
