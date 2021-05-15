// ipcRenderer.on('event', ...args)
// mainWindow.webContents.send('event', ...args)
export interface DesktopIpcRendererEvents {
    'log': (...args: unknown[]) => void;
}

// ipcRenderer.send('event', ...args)
// ipcMain.on('event', ...args)
export interface DesktopIpcMainEvents {
    'native-module-call': () => void;
}

// ipcRenderer.invoke('event', ...args)
// ipcMain.handle('event', ...args)
export interface DesktopIpcMainCalls {
    'set-locale': (locale: string, values: Record<string, string>) => void;
}
