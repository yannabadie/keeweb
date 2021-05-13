import createDOMPurify from 'dompurify';
import { expect } from 'chai';
import { MdToHtml } from 'util/formatting/md-to-html';
import { JSDOM } from 'jsdom';

describe('MdToHtml', () => {
    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const DOMPurify = createDOMPurify((new JSDOM('').window as unknown) as Window);
        createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify);
    });

    it('converts markdown', () => {
        expect(MdToHtml.convert('## head\n_italic_')).to.eql({
            html: '<div class="markdown"><h2>head</h2>\n<p><em>italic</em></p>\n</div>'
        });
    });

    it('does not add markdown wrapper tags for plaintext', () => {
        expect(MdToHtml.convert('plain\ntext')).to.eql({ text: 'plain\ntext' });
    });

    it('converts links', () => {
        expect(MdToHtml.convert('[link](https://x)')).to.eql({
            html:
                '<div class="markdown">' +
                '<p><a href="https://x" rel="noreferrer noopener" target="_blank">link</a></p>\n' +
                '</div>'
        });
    });
});
