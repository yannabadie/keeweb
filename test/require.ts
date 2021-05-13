/* eslint-disable */

const Module = require('module');
import * as path from 'path';
import * as fs from 'fs';

const appBasePath = path.resolve(__dirname, '..', 'app');

const replacements = [
    {
        match: /^locales\/[\w\-]+\.json$/,
        replace: (match: string) => path.join(appBasePath, match)
    }
];

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, _parent: any): string {
    for (const { match, replace } of replacements) {
        request = request.replace(match, replace);
    }
    arguments[0] = request;
    return originalResolveFilename.apply(this, arguments);
};

function requireTextFile(filePath: string): () => { default: string } {
    return () => {
        filePath = path.resolve(__dirname, '..', filePath);
        return { default: fs.readFileSync(filePath, 'utf8') };
    };
}

const knownModules: { [name: string]: any } = {
    'public-key.pem': requireTextFile('keys/public-key.pem'),
    'public-key-new.pem': requireTextFile('keys/public-key-new.pem')
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (request: string, ...args: any[]): any {
    if (knownModules[request]) {
        return knownModules[request]();
    }
    return originalRequire.call(this, request, ...args);
};
