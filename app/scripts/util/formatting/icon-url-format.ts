import * as kdbxweb from 'kdbxweb';

export const IconUrlFormat = {
    toDataUrl(iconData: ArrayBuffer): string | null {
        return iconData
            ? 'data:image/png;base64,' + kdbxweb.ByteUtils.bytesToBase64(iconData)
            : null;
    }
};
