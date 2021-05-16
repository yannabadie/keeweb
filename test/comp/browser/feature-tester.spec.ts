import { expect } from 'chai';
import { FeatureTester } from 'comp/browser/feature-tester';

describe('FeatureTester', () => {
    it('tests supported features', async () => {
        try {
            await FeatureTester.test();
        } catch (e) {
            expect.fail(`Not all features are supported. ${String(e)}`);
        }
    });
});
