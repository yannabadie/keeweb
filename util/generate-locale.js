#!/usr/bin/env node

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const LocaleTsFileName = path.resolve(__dirname, '../app/scripts/util/locale.ts');
const LocaleJsonFileName = path.resolve(__dirname, '../app/locales/base.json');

const sourceCode = fs.readFileSync(LocaleTsFileName, 'utf8');
const localeData = JSON.parse(fs.readFileSync(LocaleJsonFileName, 'utf8'));

const generatedLines = [];

for (const [name, value] of Object.entries(localeData)) {
    if (value.includes('{}')) {
        generatedLines.push(`${name}: strWithReplace('${name}')`);
    } else {
        generatedLines.push(`${name}: str('${name}')`);
    }
}

const generatedCode = `// this code is generated using npm run generate-locale
${generatedLines.map((line) => `    ${line}`).join(',\n')}\n`;

let found = false;

const replacedSourceCode = sourceCode.replace(/\/\/ this code is generated [^}]+/gm, () => {
    found = true;
    return generatedCode;
});

if (!found) {
    throw new Error('Not found');
}

fs.writeFileSync(LocaleTsFileName, replacedSourceCode);

console.log('Done');
