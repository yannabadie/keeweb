/* eslint-disable */

const Module = require('module');
const path = require('path');
const originalResolveFilename = Module._resolveFilename;

const appBasePath = path.resolve(__dirname, '..', 'app');

const replacements = [
    {
        match: /^locales\/[\w\-]+\.json$/,
        replace: (match: string) => path.join(appBasePath, match)
    }
];

Module._resolveFilename = function (request: string, _parent: any): string {
    for (const { match, replace } of replacements) {
        request = request.replace(match, replace);
    }
    arguments[0] = request;
    return originalResolveFilename.apply(this, arguments);
};
