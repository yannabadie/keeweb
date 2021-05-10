import * as kdbxweb from 'kdbxweb';
import 'util/kdbxweb/protected-value';
import { shuffle } from 'util/fn';

class RandomNameGenerator {
    randomCharCode() {
        return 97 + Math.floor(Math.random() * 26);
    }
}

function charCodeToHtml(char: number): string {
    return Math.random() < 0.2 ? String.fromCharCode(char) : `&#x${char.toString(16)};`;
}

export const PasswordPresenter = {
    present(length: number): string {
        return new Array(length + 1).join('•');
    },

    presentValueWithLineBreaks(value: kdbxweb.ProtectedValue | undefined): string {
        if (!value) {
            return '';
        }
        let result = '';
        value.forEachChar((ch) => {
            result += ch === 10 ? '\n' : '•';
        });
        return result;
    },

    asDOM(value: kdbxweb.ProtectedValue): HTMLElement {
        const items: { html: string; order: number }[] = [];

        const gen = new RandomNameGenerator();

        let ix = 0;
        value.forEachChar((char) => {
            const charHtml = charCodeToHtml(char);
            items.push({ html: charHtml, order: ix });

            if (Math.random() > 0.5) {
                const fakeChar = gen.randomCharCode();
                const fakeCharHtml = charCodeToHtml(fakeChar);
                items.push({ html: fakeCharHtml, order: -1 });
            }
            ix++;
        });

        shuffle(items);

        const topEl = document.createElement('div');
        topEl.style.display = 'flex';
        topEl.style.overflow = 'hidden';
        topEl.style.textOverflow = 'ellipsis';

        for (const item of items) {
            const el = document.createElement('div');
            el.innerHTML = item.html;
            if (item.order >= 0) {
                el.style.order = item.order.toString();
            } else {
                el.style.display = 'none';
            }
            topEl.appendChild(el);
        }

        return topEl;
    }
};
