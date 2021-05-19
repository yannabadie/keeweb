import { AppSettingsModel } from 'models/app-settings-model';
import { UrlFormat } from 'util/formatting/url-format';
import { DropboxChooserAppKey } from 'const/cloud-storage-apps';

interface DropboxChooserResult {
    name: string;
    data: ArrayBuffer;
}

type DropboxChooserCallback = (err?: string, res?: DropboxChooserResult) => void;

interface DropboxChooserMessageFile {
    'is_dir'?: boolean;
    link?: string;
    name?: string;
}

interface DropboxChooserMessage {
    method?: string;
    params?: DropboxChooserMessageFile[];
}

export class DropboxChooser {
    private _callback?: DropboxChooserCallback;
    private _popup?: Window | null;
    private _closeInterval?: number;
    private _resultReceived = false;

    constructor(callback: DropboxChooserCallback) {
        this._callback = callback;
        this.onMessage = this.onMessage.bind(this);
    }

    private callback(err?: string, res?: DropboxChooserResult): void {
        if (this._callback) {
            this._callback(err, res);
            this._callback = undefined;
        }
    }

    choose(): void {
        const windowFeatures = 'width=640,height=552,left=357,top=100,resizable=yes,location=yes';
        const url = this.buildUrl();
        this._popup = window.open(url, 'dropbox', windowFeatures);
        if (!this._popup) {
            return this.callback('Failed to open a pop-up window');
        }
        // eslint-disable-next-line @typescript-eslint/unbound-method
        window.addEventListener('message', this.onMessage);
        this._closeInterval = window.setInterval(() => this.checkClose(), 200);
    }

    private buildUrl(): string {
        return UrlFormat.makeUrl('https://www.dropbox.com/chooser', {
            origin: window.location.protocol + '//' + window.location.host,
            'app_key': AppSettingsModel.dropboxAppKey || DropboxChooserAppKey,
            'link_type': 'direct',
            trigger: 'js',
            multiselect: 'false',
            extensions: '',
            folderselect: 'false',
            iframe: 'false',
            version: '2'
        });
    }

    private onMessage(e: MessageEvent): void {
        if (!e.source || e.source !== this._popup || e.origin !== 'https://www.dropbox.com') {
            return;
        }
        const data = JSON.parse(e.data) as DropboxChooserMessage;
        switch (data.method) {
            case 'origin_request':
                e.source.postMessage(
                    JSON.stringify({ method: 'origin' }),
                    'https://www.dropbox.com'
                );
                break;
            case 'files_selected':
                this._popup.close();
                if (data.params?.[0]) {
                    this.success(data.params[0]);
                } else {
                    this.callback('empty message.params');
                }
                break;
            case 'close_dialog':
                this._popup.close();
                break;
            case 'web_session_error':
            case 'web_session_unlinked':
                this.callback(data.method);
                break;
            // case 'resize':
            //     this._popup?.resize(data.params);
            //     break;
            case 'error':
                this.callback('Dropbox chooser returned an error');
                break;
        }
    }

    private checkClose() {
        if (this._popup?.closed) {
            clearInterval(this._closeInterval);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            window.removeEventListener('message', this.onMessage);
            if (!this._resultReceived) {
                this.callback('closed');
            }
        }
    }

    private success(file: DropboxChooserMessageFile) {
        if (!file.link || file.is_dir) {
            return this.callback('bad result');
        }
        this._resultReceived = true;
        this.readFile(file.link, file.name || 'unknown');
    }

    readFile(url: string, name: string): void {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            this.callback(undefined, { name, data: xhr.response as ArrayBuffer });
        });
        xhr.addEventListener('error', () => this.callback('download error'));
        xhr.addEventListener('abort', () => this.callback('download aborted'));
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }
}
