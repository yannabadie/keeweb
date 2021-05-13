import { ProtectedValue, ByteUtils } from 'kdbxweb';
import 'util/kdbxweb/protected-value';
import { expect } from 'chai';

describe('ProtectedValue', () => {
    it('returns length', () => {
        expect(ProtectedValue.fromString('').length).to.eql(0);
        expect(ProtectedValue.fromString('123').length).to.eql(3);
    });

    it('returns textLength', () => {
        expect(ProtectedValue.fromString('').textLength).to.eql(0);
        expect(ProtectedValue.fromString('123').textLength).to.eql(3);
    });

    it('returns isProtected', () => {
        expect(ProtectedValue.fromString('hello').isProtected).to.eql(true);
    });

    it('iterates over characters', () => {
        const str = 'Hello, world! äß';
        const chars: number[] = [];
        const expected = [...str].map((ch) => ch.charCodeAt(0));
        ProtectedValue.fromString(str).forEachChar((ch) => {
            chars.push(ch);
        });
        expect(chars).to.eql(expected);
    });

    it('iterates over characters until the callback returns false', () => {
        const chars: number[] = [];
        const expected = [...'Hello'].map((ch) => ch.charCodeAt(0));
        ProtectedValue.fromString('Hello, world!').forEachChar((ch) => {
            chars.push(ch);
            return chars.length !== 5;
        });
        expect(chars).to.eql(expected);
    });

    it('checks if value includes string', () => {
        expect(ProtectedValue.fromString('Hello, world!').includesLower('hello')).to.eql(true);
        expect(ProtectedValue.fromString('Hello, world!').includesLower('world')).to.eql(true);
        expect(ProtectedValue.fromString('Hello, world!').includesLower('boo')).to.eql(false);
    });

    it('gets the position of included string', () => {
        expect(ProtectedValue.fromString('Hello, world!').indexOfLower('hello')).to.eql(0);
        expect(ProtectedValue.fromString('Hello, world!').indexOfLower('world')).to.eql(7);
        expect(ProtectedValue.fromString('Hello, world!').indexOfLower('boo')).to.eql(-1);
    });

    it('gets the position of self in a string', () => {
        expect(ProtectedValue.fromString('Hello').indexOfSelfInLower('hello, world!')).to.eql(0);
        expect(ProtectedValue.fromString('World').indexOfSelfInLower('hello, world!')).to.eql(7);
        expect(ProtectedValue.fromString('boo').indexOfSelfInLower('hello, world!')).to.eql(-1);
    });

    it('checks equality', () => {
        expect(ProtectedValue.fromString('Hello').equals(undefined)).to.eql(false);
        expect(ProtectedValue.fromString('Hello').equals('Hello')).to.eql(true);
        expect(ProtectedValue.fromString('Hello').equals('boo')).to.eql(false);
        expect(
            ProtectedValue.fromString('Hello').equals(ProtectedValue.fromString('Hello'))
        ).to.eql(true);
        expect(ProtectedValue.fromString('Hello').equals(ProtectedValue.fromString('boo'))).to.eql(
            false
        );
    });

    it('checks if it is a field reference', () => {
        expect(ProtectedValue.fromString('Hello').isFieldReference()).to.eql(false);
        expect(
            ProtectedValue.fromString(
                '{REF:1@I:12345678900000000000000000000000}'
            ).isFieldReference()
        ).to.eql(true);
    });

    it('returns data and salt', () => {
        const text = 'Hello, world!';
        const value = ProtectedValue.fromString(text);
        const dataAndSalt = value.dataAndSalt();
        const data = new Uint8Array(dataAndSalt.data);
        const salt = new Uint8Array(dataAndSalt.salt);
        const newValue = new ProtectedValue(data, salt);
        expect(newValue.getText()).to.eql(text);
    });

    it('returns salted value', () => {
        const text = 'Hello, world!';
        const v1 = ProtectedValue.fromString(text);
        const v2 = ProtectedValue.fromString(text);
        const vDiff = ProtectedValue.fromString('Another');
        expect(v1.saltedValue()).to.eql(v2.saltedValue());
        expect(v1.saltedValue()).to.not.eql(vDiff.saltedValue());
    });
});
