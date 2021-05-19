import { Launcher } from 'comp/launcher';
import { Logger } from 'util/logger';
import { noop } from 'util/fn';
import { StringFormat } from 'util/formatting/string-format';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { ClientRequestArgs } from 'http';

const logger = new Logger('transport');

const Transport = {
    async cacheFilePath(fileName?: string): Promise<string> {
        const tempPath = await Launcher?.ipcRenderer.invoke('get-temp-path');
        if (!tempPath) {
            throw new Error('Failed to get temp path');
        }
        return fileName ? path.join(tempPath, fileName) : tempPath;
    },

    async httpGet(config: {
        url: string;
        file: string;
        cache?: false;
        cleanupOldFiles?: boolean;
        noRedirect?: boolean;
        success: (fileName?: string, data?: Buffer) => void;
        error: (e: Error) => void;
    }): Promise<void> {
        let tmpFile: string;
        if (config.file) {
            const baseTempPath = await this.cacheFilePath();
            if (config.cleanupOldFiles) {
                const allFiles = await fs.promises.readdir(baseTempPath);
                for (const file of allFiles) {
                    if (
                        file !== config.file &&
                        StringFormat.replaceVersion(file, '0') ===
                            StringFormat.replaceVersion(config.file, '0')
                    ) {
                        await fs.promises.unlink(path.join(baseTempPath, file));
                    }
                }
            }
            tmpFile = path.join(baseTempPath, config.file);
            let tmpFileExists = true;
            try {
                await fs.promises.access(tmpFile);
            } catch {
                tmpFileExists = false;
            }
            if (tmpFileExists) {
                try {
                    if (config.cache && (await fs.promises.stat(tmpFile)).size > 0) {
                        logger.info('File already downloaded', config.url);
                        return config.success(tmpFile);
                    } else {
                        await fs.promises.unlink(tmpFile);
                    }
                } catch (e) {
                    fs.promises.unlink(tmpFile).catch(noop);
                }
            }
        }

        logger.info('GET ' + config.url);

        const proxy = await Launcher?.ipcRenderer.invoke('resolve-proxy', config.url);

        const url = new URL(config.url);
        const opts: ClientRequestArgs = {
            host: url.host,
            port: url.port,
            path: url.pathname + url.search
        };
        opts.headers = { 'User-Agent': navigator.userAgent };

        logger.info(
            'Request to ' +
                config.url +
                ' ' +
                (proxy ? `using proxy ${proxy.host}:${proxy.port}` : 'without proxy')
        );
        if (proxy) {
            opts.headers.Host = url.host;
            opts.host = proxy.host;
            opts.port = proxy.port;
            opts.path = config.url;
        }
        https
            .get(opts, (res) => {
                logger.info(`Response from ${config.url}: `, res.statusCode);
                if (res.statusCode === 200) {
                    if (config.file) {
                        const file = fs.createWriteStream(tmpFile);
                        res.pipe(file);
                        file.on('finish', () => {
                            file.on('close', () => {
                                config.success(tmpFile);
                            });
                            file.close();
                        });
                        file.on('error', (err) => {
                            config.error(err);
                        });
                    } else {
                        const chunks: Buffer[] = [];
                        res.on('data', (chunk) => {
                            chunks.push(chunk);
                        });
                        res.on('end', () => {
                            config.success(undefined, Buffer.concat(chunks));
                        });
                    }
                } else if (
                    res.headers.location &&
                    (res.statusCode === 301 || res.statusCode === 302)
                ) {
                    if (config.noRedirect) {
                        return config.error(new Error('Too many redirects'));
                    }
                    config.url = res.headers.location;
                    config.noRedirect = true;
                    Transport.httpGet(config).catch(noop);
                } else {
                    config.error(new Error(`HTTP status ${res.statusCode ?? 0}`));
                }
            })
            .on('error', (e) => {
                logger.error('Cannot GET ' + config.url, e);
                if (tmpFile) {
                    fs.unlink(tmpFile, noop);
                }
                config.error(e);
            });
    }
};

export { Transport };
