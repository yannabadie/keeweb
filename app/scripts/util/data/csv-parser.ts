interface CsvParseResult {
    headers: string[];
    rows: string[][];
}

type OperationHandler = () => OperationHandler;

/* eslint-disable @typescript-eslint/unbound-method */

class CsvParser {
    private _next: OperationHandler = this.handleError;
    private _csv = '';
    private _index = 0;
    private _line: string[] = [];
    private _lines: string[][] = [];
    private _value = '';
    result: string[][] = [];
    error?: string;

    parse(csv: string): CsvParseResult {
        this._csv = csv.trim().replace(/\r\n/g, '\n');
        this.result = [];
        this._next = this.handleBeforeValue;
        this._index = 0;
        while (this._index < this._csv.length) {
            this._next = this._next();
        }
        if (this._line.length) {
            this._lines.push(this._line);
            this._line = [];
        }
        if (this._lines.length <= 1) {
            throw new Error('Empty CSV');
        }
        return { headers: this._lines[0], rows: this._lines.slice(1) };
    }

    private handleBeforeValue(): OperationHandler {
        const isQuoted = this._csv[this._index] === '"';
        if (isQuoted) {
            this._index++;
            this._value = '';
            return this.handleQuotedValue;
        }
        return this.handleUnquotedValue;
    }

    private handleUnquotedValue(): OperationHandler {
        const commaIndex = this._csv.indexOf(',', this._index);
        const newLineIndex = this._csv.indexOf('\n', this._index);

        let nextIndex;
        if (commaIndex >= 0 && (newLineIndex < 0 || commaIndex < newLineIndex)) {
            nextIndex = commaIndex;
        } else if (newLineIndex >= 0) {
            nextIndex = newLineIndex;
        } else {
            nextIndex = this._csv.length;
        }

        const value = this._csv.substr(this._index, nextIndex - this._index);
        this._line.push(value);

        this._index = nextIndex;

        return this.handleAfterValue;
    }

    private handleQuotedValue(): OperationHandler {
        const nextQuoteIndex = this._csv.indexOf('"', this._index);
        const nextBackslashIndex = this._csv.indexOf('\\', this._index);

        if (nextQuoteIndex < 0) {
            this._index = this._csv.length;
            this.error = 'Quoted value not closed';
            return this.handleError;
        }

        if (nextBackslashIndex > 0 && nextBackslashIndex < nextQuoteIndex) {
            const charAfterBackslash = this._csv[nextBackslashIndex + 1];
            if (charAfterBackslash === '"' || charAfterBackslash === '\\') {
                this._value +=
                    this._csv.substr(this._index, nextBackslashIndex - this._index) +
                    charAfterBackslash;
                this._index = nextBackslashIndex + 2;
            } else {
                this._value += this._csv.substr(this._index, nextBackslashIndex - this._index + 1);
                this._index = nextBackslashIndex + 1;
            }
            return this.handleQuotedValue;
        }

        if (this._csv[nextQuoteIndex + 1] === '"') {
            this._value += this._csv.substr(this._index, nextQuoteIndex - this._index + 1);
            this._index = nextQuoteIndex + 2;
            return this.handleQuotedValue;
        }

        this._value += this._csv.substr(this._index, nextQuoteIndex - this._index);
        this._index = nextQuoteIndex + 1;
        this._line.push(this._value);
        this._value = '';

        return this.handleAfterValue;
    }

    private handleAfterValue(): OperationHandler {
        const hasNextValueOnThisLine = this._csv[this._index] === ',';
        this._index++;
        if (!hasNextValueOnThisLine) {
            this._lines.push(this._line);
            this._line = [];
        }
        return this.handleBeforeValue;
    }

    private handleError(): never {
        throw new Error(this.error || 'Unknown error');
    }
}

export { CsvParser };
