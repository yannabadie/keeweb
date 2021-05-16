import { expect } from 'chai';
import { SettingsStore } from 'comp/settings/settings-store';

describe('SettingsStore', () => {
    it('loads empty settings from localStorage', async () => {
        const value = await SettingsStore.load('empty');
        expect(value).to.eql(undefined);
    });

    it('loads json settings from localStorage', async () => {
        localStorage.setItem('load', '{ "key": "loaded" }');
        const value = await SettingsStore.load('load');
        expect(value).to.eql({ key: 'loaded' });
        localStorage.removeItem('load');
    });

    it('saves json settings to localStorage', async () => {
        await SettingsStore.save('save', { key: 'saved' });
        expect(localStorage.getItem('save')).to.eql('{"key":"saved"}');
        localStorage.removeItem('save');
    });
});
