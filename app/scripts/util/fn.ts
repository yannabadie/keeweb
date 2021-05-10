// TODO: remove this
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

// TODO: remove this
export function pick(
    obj: { [prop: string]: any } | undefined,
    props: string[]
): { [prop: string]: any } | undefined {
    if (!obj) {
        return obj;
    }
    const result: { [prop: string]: any } = {};
    for (const prop of props) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            result[prop] = obj[prop];
        }
    }
    return result;
}

// TODO: remove this
export function omit(
    obj: { [prop: string]: any } | undefined,
    props: string[]
): { [prop: string]: any } | undefined {
    if (!obj) {
        return obj;
    }
    const result = { ...obj };
    for (const prop of props) {
        delete result[prop];
    }
    return result;
}

// TODO: remove this
export function omitEmpty(
    obj: { [prop: string]: any } | undefined
): { [prop: string]: any } | undefined {
    if (!obj) {
        return obj;
    }
    return Object.entries(obj).reduce((result: { [prop: string]: any }, [key, value]) => {
        if (value) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            result[key] = value;
        }
        return result;
    }, {});
}

// TODO: remove this
export function mapObject(
    obj: { [prop: string]: any },
    fn: (v: any) => any
): { [prop: string]: any } {
    return Object.entries(obj).reduce((result: { [prop: string]: any }, [key, value]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result[key] = fn(value);
        return result;
    }, {});
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
