import { Logger } from 'util/logger';
import { StringFormat } from 'util/formatting/string-format';

const logger = new Logger('otp');

type OtpType = 'totp' | 'hotp';
type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';
type OtpDigits = 6 | 7 | 8;

interface OtpParams {
    type: OtpType;
    secret: string;
    account?: string;
    issuer?: string;
    digits: OtpDigits;
    algorithm: OtpAlgorithm;
    period: number;
    counter?: number;
}

class Otp {
    readonly url: string;
    readonly type: OtpType;
    readonly secret: string;
    readonly account?: string;
    readonly issuer?: string;
    readonly digits: OtpDigits;
    readonly algorithm: OtpAlgorithm;
    readonly period: number;
    readonly counter?: number;
    readonly key?: ArrayBuffer;

    constructor(url: string, params: OtpParams) {
        this.url = url;

        this.type = params.type;
        this.account = params.account;
        this.secret = params.secret;
        this.issuer = params.issuer;
        this.algorithm = params.algorithm;
        this.digits = params.digits;
        this.counter = params.counter;
        this.period = params.period;

        this.key = Otp.fromBase32(this.secret);
        if (!this.key) {
            throw new Error(`Bad key: ${this.key}`);
        }
    }

    next(callback: (err?: Error, pass?: string, timeLeft?: number) => void): void {
        let valueForHashing: number;
        let timeLeft: number;
        if (this.type === 'totp') {
            if (!this.period) {
                throw new Error('Period not set for TOTP');
            }
            const now = Otp.now();
            const epoch = Math.round(now / 1000);
            valueForHashing = Math.floor(epoch / this.period);
            const msPeriod = this.period * 1000;
            timeLeft = msPeriod - (now % msPeriod);
        } else {
            if (!this.counter) {
                throw new Error('Counter not set for HOTP');
            }
            valueForHashing = this.counter;
        }
        const data = new Uint8Array(8).buffer;
        new DataView(data).setUint32(4, valueForHashing);
        this.hmac(data, (sig, err) => {
            if (!sig) {
                logger.error('OTP calculation error', err);
                return callback(err || new Error('Empty signature'));
            }
            const sigData = new DataView(sig);
            const offset = sigData.getInt8(sig.byteLength - 1) & 0xf;
            const hmac = sigData.getUint32(offset) & 0x7fffffff;
            let pass;
            if (this.issuer === 'Steam') {
                pass = Otp.hmacToSteamCode(hmac);
            } else {
                pass = Otp.hmacToDigits(hmac, this.digits);
            }
            callback(undefined, pass, timeLeft);
        });
    }

    hmac(data: ArrayBuffer, callback: (sig: ArrayBuffer | null, err?: Error) => void): void {
        const algo = { name: 'HMAC', hash: { name: this.algorithm.replace('SHA', 'SHA-') } };
        const key = this.key;
        if (!key) {
            throw new Error('Key not set');
        }
        crypto.subtle
            .importKey('raw', key, algo, false, ['sign'])
            .then((key) => {
                crypto.subtle
                    .sign(algo, key, data)
                    .then((sig) => {
                        callback(sig);
                    })
                    .catch((err) => {
                        callback(null, err);
                    });
            })
            .catch((err) => {
                callback(null, err);
            });
    }

    static now(): number {
        return Date.now();
    }

    static hmacToDigits(hmac: number, length: number): string {
        const code = hmac.toString();
        return StringFormat.pad(code.substr(code.length - length), length);
    }

    static hmacToSteamCode(hmac: number): string {
        const steamChars = '23456789BCDFGHJKMNPQRTVWXY';
        let code = '';
        for (let i = 0; i < 5; ++i) {
            code += steamChars.charAt(hmac % steamChars.length);
            hmac /= steamChars.length;
        }
        return code;
    }

    static fromBase32(str: string): ArrayBuffer | undefined {
        str = str.replace(/\s/g, '');
        const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
        let bin = '';
        for (let i = 0; i < str.length; i++) {
            const ix = alphabet.indexOf(str[i].toLowerCase());
            if (ix < 0) {
                return undefined;
            }
            bin += StringFormat.pad(ix.toString(2), 5);
        }
        const hex = new Uint8Array(Math.floor(bin.length / 8));
        for (let i = 0; i < hex.length; i++) {
            const chunk = bin.substr(i * 8, 8);
            hex[i] = parseInt(chunk, 2);
        }
        return hex.buffer;
    }

    static parseUrl(url: string): Otp {
        const match = /^otpauth:\/\/(\w+)\/([^?]+)\?(.*)/i.exec(url);
        if (!match) {
            throw new Error('Not OTP url');
        }
        const label = decodeURIComponent(match[2]);
        let issuer: string | undefined, account: string | undefined;
        if (label) {
            const parts = label.split(':');
            issuer = parts[0].trim();
            if (parts.length > 1) {
                account = parts[1].trim();
            }
        }
        const type = match[1].toLowerCase();
        const otherParams = new Map<string, string>();
        match[3].split('&').forEach((part) => {
            const parts = part.split('=', 2);
            otherParams.set(parts[0].toLowerCase(), decodeURIComponent(parts[1]));
        });

        const secret = otherParams.get('secret');
        const algorithm = otherParams.get('algorithm')?.toUpperCase() || 'SHA1';
        const digits = Number.parseInt(otherParams.get('digits') || '', 10) || 6;
        const counter = Number.parseInt(otherParams.get('counter') || '', 10) || undefined;
        const period = Number.parseInt(otherParams.get('period') || '', 10) || 30;

        if (type !== 'hotp' && type !== 'totp') {
            throw new Error(`Bad type: ${type}`);
        }
        if (!secret) {
            throw new Error('Empty secret');
        }
        if (algorithm !== 'SHA1' && algorithm !== 'SHA256' && algorithm !== 'SHA512') {
            throw new Error(`Bad algorithm: ${algorithm}`);
        }
        if (digits !== 6 && digits !== 7 && digits !== 8) {
            throw new Error(`Bad digits: ${digits}`);
        }
        if (type === 'hotp' && !counter) {
            throw new Error(`Bad counter: ${counter}`);
        }
        if (period && period < 1) {
            throw new Error(`Bad period: ${period}`);
        }

        const params: OtpParams = {
            type,
            secret,
            algorithm,
            digits,
            counter,
            period,
            issuer,
            account
        };

        return new Otp(url, params);
    }

    static isSecret(str: string): boolean {
        return !!Otp.fromBase32(str);
    }

    static makeUrl(secret: string, period: number, digits: number): string {
        const periodParam = period ? `&period=${period}` : '';
        const digitsParam = digits ? `&digits=${digits}` : '';
        return `otpauth://totp/default?secret=${secret}${periodParam}${digitsParam}`;
    }
}

export { Otp };
