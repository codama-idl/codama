import pico from 'picocolors';

type LogLevel = 'debug' | 'error' | 'info' | 'success' | 'warning';

type LogOptions = {
    level: LogLevel;
    message: string;
    items?: string[];
};

function getLogLevelInfo(logLevel: LogLevel) {
    const identity = (text: string) => text;
    const infos: Record<LogLevel, [string, (text: string) => string, (text: string) => string]> = {
        success: ['✔', pico.green, pico.green],
        info: ['→', pico.blueBright, identity],
        warning: ['▲', pico.yellow, pico.yellow],
        error: ['✖', pico.red, pico.red],
        debug: ['✱', pico.magenta, pico.magenta],
    };

    return {
        icon: infos[logLevel][0],
        color: infos[logLevel][1],
        messageColor: infos[logLevel][2],
    };
}

const logWrapper = (level: LogLevel) => (message: string, items?: string[]) => log({ level, message, items });
export const logSuccess = logWrapper('success');
export const logError = logWrapper('error');
export const logInfo = logWrapper('info');
export const logWarning = logWrapper('warning');
export const logDebug = logWrapper('debug');

function log({ level, message, items }: LogOptions): void {
    const { icon, color, messageColor } = getLogLevelInfo(level);
    console.log(color(icon), messageColor(message));
    if (items) {
        logItems(items, color);
    }
}

function logItems(items: string[], color?: (text: string) => string): void {
    const colorFn = color ?? (text => text);
    items.forEach((item, index) => {
        const prefix = index === items.length - 1 ? '└─' : '├─';
        console.log('  ' + colorFn(prefix), item);
    });
}

export function logBanner(): void {
    console.log(getBanner());
}

function getBanner(): string {
    const textBanner = 'Welcome to Codama!';
    const gradientBanner = pico.bold(`\x1b[38;2;231;171;97m${textBanner}\x1b[0m`);
    return process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? gradientBanner : textBanner;
}
