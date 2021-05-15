import { TypedEmitter } from 'tiny-typed-emitter';

type ListenerSignature<EventSpec> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [EventName in keyof EventSpec]: (...args: any[]) => any;
};

export interface DefaultModelEvents {
    'change': () => void;
}

interface ModelTypedEmitter extends TypedEmitter {
    changePending?: boolean;
    batchSet?: boolean;
    silent?: boolean;
}

const DefaultMaxListeners = 100;

const SymbolEmitter = Symbol('emitter');

function emitPropChange(target: Model, prop: string, value: unknown, prevValue: unknown) {
    const emitter = target[SymbolEmitter] as ModelTypedEmitter;
    if (emitter) {
        if (!emitter.silent) {
            emitter.emit(`change:${prop}`, value, prevValue);
            if (emitter.batchSet) {
                emitter.changePending = true;
            } else {
                emitter.emit(`change`);
            }
        }
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const ProxyDef: ProxyHandler<any> = {
    deleteProperty(target: any, prop: string | symbol): boolean {
        const prevValue = target[prop];
        const value = undefined;
        if (prevValue !== value) {
            delete target[prop];
            if (typeof prop === 'string') {
                emitPropChange(target, prop, value, prevValue);
            }
        }
        return true;
    },

    set(target: any, prop: string | symbol, value: unknown): boolean {
        const prevValue = target[prop];
        if (prevValue !== value) {
            target[prop] = value;
            if (typeof prop === 'string') {
                emitPropChange(target, prop, value, prevValue);
            }
        }
        return true;
    }
};

/* eslint-enable */

type NonFunctionPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export class Model<EventSpec extends ListenerSignature<EventSpec> = DefaultModelEvents> {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return new Proxy(this, ProxyDef);
    }

    [SymbolEmitter]: TypedEmitter<EventSpec>;

    private emitter(): TypedEmitter<EventSpec> {
        let emitter = this[SymbolEmitter];
        if (!emitter) {
            this[SymbolEmitter] = emitter = new TypedEmitter<EventSpec>();
            emitter.setMaxListeners(DefaultMaxListeners);
        }
        return emitter;
    }

    protected emit<EventName extends keyof EventSpec>(
        event: EventName,
        ...args: Parameters<EventSpec[EventName]>
    ): boolean {
        return this.emitter().emit(event, ...args);
    }

    once<EventName extends keyof EventSpec>(
        event: EventName,
        listener: EventSpec[EventName]
    ): this {
        this.emitter().once(event, listener);
        return this;
    }

    on<EventName extends keyof EventSpec>(event: EventName, listener: EventSpec[EventName]): this {
        this.emitter().on(event, listener);
        return this;
    }

    off<EventName extends keyof EventSpec>(event: EventName, listener: EventSpec[EventName]): this {
        this.emitter().off(event, listener);
        return this;
    }

    onPropChange<PropName extends NonFunctionPropertyNames<this>>(
        prop: PropName,
        listener: (value: this[PropName], prevValue: this[PropName]) => void
    ): this {
        const emitter = this.emitter() as TypedEmitter;
        emitter.on(`change:${prop}`, listener);
        return this;
    }

    offPropChange(prop: NonFunctionPropertyNames<this>, listener: () => void): this {
        const emitter = this.emitter() as TypedEmitter;
        emitter.off(`change:${prop}`, listener);
        return this;
    }

    batchSet(setter: () => void, opts?: { silent?: boolean }): void {
        const emitter = this[SymbolEmitter] as ModelTypedEmitter;

        if (emitter) {
            if (emitter.batchSet) {
                throw new Error('Already in batchSet');
            }
            emitter.batchSet = true;
            if (opts?.silent) {
                emitter.silent = true;
            }
        }

        try {
            setter();
        } finally {
            if (emitter) {
                emitter.batchSet = false;
                if (opts?.silent) {
                    emitter.silent = false;
                }
                if (emitter.changePending) {
                    emitter.changePending = false;
                    if (!opts?.silent) {
                        emitter.emit('change');
                    }
                }
            }
        }
    }
}
