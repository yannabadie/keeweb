import dompurify from 'dompurify';
import marked from 'marked';

const whiteSpaceRegex = /<\/?p>|<br>|\r|\n/g;

class MdRenderer extends marked.Renderer {
    link(href: string | null, title: string | null, text: string): string {
        return super
            .link(href, title, text)
            .replace('<a ', '<a target="_blank" rel="noreferrer noopener" ');
    }
}

export const MdToHtml = {
    convert(md: string): { text?: string; html?: string } {
        if (!md) {
            return { text: '' };
        }
        const renderer = new MdRenderer();
        const html = marked(md, { renderer, breaks: true });
        const htmlWithoutLineBreaks = html.replace(whiteSpaceRegex, '');
        const mdWithoutLineBreaks = md.replace(whiteSpaceRegex, '');
        if (htmlWithoutLineBreaks === mdWithoutLineBreaks) {
            return { text: md };
        }
        const sanitized = dompurify.sanitize(html, { ADD_ATTR: ['target'] });
        return { html: `<div class="markdown">${sanitized}</div>` };
    }
};
