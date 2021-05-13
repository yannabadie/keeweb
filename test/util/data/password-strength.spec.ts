import * as kdbxweb from 'kdbxweb';
import { expect } from 'chai';
import {
    PasswordStrengthLevel,
    passwordStrength,
    PasswordStrengthResult
} from 'util/data/password-strength';

describe('PasswordStrength', () => {
    function check(password: string, expected: PasswordStrengthResult): void {
        let actual: { [prop: string]: any } = passwordStrength(
            kdbxweb.ProtectedValue.fromString(password)
        );
        expected = { onlyDigits: false, ...expected };
        actual = { onlyDigits: false, ...actual };

        for (const [prop, expVal] of Object.entries(expected)) {
            expect(actual[prop]).to.eql(expVal, `${prop} is ${expVal} for password "${password}"`);
        }
    }

    it('returns level None for short passwords', () => {
        check('', { level: PasswordStrengthLevel.None, length: 0 });
        check('1234', { level: PasswordStrengthLevel.None, length: 4, onlyDigits: true });
    });

    it('returns level None for single character passwords', () => {
        check('000000000000', { level: PasswordStrengthLevel.None, length: 12, onlyDigits: true });
    });

    it('returns level Low for simple passwords', () => {
        check('12345=', { level: PasswordStrengthLevel.Low, length: 6 });
        check('12345Aa', { level: PasswordStrengthLevel.Low, length: 7 });
        check('1234567a', { level: PasswordStrengthLevel.Low, length: 8 });
        check('1234567ab', { level: PasswordStrengthLevel.Low, length: 9 });
        check('1234Ab', { level: PasswordStrengthLevel.Low, length: 6 });
        check('1234567', { level: PasswordStrengthLevel.Low, length: 7, onlyDigits: true });
        check('123456789012345678', {
            level: PasswordStrengthLevel.Low,
            length: '123456789012345678'.length,
            onlyDigits: true
        });
        check('abcdefghijkl', { level: PasswordStrengthLevel.Low, length: 'abcdefghijkl'.length });
    });

    it('returns level Good for passwords matching all criteria', () => {
        check('123456ABcdef', { level: PasswordStrengthLevel.Good, length: 12 });
        check('Abcdef=5k', { level: PasswordStrengthLevel.Good, length: 9 });
        check('12345678901234567890123456', {
            level: PasswordStrengthLevel.Good,
            length: '12345678901234567890123456'.length,
            onlyDigits: true
        });
    });

    it('works with long passwords', () => {
        const pass = 'ABCDabcd_-+=' + '1234567890'.repeat(100);
        check(pass, {
            level: PasswordStrengthLevel.Good,
            length: pass.length
        });
    });
});
