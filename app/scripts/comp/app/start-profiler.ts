import { Logger } from 'util/logger';

const logger = new Logger('start-profiler');

let lastTs = 0;

interface AppProfileOperation {
    name: string;
    elapsed: number;
}

interface AppProfileData {
    timings: AppProfileOperation[];
    totalTime: number;
}

const operations: AppProfileOperation[] = [];

const StartProfiler = {
    milestone(name: string): void {
        const ts = logger.ts();
        const elapsed = ts - lastTs;
        lastTs = ts;
        operations.push({ name, elapsed });
    },

    report(): void {
        const networkTime = this.getNetworkTime();
        operations.unshift({ name: 'fetching', elapsed: networkTime });

        const time = Math.round(performance.now());

        this.printReport('App', operations, time);
    },

    reportAppProfile(data: AppProfileData): void {
        this.printReport('Electron app', data.timings, data.totalTime);
    },

    printReport(name: string, operations: AppProfileOperation[], totalTime: number): void {
        const message =
            `${name} started in ${totalTime}ms: ` +
            operations.map((op) => `${op.name}=${Math.round(op.elapsed)}ms`).join(', ');

        logger.info(message);
    },

    getNetworkTime(): number {
        let perfEntry: PerformanceNavigationTiming | PerformanceTiming | undefined;

        if (performance.getEntriesByType) {
            const [entry] = performance.getEntriesByType('navigation');
            perfEntry = entry as PerformanceNavigationTiming;
        }
        if (!perfEntry || !perfEntry.responseEnd || !perfEntry.fetchStart) {
            perfEntry = performance.timing;
        }

        return perfEntry.responseEnd - perfEntry.fetchStart;
    }
};

StartProfiler.milestone('pre-init');

export { StartProfiler };
