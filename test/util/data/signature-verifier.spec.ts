import * as crypto from 'crypto';
import { expect } from 'chai';
import { SignatureVerifier } from 'util/data/signature-verifier';

describe('SignatureVerifier', () => {
    it('verifies an invalid signature', async () => {
        const valid = await SignatureVerifier.verify(new Uint8Array([1, 2, 3]), 'aaaa');
        expect(valid).to.eql(false);
        expect(SignatureVerifier.getPublicKeys().length).to.eql(2);
    });

    it('verifies a valid signature', async () => {
        const data = new Uint8Array([1, 2, 3]);

        const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        const publicKeyData = keys.publicKey.export({ format: 'pem', type: 'spki' }).toString();
        const publicKey = SignatureVerifier.extractPublicKeyContent(publicKeyData);

        const signer = crypto.createSign('sha256');
        signer.update(data);
        const signature = signer.sign(keys.privateKey, 'base64');

        const valid = await SignatureVerifier.verify(data, signature, publicKey);
        expect(valid).to.eql(true);
    });
});
