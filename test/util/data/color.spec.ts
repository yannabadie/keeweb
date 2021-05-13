import { expect } from 'chai';
import { Color } from 'util/data/color';

describe('Color', () => {
    it('makes a new color', () => {
        const color = new Color();
        expect(color.toHex()).to.eql('#000000');
        expect(color.a).to.eql(1);
        expect(color.toHsla()).to.eql('hsla(0,0%,0%,1)');
    });

    it('parses rgb', () => {
        const color = new Color('rgb(1, 2, 3)');
        expect(color.toHex()).to.eql('#010203');
        expect(color.a).to.eql(1);
        expect(color.toHsla()).to.eql('hsla(58,50%,1%,1)');
    });

    it('parses rgba', () => {
        const color = new Color('rgba(1, 2,3, 0.4)');
        expect(color.toHex()).to.eql('#010203');
        expect(color.a).to.eql(0.4);
        expect(color.toHsla()).to.eql('hsla(58,50%,1%,0.4)');
    });

    it('parses hex', () => {
        const color = new Color('#0a02Fc');
        expect(color.toHex()).to.eql('#0a02fc');
        expect(color.a).to.eql(1);
        expect(color.toHsla()).to.eql('hsla(67,98%,50%,1)');
    });

    it('mixes colors', () => {
        const red = new Color('#ff0000');
        const green = new Color('#00ff00');
        const mixed = red.mix(green, 0.3);
        expect(mixed.toHex()).to.eql('#4db300');
    });

    it('calculates distance between colors', () => {
        const red = new Color('#ff0000');
        const darkRed = new Color('#af0000');
        const green = new Color('#00ff00');
        expect(red.distanceTo(darkRed)).to.be.lessThan(red.distanceTo(green));
    });

    it('gets known bg colors', () => {
        expect(Color.getKnownBgColor('red')).to.eql('#ff8888');
        expect(Color.getKnownBgColor('boo')).to.eql(undefined);
    });

    it('gets nearest colors', () => {
        expect(Color.getNearest('#e22c2c')).to.eql('red');
        expect(Color.getNearest('#33d037')).to.eql('green');
        expect(Color.getNearest('#0675e3')).to.eql('blue');
    });
});
