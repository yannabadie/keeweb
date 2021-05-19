import * as kdbxweb from 'kdbxweb';
import { Logger } from 'util/logger';

const logger = new Logger('online-password-checker');

const exposedPasswords = new Map<string, boolean>();

function checkIfPasswordIsExposedOnline(
    password: kdbxweb.ProtectedValue
): Promise<boolean | undefined> {
    if (!password || !password.isProtected || !password.byteLength) {
        return Promise.resolve(false);
    }
    const saltedValue = password.saltedValue();
    const cached = exposedPasswords.get(saltedValue);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }
    const passwordBytes = password.getBinary();
    return crypto.subtle
        .digest({ name: 'SHA-1' }, passwordBytes)
        .then((sha1) => {
            kdbxweb.ByteUtils.zeroBuffer(passwordBytes);
            const sha1Hex = kdbxweb.ByteUtils.bytesToHex(sha1).toUpperCase();
            const shaFirst = sha1Hex.substr(0, 5);
            return fetch(`https://api.pwnedpasswords.com/range/${shaFirst}`)
                .then((response) => response.text())
                .then((response) => {
                    const isPresent = response.includes(sha1Hex.substr(5));
                    exposedPasswords.set(saltedValue, isPresent);
                    return isPresent;
                });
        })
        .catch((e) => {
            logger.error('Error checking password online', e);
            return undefined;
        });
}

export { checkIfPasswordIsExposedOnline };
