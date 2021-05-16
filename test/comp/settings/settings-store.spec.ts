import { expect } from 'chai';
import { SettingsStore } from 'comp/settings/settings-store';

describe('SettingsStore', () => {
    it('loads empty settings from localStorage', async () => {
        const value = await SettingsStore.load('empty');
        expect(value).to.eql(undefined);
    });

    it('loads json settings from localStorage', async () => {
        localStorage.setItem('loadFrom', '{ "key": "loaded" }');
        const value = await SettingsStore.load('load-from');
        expect(value).to.eql({ key: 'loaded' });
        localStorage.removeItem('loadFrom');
    });

    it('saves json settings to localStorage', async () => {
        await SettingsStore.save('save-to', { key: 'saved' });
        expect(localStorage.getItem('saveTo')).to.eql('{"key":"saved"}');
        localStorage.removeItem('saveTo');
    });
});
