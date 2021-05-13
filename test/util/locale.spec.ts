import { Locale } from 'util/locale';
import { expect } from 'chai';

describe('Locale', () => {
    it('returns simple locale strings', () => {
        expect(Locale.name).to.eql('name');
        expect(Locale.get('name')).to.eql('name');
    });

    it('returns replaced locale strings', () => {
        expect(Locale.minutes.with('3')).to.eql('3 minutes');
        expect(Locale.get('minutes')).to.eql('{} minutes');
    });

    it('sets a custom locale', () => {
        expect(Locale.name).to.eql('name');
        expect(Locale.minutes.with('3')).to.eql('3 minutes');

        Locale.set({ name: 'hello', minutes: '{}m' });
        expect(Locale.name).to.eql('hello');
        expect(Locale.minutes.with('2')).to.eql('2m');

        Locale.set(undefined);
        expect(Locale.name).to.eql('name');
        expect(Locale.minutes.with('4')).to.eql('4 minutes');
    });
});
