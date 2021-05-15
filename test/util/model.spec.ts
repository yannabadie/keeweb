import { expect } from 'chai';
import { DefaultModelEvents, Model } from 'util/model';

describe('Model', () => {
    interface TestModelEvents extends DefaultModelEvents {
        'my-event': (val: string) => void;
    }

    class TestModel extends Model<TestModelEvents> {
        str = 's';
        num = 42;
        strOpt?: string;
        numOpt?: number;

        emitMyEvent(val: string) {
            this.emit('my-event', val);
        }
    }

    it('makes a new model', () => {
        const model = new TestModel();

        expect(model).to.be.instanceof(Model);
        expect(model.str).to.eql('s');
        expect(model.num).to.eql(42);
        expect(model.strOpt).to.eql(undefined);
        expect(model.numOpt).to.eql(undefined);
    });

    it('serializes a model to JSON', () => {
        const model = new TestModel();

        expect(JSON.stringify(model)).to.eql('{"str":"s","num":42}');

        model.str = 'x';
        model.num = 1;
        model.strOpt = 'y';
        model.numOpt = 2;

        expect(JSON.stringify(model)).to.eql('{"str":"x","num":1,"strOpt":"y","numOpt":2}');
    });

    it('sets properties', () => {
        const model = new TestModel();

        model.str = 'str';
        model.num = 1;
        model.strOpt = 's';
        model.numOpt = 2;

        expect(model.str).to.eql('str');
        expect(model.num).to.eql(1);
        expect(model.strOpt).to.eql('s');
        expect(model.numOpt).to.eql(2);
    });

    it('generates a custom event', () => {
        const model = new TestModel();

        const eventsGenerated: string[] = [];
        model.on('my-event', (val) => {
            eventsGenerated.push(val);
        });

        model.emitMyEvent('x');

        expect(eventsGenerated).to.eql(['x']);
    });

    it('generates an event on property change', () => {
        const model = new TestModel();

        let changeEvents = 0;
        const changeStrEvents: { val: string; prev: string }[] = [];
        model.on('change', () => {
            changeEvents++;
        });
        model.onPropChange('str', (val, prev) => {
            changeStrEvents.push({ val, prev });
        });

        model.str = 'val';

        expect(changeEvents).to.eql(1);
        expect(changeStrEvents).to.eql([{ val: 'val', prev: 's' }]);
    });

    it('does not generate an event if property was not changed', () => {
        const model = new TestModel();
        model.str = 'val';

        let changeEvents = 0;
        let changeStrEvents = 0;
        model.on('change', () => {
            changeEvents++;
        });
        model.onPropChange('str', () => {
            changeStrEvents++;
        });

        model.str = 'val';

        expect(changeEvents).to.eql(0);
        expect(changeStrEvents).to.eql(0);
    });

    it('generates an event on property deletion', () => {
        const model = new TestModel();

        model.strOpt = 'x';

        let changeEvents = 0;
        const changeStrEvents: { val?: string; prev?: string }[] = [];
        model.on('change', () => {
            changeEvents++;
        });
        model.onPropChange('strOpt', (val, prev) => {
            changeStrEvents.push({ val, prev });
        });

        delete model.strOpt;

        expect(changeEvents).to.eql(1);
        expect(changeStrEvents).to.eql([{ val: undefined, prev: 'x' }]);
    });

    it('does not generate an event if a property was already deleted', () => {
        const model = new TestModel();

        delete model.strOpt;

        let changeEvents = 0;
        let changeStrEvents = 0;
        model.on('change', () => {
            changeEvents++;
        });
        model.onPropChange('strOpt', () => {
            changeStrEvents++;
        });

        delete model.strOpt;

        expect(changeEvents).to.eql(0);
        expect(changeStrEvents).to.eql(0);
    });

    it('does not generate an event if a deleted property was undefined', () => {
        const model = new TestModel();

        model.strOpt = undefined;

        let changeEvents = 0;
        let changeStrEvents = 0;
        model.on('change', () => {
            changeEvents++;
        });
        model.onPropChange('strOpt', () => {
            changeStrEvents++;
        });

        delete model.strOpt;

        expect(changeEvents).to.eql(0);
        expect(changeStrEvents).to.eql(0);
    });

    it('unsubscribes from events', () => {
        const model = new TestModel();

        let eventsGenerated = 0;
        const eventFired = () => {
            eventsGenerated++;
        };

        model.on('my-event', eventFired);
        model.on('change', eventFired);
        model.onPropChange('num', eventFired);

        model.off('my-event', eventFired);
        model.off('change', eventFired);
        model.offPropChange('num', eventFired);

        model.num = 1;
        model.emitMyEvent('x');

        expect(eventsGenerated).to.eql(0);
    });

    it('sets properties in a batch', () => {
        const model = new TestModel();

        let changed = 0;
        model.on('change', () => {
            changed++;
        });

        const changedProps: string[] = [];
        model.onPropChange('str', () => {
            changedProps.push('str');
        });
        model.onPropChange('num', () => {
            changedProps.push('num');
        });
        model.onPropChange('strOpt', () => {
            changedProps.push('strOpt');
        });
        model.onPropChange('numOpt', () => {
            changedProps.push('numOpt');
        });

        model.batchSet(() => {
            model.str = 'x';
            model.num = 1;
            model.strOpt = 'y';
            delete model.strOpt;
            model.numOpt = 2;
        });

        expect(model.str).to.eql('x');
        expect(model.num).to.eql(1);
        expect(model.strOpt).to.eql(undefined);
        expect(model.numOpt).to.eql(2);

        expect(changed).to.eql(1);
        expect(changedProps).to.eql(['str', 'num', 'strOpt', 'strOpt', 'numOpt']);
    });

    it('does not trigger change if there were not changes in a batch', () => {
        const model = new TestModel();

        let changed = 0;
        let changedProps: string[] = [];
        model.on('change', () => {
            changed++;
        });
        model.onPropChange('str', () => {
            changedProps.push('str');
        });
        model.onPropChange('num', () => {
            changedProps.push('num');
        });

        model.batchSet(() => {
            model.str = 'x';
            model.num = 1;
        });
        expect(changed).to.eql(1);
        expect(changedProps).to.eql(['str', 'num']);

        changedProps = [];
        model.batchSet(() => {
            model.str = 'y';
            model.num = 2;
        });
        expect(changed).to.eql(2);
        expect(changedProps).to.eql(['str', 'num']);

        changedProps = [];
        model.batchSet(() => {
            model.str = 'y';
            model.num = 2;
        });
        expect(changed).to.eql(2);
        expect(changedProps).to.eql([]);
    });

    it('sets properties silently', () => {
        const model = new TestModel();

        let changed = 0;

        model.on('change', () => changed++);
        model.onPropChange('str', () => changed++);
        model.onPropChange('num', () => changed++);
        model.onPropChange('strOpt', () => changed++);
        model.onPropChange('numOpt', () => changed++);

        model.batchSet(
            () => {
                model.str = 'x';
                model.num = 1;
                model.strOpt = 'y';
                delete model.strOpt;
                model.numOpt = 2;
            },
            { silent: true }
        );

        expect(changed).to.eql(0);
    });

    it('throws an error for nested batchSet', () => {
        const model = new TestModel();

        let err: Error | undefined;

        model.on('change', () => {
            expect.fail('Not expected to get here');
        });

        model.batchSet(() => {
            try {
                model.batchSet(() => {
                    expect.fail('Not expected to get here');
                });
            } catch (e) {
                if (e instanceof Error) {
                    err = e;
                }
            }
        });

        expect(err?.message).to.eql('Already in batchSet');
    });

    it('supports derived models', () => {
        class TestDerivedModel extends TestModel {
            der = 'derived';
        }

        const model = new TestDerivedModel();

        let changed = 0;
        const changedProps: string[] = [];
        model.on('change', () => changed++);
        model.onPropChange('der', () => changedProps.push('der'));
        model.onPropChange('str', () => changedProps.push('str'));

        expect(model.der).to.eql('derived');
        expect(model.str).to.eql('s');

        model.der = 'new-der';
        model.str = 'new-str';

        expect(model.der).to.eql('new-der');
        expect(model.str).to.eql('new-str');

        expect(changed).to.eql(2);
        expect(changedProps).to.eql(['der', 'str']);
    });

    it('supports models without specifying events', () => {
        class TestModelWithDefaultEvents extends Model {
            prop = 'str';
        }

        const model = new TestModelWithDefaultEvents();

        let changed = 0;
        let changedProps = 0;
        model.on('change', () => changed++);
        model.onPropChange('prop', () => changedProps++);

        model.prop = 'changed';

        expect(changed).to.eql(1);
        expect(changedProps).to.eql(1);
    });
});
