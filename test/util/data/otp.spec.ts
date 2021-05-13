import { expect } from 'chai';
import { Otp } from 'util/data/otp';
import { ByteUtils } from 'kdbxweb';

describe('Otp', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const otpNow = Otp.now;

    before(() => {
        Otp.now = () => 1620941762428;
    });

    after(() => {
        Otp.now = otpNow;
    });

    it('parses a simple OTP url', async () => {
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

        const { err, pass, timeLeft } = await nextCode(otp);

        expect(err).to.eql(undefined);
        expect(pass).to.eql('224612');
        expect(timeLeft).to.eql(27572);
    });

    it('parses a full OTP url', async () => {
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

        const { err, pass, timeLeft } = await nextCode(otp);

        expect(err).to.eql(undefined);
        expect(pass).to.eql('00000006');
        expect(timeLeft).to.eql(37572);
    });

    async function nextCode(otp: Otp): Promise<{ err?: Error; pass?: string; timeLeft?: number }> {
        return new Promise((resolve) =>
            otp.next((err, pass, timeLeft) => {
                resolve({ err, pass, timeLeft });
            })
        );
    }
});
