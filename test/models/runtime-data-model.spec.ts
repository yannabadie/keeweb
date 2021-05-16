import { expect } from 'chai';
import { RuntimeDataModel } from 'models/runtime-data-model';

describe('RuntimeDataModel', () => {
    afterEach(() => {
        RuntimeDataModel.reset();
    });

    it('sets an unknown property', () => {
        const model = RuntimeDataModel as unknown as Record<string, unknown>;

        model.x = 'xx';
        expect(model.x).to.eql('xx');
        expect(RuntimeDataModel.toJSON()).to.eql({ x: 'xx' });

        RuntimeDataModel.reset();
        expect(model.x).to.eql(undefined);
        expect(RuntimeDataModel.toJSON()).to.eql({});
    });

    it('loads values and saves them on change', async () => {
        const model = RuntimeDataModel as unknown as Record<string, unknown>;

        localStorage.setItem('runtimeData', '{ "x": "xx" }');

        expect(model.x).to.eql(undefined);

        await RuntimeDataModel.init();

        expect(model.x).to.eql('xx');
        expect(localStorage.getItem('runtimeData')).to.eql('{ "x": "xx" }');

        model.x = 'xx';
        expect(localStorage.getItem('runtimeData')).to.eql('{ "x": "xx" }');

        model.x = 'y';
        expect(localStorage.getItem('runtimeData')).to.eql('{"x":"y"}');

        RuntimeDataModel.disableSaveOnChange();

        model.x = 'z';
        expect(localStorage.getItem('runtimeData')).to.eql('{"x":"y"}');
    });
});
