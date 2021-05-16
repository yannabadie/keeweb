/* eslint-disable no-console */

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
    private readonly _prefix: string;
    level: Level;

    static readonly Level = Level;

    constructor(name: string, id?: string, level = Level.All) {
        this._prefix = name ? name + (id ? ':' + id : '') : 'default';
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
        return new Date().toISOString() + ' [' + this._prefix + '] ';
    }

    debug(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${String(args[0])}`;
        if (this.level >= Level.Debug) {
            Logger.saveLast('debug', args);
            console.log(...args);
        }
    }

    info(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${String(args[0])}`;
        if (this.level >= Level.Info) {
            Logger.saveLast('info', args);
            console.info(...args);
        }
    }

    warn(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${String(args[0])}`;
        if (this.level >= Level.Warn) {
            Logger.saveLast('warn', args);
            console.warn(...args);
        }
    }

    error(...args: unknown[]): void {
        args[0] = `${this.getPrefix()}${String(args[0])}`;
        if (this.level >= Level.Error) {
            Logger.saveLast('error', args);
            console.error(...args);
        }
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
