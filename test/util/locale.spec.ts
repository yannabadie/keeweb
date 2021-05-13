import { Locale, setLocale } from 'util/locale';
import { expect } from 'chai';

describe('Locale', () => {
    it('returns simple locale strings', () => {
        expect(Locale.name()).to.eql('name');
    });

    it('returns replaced locale strings', () => {
        expect(Locale.minutes('3')).to.eql('3 minutes');
    });

    it('sets a custom locale', () => {
        expect(Locale.name()).to.eql('name');
        expect(Locale.minutes('3')).to.eql('3 minutes');

        setLocale({ name: 'hello', minutes: '{}m' });
        expect(Locale.name()).to.eql('hello');
        expect(Locale.minutes('2')).to.eql('2m');

        setLocale(undefined);
        expect(Locale.name()).to.eql('name');
        expect(Locale.minutes('4')).to.eql('4 minutes');
    });
});
