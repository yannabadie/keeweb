import { Features } from 'util/features';

const FeatureTester = {
    async test(): Promise<void> {
        return Promise.resolve()
            .then(() => this.checkWebAssembly())
            .then(() => this.checkLocalStorage())
            .then(() => this.checkWebCrypto());
    },

    checkWebAssembly(): void {
        try {
            const module = new global.WebAssembly.Module(
                Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
            );
            const instance = new global.WebAssembly.Instance(module);
            if (!(instance instanceof global.WebAssembly.Instance)) {
                throw new Error();
            }
        } catch (e) {
            throw new Error('WebAssembly is not supported');
        }
    },

    checkLocalStorage(): void {
        if (Features.isDesktop) {
            return;
        }
        try {
            localStorage.setItem('_test', '1');
            localStorage.removeItem('_test');
        } catch (e) {
            throw new Error('LocalStorage is not supported');
        }
    },

    checkWebCrypto(): void {
        if (!global.crypto.subtle) {
            throw new Error('WebCrypto is not supported');
        }
    }
};

export { FeatureTester };
