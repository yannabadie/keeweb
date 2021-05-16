import { Model } from 'util/model';
import { SettingsStore } from 'comp/settings/settings-store';
import { noop, omitEmpty } from 'util/fn';

let changeListener: () => void;

class RuntimeDataModel extends Model {
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
                    this.set(key, value);
                }
            });
        }
    }

    private set(key: string, value: unknown) {
        const thisRec = this as Record<string, unknown>;
        thisRec[key] = value;
    }

    async save() {
        await SettingsStore.save('runtime-data', this);
    }

    toJSON(): Record<string, unknown> {
        return omitEmpty(this as Record<string, unknown>);
    }
}

const instance = new RuntimeDataModel();

export { instance as RuntimeDataModel };
