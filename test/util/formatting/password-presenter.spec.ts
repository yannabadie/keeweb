import * as kdbxweb from 'kdbxweb';
import { expect } from 'chai';
import { PasswordPresenter } from 'util/formatting/password-presenter';

describe('UrlFormat', () => {
    it('replaces passwords with dots', () => {
        expect(PasswordPresenter.present(10)).to.match(/^•{10}$/);
    });

    it('preserves line breaks in passwords', () => {
        const pw = kdbxweb.ProtectedValue.fromString('12\nabc\n\nd');
        expect(PasswordPresenter.presentValueWithLineBreaks(pw)).to.eql('••\n•••\n\n•');
    });
});
