import { expect } from 'chai';
import { StringFormat } from 'util/formatting/string-format';

describe('StringFormat', () => {
    it('capitalizes first character', () => {
        expect(StringFormat.capFirst('xYz')).to.eql('XYz');
    });

    it('adds number padding when required', () => {
        expect(StringFormat.pad(123, 5)).to.eql('00123');
    });

    it('does not add number padding when not required', () => {
        expect(StringFormat.pad(123, 3)).to.eql('123');
    });

    it('adds string padding when required', () => {
        expect(StringFormat.padStr('abc', 5)).to.eql('abc  ');
    });

    it('does not add string padding when not required', () => {
        expect(StringFormat.padStr('abc', 3)).to.eql('abc');
    });

    it('converts kebab case to camel case', () => {
        expect(StringFormat.camelCase('aa-bbb-c')).to.eql('aaBbbC');
    });

    it('converts kebab case to pascal case', () => {
        expect(StringFormat.pascalCase('aa-bbb-c')).to.eql('AaBbbC');
    });

    it('replaces version', () => {
        expect(StringFormat.replaceVersion('KeeWeb-1.11.123.x64.dmg', 'ver')).to.eql(
            'KeeWeb-ver.x64.dmg'
        );
    });
});
