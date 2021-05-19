import { AppSettingsModel } from 'models/app-settings-model';
import { Locale } from 'util/locale';
import {
    PasswordGeneratorAppSetting,
    PasswordGeneratorOptions,
    PasswordGeneratorPreset,
    PasswordGeneratorCustomPreset
} from 'util/generators/password-generator';

export const GeneratorPresets = {
    get defaultPreset(): PasswordGeneratorPreset {
        return {
            name: 'Default',
            title: Locale.genPresetDefault,
            builtIn: true,
            length: 16,
            upper: true,
            lower: true,
            digits: true
        };
    },

    get browserExtensionPreset(): PasswordGeneratorOptions {
        return {
            name: 'BrowserExtension',
            length: 20,
            upper: true,
            lower: true,
            special: true,
            brackets: true,
            ambiguous: true
        };
    },

    get builtIn(): PasswordGeneratorPreset[] {
        return [
            this.defaultPreset,
            {
                name: 'Pronounceable',
                title: Locale.genPresetPronounceable,
                builtIn: true,
                length: 10,
                lower: true,
                upper: true
            },
            {
                name: 'Med',
                title: Locale.genPresetMed,
                builtIn: true,
                length: 16,
                upper: true,
                lower: true,
                digits: true,
                special: true,
                brackets: true,
                ambiguous: true
            },
            {
                name: 'Long',
                title: Locale.genPresetLong,
                builtIn: true,
                length: 32,
                upper: true,
                lower: true,
                digits: true
            },
            { name: 'Pin4', title: Locale.genPresetPin4, builtIn: true, length: 4, digits: true },
            {
                name: 'Mac',
                title: Locale.genPresetMac,
                builtIn: true,
                length: 17,
                include: '0123456789ABCDEF',
                pattern: 'XX-'
            },
            {
                name: 'Hash128',
                title: Locale.genPresetHash128,
                builtIn: true,
                length: 32,
                include: '0123456789abcdef'
            },
            {
                name: 'Hash256',
                title: Locale.genPresetHash256,
                builtIn: true,
                length: 64,
                include: '0123456789abcdef'
            }
        ];
    },

    get all(): PasswordGeneratorPreset[] {
        let presets = this.builtIn;
        const setting = AppSettingsModel.generatorPresets;
        if (setting) {
            if (setting.user) {
                presets = presets.concat(setting.user.map((item) => ({ ...item })));
            }
            let hasDefault = false;
            presets.forEach((preset) => {
                if (setting.disabled && setting.disabled[preset.name]) {
                    preset.disabled = true;
                }
                if (setting.default === preset.name) {
                    hasDefault = true;
                    preset.default = true;
                }
            });
            if (!hasDefault) {
                presets[0].default = true;
            }
        }
        return presets;
    },

    get enabled(): PasswordGeneratorPreset[] {
        const allPresets = this.all.filter((preset) => !preset.disabled);
        if (!allPresets.length) {
            allPresets.push(this.defaultPreset);
        }
        return allPresets;
    },

    getOrCreateSetting(): PasswordGeneratorAppSetting {
        let setting = AppSettingsModel.generatorPresets;
        if (!setting) {
            setting = { user: [], disabled: {} };
        }
        return setting;
    },

    add(preset: PasswordGeneratorCustomPreset): void {
        const setting = this.getOrCreateSetting();
        if (preset.name && !setting.user.filter((p) => p.name === preset.name).length) {
            setting.user.push(preset);
            this.save(setting);
        }
    },

    remove(name: string): void {
        const setting = this.getOrCreateSetting();
        setting.user = setting.user.filter((p) => p.name !== name);
        this.save(setting);
    },

    setPreset(name: string, props: PasswordGeneratorCustomPreset): void {
        const setting = this.getOrCreateSetting();
        const preset = setting.user.filter((p) => p.name === name)[0];
        if (preset) {
            Object.assign(preset, props);
            this.save(setting);
        }
    },

    setDisabled(name: string, disabled: boolean): void {
        const setting = this.getOrCreateSetting();
        if (disabled) {
            if (!setting.disabled) {
                setting.disabled = {};
            }
            setting.disabled[name] = true;
        } else if (setting.disabled) {
            delete setting.disabled[name];
        }
        this.save(setting);
    },

    setDefault(name: string): void {
        const setting = this.getOrCreateSetting();
        if (name) {
            setting.default = name;
        } else {
            delete setting.default;
        }
        this.save(setting);
    },

    save(setting: PasswordGeneratorAppSetting): void {
        AppSettingsModel.generatorPresets = { ...setting };
    }
};
