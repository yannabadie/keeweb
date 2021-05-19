import { Events } from 'util/events';
import { Launcher } from 'comp/launcher';

const LocalStorageKeyName = 'instanceCheck';
const LocalStorageResponseKeyName = 'instanceMaster';

const instanceKey = Date.now().toString();

const SingleInstanceChecker = {
    init(): void {
        if (Launcher) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/unbound-method
        window.addEventListener('storage', SingleInstanceChecker.storageChanged);
        SingleInstanceChecker.setKey(LocalStorageKeyName, instanceKey);
    },

    storageChanged(e: StorageEvent): void {
        if (!e.newValue) {
            return;
        }
        if (e.key === LocalStorageKeyName && e.newValue !== instanceKey) {
            SingleInstanceChecker.setKey(
                LocalStorageResponseKeyName,
                instanceKey + Math.random().toString()
            );
        } else if (e.key === LocalStorageResponseKeyName && e.newValue.indexOf(instanceKey) < 0) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            window.removeEventListener('storage', SingleInstanceChecker.storageChanged);
            Events.emit('second-instance');
        }
    },

    setKey(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
            setTimeout(() => {
                localStorage.removeItem(key);
            }, 100);
        } catch (e) {}
    }
};

export { SingleInstanceChecker };
