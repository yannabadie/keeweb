enum Level {
    Off,
    Error,
    Warn,
    Info,
    Debug,
    All
}

const MaxLogsToSave = 100;

interface LogItem {
    level: string;
    args: unknown[];
}

const lastLogs: LogItem[] = [];

class Logger {
    private readonly prefix: string;
    private level: Level;

    static readonly Level = Level;

    constructor(name: string, id?: string, level = Level.All) {
        this.prefix = name ? name + (id ? ':' + id : '') : 'default';
        this.level = level;
    }

    ts(): number;
    ts(ts: number): string;
    ts(ts?: number): string | number {
        if (typeof ts === 'number') {
            return `${Math.round(performance.now() - ts)}ms`;
        } else {
            return performance.now();
        }
    }

    private getPrefix(): string {
        return new Date().toISOString() + ' [' + this.prefix + '] ';
    }

    debug(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${args[0]}`;
        if (this.level >= Level.Debug) {
            Logger.saveLast('debug', args);
            console.log(...args); // eslint-disable-line no-console
        }
    }

    info(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${args[0]}`;
        if (this.level >= Level.Info) {
            Logger.saveLast('info', args);
            console.info(...args); // eslint-disable-line no-console
        }
    }

    warn(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${args[0]}`;
        if (this.level >= Level.Warn) {
            Logger.saveLast('warn', args);
            console.warn(...args); // eslint-disable-line no-console
        }
    }

    error(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${args[0]}`;
        if (this.level >= Level.Error) {
            Logger.saveLast('error', args);
            console.error(...args); // eslint-disable-line no-console
        }
    }

    setLevel(level: Level): void {
        this.level = level;
    }

    getLevel(): Level {
        return this.level;
    }

    static saveLast(level: string, args: unknown[]): void {
        lastLogs.push({ level, args: Array.prototype.slice.call(args) });
        if (lastLogs.length > MaxLogsToSave) {
            lastLogs.shift();
        }
    }

    static getLast(): LogItem[] {
        return lastLogs;
    }
}

export { Logger };
