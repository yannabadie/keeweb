import * as kdbxweb from 'kdbxweb';
import { Logger } from 'util/logger';

const publicKeyData = require('public-key.pem') as { default: string };
const publicKeyDataNew = require('public-key-new.pem') as { default: string };

const SignatureVerifier = {
    logger: new Logger('signature-verifier'),

    publicKeys: undefined as string[] | undefined,

    verify(
        data: ArrayBuffer | Uint8Array,
        signature: string | ArrayBuffer | Uint8Array,
        pk?: string
    ): Promise<boolean> {
        if (!pk) {
            const pks = this.getPublicKeys();
            return this.verify(data, signature, pks[0]).then((isValid) => {
                if (isValid || !pks[1]) {
                    return isValid;
                }
                return this.verify(data, signature, pks[1]);
            });
        }
        const pkData = kdbxweb.ByteUtils.base64ToBytes(pk);
        return new Promise((resolve, reject) => {
            const algo = { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } };
            try {
                if (typeof signature === 'string') {
                    signature = kdbxweb.ByteUtils.base64ToBytes(signature);
                }
                const signatureData = kdbxweb.ByteUtils.arrayToBuffer(signature);
                const subtle = window.crypto.subtle;
                const keyFormat = 'spki';
                subtle
                    .importKey(keyFormat, pkData, algo, false, ['verify'])
                    .then((cryptoKey) => {
                        try {
                            subtle
                                .verify(
                                    algo,
                                    cryptoKey,
                                    signatureData,
                                    kdbxweb.ByteUtils.arrayToBuffer(data)
                                )
                                .then((isValid) => {
                                    resolve(isValid);
                                })
                                .catch((e) => {
                                    this.logger.error('Verify error', e);
                                    reject(e);
                                });
                        } catch (e) {
                            this.logger.error('Signature verification error', e);
                            reject(e);
                        }
                    })
                    .catch((e) => {
                        this.logger.error('ImportKey error', e);
                        reject(e);
                    });
            } catch (e) {
                this.logger.error('Signature key verification error', e);
                reject(e);
            }
        });
    },

    getPublicKeys(): string[] {
        if (!this.publicKeys) {
            this.publicKeys = [];
            for (const pkData of [publicKeyData, publicKeyDataNew]) {
                const match = /-+BEGIN PUBLIC KEY-+([\s\S]+?)-+END PUBLIC KEY-+/.exec(
                    pkData.default
                );
                const data = match?.[1]?.replace(/\s+/g, '');
                if (data) {
                    this.publicKeys.push(data);
                }
            }
        }
        return this.publicKeys;
    }
};

export { SignatureVerifier };
