import { expect } from 'chai';
import { SignatureVerifier } from 'util/data/signature-verifier';

describe('SignatureVerifier', () => {
    it('verifies an invalid signature', async () => {
        const valid = await SignatureVerifier.verify(new Uint8Array([1, 2, 3]), 'aaaa');
        expect(valid).to.eql(false);
    });
});
