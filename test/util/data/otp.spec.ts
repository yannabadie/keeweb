import { expect } from 'chai';
import { Otp } from 'util/data/otp';
import { ByteUtils } from 'kdbxweb';

describe('Otp', () => {
    it('parses a simple OTP url', () => {
        const otp = Otp.parseUrl(
            'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=IssuerParam'
        );
        expect(otp.type).to.eql('totp');
        expect(otp.secret).to.eql('JBSWY3DPEHPK3PXP');
        expect(otp.account).to.eql('alice@google.com');
        expect(otp.issuer).to.eql('Example');
        expect(otp.digits).to.eql(6);
        expect(otp.algorithm).to.eql('SHA1');
        expect(otp.period).to.eql(30);
        expect(otp.counter).to.eql(undefined);
        expect(ByteUtils.bytesToHex(otp.key!)).to.eql('48656c6c6f21deadbeef');
    });

    it('parses a full OTP url', () => {
        const otp = Otp.parseUrl(
            'otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=40'
        );
        expect(otp.type).to.eql('totp');
        expect(otp.secret).to.eql('HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ');
        expect(otp.account).to.eql('john.doe@email.com');
        expect(otp.issuer).to.eql('ACME Co');
        expect(otp.digits).to.eql(8);
        expect(otp.algorithm).to.eql('SHA256');
        expect(otp.period).to.eql(40);
        expect(otp.counter).to.eql(undefined);
        expect(ByteUtils.bytesToHex(otp.key!)).to.eql('3dc6caa4824a6d288767b2331e20b43166cb85d9');
    });
});
