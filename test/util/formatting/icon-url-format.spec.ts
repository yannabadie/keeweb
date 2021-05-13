import { expect } from 'chai';
import { IconUrlFormat } from 'util/formatting/icon-url-format';

describe('IconUrlFormat', () => {
    it('converts to dataurl', () => {
        expect(IconUrlFormat.toDataUrl(new Uint8Array([1, 2]))).to.eql(
            'data:image/png;base64,AQI='
        );
    });
});
