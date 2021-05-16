import { AppSettingsFieldName, AppSettingsModel } from 'models/app-settings-model';
import { RuntimeDataModel } from 'models/runtime-data-model';

const ExportApi = {
    settings: {
        get(key?: AppSettingsFieldName): unknown {
            return key ? AppSettingsModel[key] : { ...AppSettingsModel };
        },
        set(key: AppSettingsFieldName, value: unknown): boolean {
            return AppSettingsModel.set(key, value);
        },
        del(key: AppSettingsFieldName): void {
            AppSettingsModel.delete(key);
        }
    },
    runtimeData: {
        get(key?: string): unknown {
            const rec = RuntimeDataModel as unknown as Record<string, unknown>;
            return key ? rec[key] : { ...RuntimeDataModel };
        },
        set(key: string, value: unknown): boolean {
            return RuntimeDataModel.set(key, value);
        },
        del(key: string): void {
            const rec = RuntimeDataModel as unknown as Record<string, unknown>;
            delete rec[key];
        }
    }
};

export { ExportApi };
