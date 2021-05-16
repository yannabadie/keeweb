/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection JSConstantReassignment

import * as path from 'path';
import * as fs from 'fs';
import { Crypto } from '@peculiar/webcrypto';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
const Module = require('module');

const jsdom = new JSDOM('', { url: 'https://app.keeweb.info' }).window;

global.crypto = new Crypto();
global.localStorage = jsdom.localStorage;

const DOMPurify = createDOMPurify(new JSDOM('').window as unknown as Window);
createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify);

const appBasePath = path.resolve(__dirname, '..', 'app');

const replacements = [
    {
        match: /^locales\/[\w\-]+\.json$/,
        replace: (match: string) => path.join(appBasePath, match)
    }
];

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...rest: any[]): string {
    for (const { match, replace } of replacements) {
        request = request.replace(match, replace);
    }
    return originalResolveFilename.call(this, request, ...rest);
};

function requireTextFile(filePath: string): () => { default: string } {
    return () => {
        filePath = path.resolve(__dirname, '..', filePath);
        return { default: fs.readFileSync(filePath, 'utf8') };
    };
}

const knownModules: Record<string, any> = {
    'public-key.pem': requireTextFile('app/resources/public-key.pem'),
    'public-key-new.pem': requireTextFile('app/resources/public-key-new.pem')
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (request: string, ...args: any[]): any {
    if (knownModules[request]) {
        return knownModules[request]();
    }
    return originalRequire.call(this, request, ...args);
};
