import { Events } from 'util/events';
import { Launcher } from 'comp/launcher';
import { AppSettingsModel } from 'models/app-settings-model';

interface CopyPasteResult {
    success: boolean;
    seconds?: number;
}

const CopyPaste = {
    copy(text: string): CopyPasteResult {
        if (Launcher) {
            Launcher.setClipboardText(text);
            const clipboardSeconds = AppSettingsModel.clipboardSeconds;
            if (clipboardSeconds > 0) {
                const clearClipboard = () => {
                    if (Launcher?.getClipboardText() === text) {
                        Launcher.clearClipboardText();
                    }
                };
                Events.on('main-window-will-close', clearClipboard);
                setTimeout(() => {
                    clearClipboard();
                    Events.off('main-window-will-close', clearClipboard);
                }, clipboardSeconds * 1000);
            }
            return { success: true, seconds: clipboardSeconds };
        } else {
            try {
                if (document.execCommand('copy')) {
                    return { success: true };
                }
            } catch (e) {}
            return { success: false };
        }
    },

    createHiddenInput(text: string): void {
        const hiddenInput = document.createElement('input');
        hiddenInput.value = text;
        hiddenInput.classList.add('hide-by-pos');
        document.body.appendChild(hiddenInput);
        hiddenInput.selectionStart = 0;
        hiddenInput.selectionEnd = text.length;
        hiddenInput.focus();

        const onChange = () => {
            setTimeout(() => hiddenInput.blur(), 0);
        };
        hiddenInput.addEventListener('cut', onChange);
        hiddenInput.addEventListener('copy', onChange);
        hiddenInput.addEventListener('paste', onChange);
        hiddenInput.addEventListener('blur', () => hiddenInput.remove());
    },

    copyHtml(html: string): boolean {
        const el = document.createElement('div');
        el.style.userSelect = 'auto';
        el.innerHTML = html;
        document.body.appendChild(el);

        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (!sel) {
            el.remove();
            return false;
        }
        sel.removeAllRanges();
        sel.addRange(range);

        const result = document.execCommand('copy');

        el.remove();
        return result;
    }
};

export { CopyPaste };
