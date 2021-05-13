import { expect } from 'chai';
import { CsvParser } from 'util/data/csv-parser';

describe('CsvParser', () => {
    it('parses a simple csv', () => {
        const parser = new CsvParser();
        const result = parser.parse('key,value\nhello,world');
        expect(result.headers).to.eql(['key', 'value']);
        expect(result.rows).to.eql([['hello', 'world']]);
    });

    it('parses multiple rows with quotes', () => {
        const parser = new CsvParser();
        const result = parser.parse('key,value\n"quoted", \'value\'\nunquoted,value');
        expect(result.headers).to.eql(['key', 'value']);
        expect(result.rows).to.eql([
            ['quoted', " 'value'"],
            ['unquoted', 'value']
        ]);
    });

    it('throws an error for empty csv', () => {
        const parser = new CsvParser();
        expect(() => {
            parser.parse('key,value');
        }).to.throw('Empty CSV');
    });
});
