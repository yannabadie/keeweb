export function escape(str: string): string {
    if (!str) {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function noop(): void {
    // intentionally left blank
}

export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function pick(
    obj: Record<string, unknown> | undefined,
    props: string[]
): Record<string, unknown> | undefined {
    if (!obj) {
        return obj;
    }
    const result: Record<string, unknown> = {};
    for (const prop of props) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            result[prop] = obj[prop];
        }
    }
    return result;
}

export function omit(
    obj: Record<string, unknown> | undefined,
    props: string[]
): Record<string, unknown> | undefined {
    if (!obj) {
        return obj;
    }
    const result = { ...obj };
    for (const prop of props) {
        delete result[prop];
    }
    return result;
}

export function omitEmpty(obj: undefined): undefined;
export function omitEmpty(obj: Record<string, unknown>): Record<string, unknown>;
export function omitEmpty(
    obj: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
    if (!obj) {
        return obj;
    }
    return Object.entries(obj).reduce((result, [key, value]) => {
        if (value !== undefined && value !== null) {
            result[key] = value;
        }
        return result;
    }, {} as Record<string, unknown>);
}

export function mapObject<From, To>(
    obj: Record<string, From>,
    fn: (v: From) => To
): Record<string, To> {
    return Object.entries(obj).reduce((result, [key, value]) => {
        result[key] = fn(value);
        return result;
    }, {} as Record<string, To>);
}

export function isEqual<T>(a: T, b: T): boolean {
    if (a === b) {
        return true;
    }
    if (a instanceof Date) {
        return +a === +b;
    }
    if (a instanceof Array && b instanceof Array) {
        return a.join(',') === b.join(',');
    }
    return false;
}

export function minmax(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

export function unreachable(msg: string, arg: never): never {
    throw new Error(`${msg}: ${String(arg)}`);
}
