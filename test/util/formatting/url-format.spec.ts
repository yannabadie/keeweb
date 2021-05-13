import { expect } from 'chai';
import { UrlFormat } from 'util/formatting/url-format';

describe('UrlFormat', () => {
    it('extracts file name from url', () => {
        expect(UrlFormat.getDataFileName('https://example.com/data/My.file.kDBx?x=1')).to.eql(
            'My.file'
        );
    });

    it('determines if url represents a kdbx file', () => {
        expect(UrlFormat.isKdbx('//data/file.KdBx')).to.eql(true);
        expect(UrlFormat.isKdbx('//data/file.kdb')).to.eql(false);
        expect(UrlFormat.isKdbx('//data/file.kdbxx')).to.eql(false);
    });

    it('replaces multiple slashes', () => {
        expect(UrlFormat.fixSlashes('//data/file//ext')).to.eql('/data/file/ext');
    });

    it('gets directory url by full url', () => {
        expect(UrlFormat.fileToDir('/var/data/My.file.kdbx')).to.eql('/var/data');
        expect(UrlFormat.fileToDir('\\\\share\\data\\My.file.kdbx')).to.eql('\\\\share\\data');
        expect(UrlFormat.fileToDir('My.file.kdbx')).to.eql('/');
    });

    it('makes url from parts', () => {
        expect(
            UrlFormat.makeUrl('/path', {
                hello: 'world',
                data: '= &'
            })
        ).to.eql('/path?hello=world&data=%3D%20%26');
    });

    it('makes form-data params', () => {
        expect(
            UrlFormat.buildFormData({
                hello: 'world',
                data: '= &'
            })
        ).to.eql('hello=world&data=%3D%20%26');
    });

    it('removes anchor for short urls', () => {
        expect(
            UrlFormat.presentAsShortUrl('https://example.com/path?query=1#anchor' + '0'.repeat(100))
        ).to.eql('https://example.com/path?query=1#…');
    });

    it('removes query string for short urls', () => {
        expect(
            UrlFormat.presentAsShortUrl(
                'https://example.com/path?query=' + '1'.repeat(100) + '#anchor' + '0'.repeat(100)
            )
        ).to.eql('https://example.com/path?…');
    });

    it('removes query parts of path for short urls', () => {
        expect(
            UrlFormat.presentAsShortUrl(
                'https://example.com/path/' + '1'.repeat(100) + '/' + '0'.repeat(100)
            )
        ).to.eql('https://example.com/path/…');
    });

    it('doesn not remove domain for short urls', () => {
        expect(
            UrlFormat.presentAsShortUrl(
                'https://example' + '0'.repeat(100) + '.com/' + '1'.repeat(100)
            )
        ).to.eql('https://example' + '0'.repeat(100) + '.com/…');
    });
});
