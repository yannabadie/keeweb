import * as kdbxweb from 'kdbxweb';
import 'util/kdbxweb/protected-value';
import { expect } from 'chai';
import { Ranking } from 'util/data/ranking';

describe('Ranking', () => {
    it('returns 0 for different strings', () => {
        expect(Ranking.getStringRank('hello', 'world')).to.eql(0);
    });

    it('returns 0 for empty string', () => {
        expect(Ranking.getStringRank('hello', '')).to.eql(0);
        expect(Ranking.getStringRank('', 'hello')).to.eql(0);
    });

    it('returns 10 for equal strings', () => {
        expect(Ranking.getStringRank('hello', 'hello')).to.eql(10);
    });

    it('returns 5 for a match at start', () => {
        expect(Ranking.getStringRank('hello world', 'hello')).to.eql(5);
        expect(Ranking.getStringRank('hello', 'hello world')).to.eql(5);
    });

    it('returns 3 for a match in the middle', () => {
        expect(Ranking.getStringRank('hello world', 'world')).to.eql(3);
        expect(Ranking.getStringRank('world', 'hello world')).to.eql(3);
    });

    it('workd with protected values', () => {
        const world = kdbxweb.ProtectedValue.fromString('world');
        const hello = kdbxweb.ProtectedValue.fromString('hello');
        const helloWorld = kdbxweb.ProtectedValue.fromString('hello world');
        expect(Ranking.getStringRank('hello world', world)).to.eql(3);
        expect(Ranking.getStringRank(helloWorld, 'world')).to.eql(3);
        expect(Ranking.getStringRank(world, 'hello world')).to.eql(3);
        expect(Ranking.getStringRank('world', helloWorld)).to.eql(3);
        expect(Ranking.getStringRank('hello world', hello)).to.eql(5);
        expect(Ranking.getStringRank(helloWorld, 'hello')).to.eql(5);
        expect(Ranking.getStringRank(hello, 'hello world')).to.eql(5);
        expect(Ranking.getStringRank('hello', helloWorld)).to.eql(5);
        expect(Ranking.getStringRank('hello', hello)).to.eql(10);
        expect(Ranking.getStringRank(hello, 'hello')).to.eql(10);
    });
});
