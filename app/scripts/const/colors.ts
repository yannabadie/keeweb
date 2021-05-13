export const Colors = {
    AllColors: ['yellow', 'green', 'red', 'orange', 'blue', 'violet'] as const,

    ColorsValues: {
        yellow: 'ffff00',
        green: '00ff00',
        red: 'ff0000',
        orange: 'ff8800',
        blue: '0000ff',
        violet: 'ff00ff'
    } as { [name: string]: string },

    BgColors: {
        yellow: 'ffff88',
        green: '88ff88',
        red: 'ff8888',
        orange: 'ffcc88',
        blue: '8888ff',
        violet: 'ff88ff'
    } as { [name: string]: string }
} as const;
