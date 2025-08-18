import pico from 'picocolors';

export function logSuccess(message: string, items?: string[]): void {
    console.log(pico.green('✔'), message);
    if (items) {
        logItems(items, pico.green);
    }
}

export function logInfo(message: string, items?: string[]): void {
    console.log(pico.blueBright('→'), message);
    if (items) {
        logItems(items, pico.blueBright);
    }
}

export function logWarning(message: string, items?: string[]): void {
    console.log(pico.yellow('▲'), message);
    if (items) {
        logItems(items, pico.yellow);
    }
}

export function logError(message: string, items?: string[]): void {
    console.log(pico.red('✖'), message);
    if (items) {
        logItems(items, pico.red);
    }
}

export function logDebug(message: string, items?: string[]): void {
    console.log(pico.magenta('✱'), message);
    if (items) {
        logItems(items, pico.magenta);
    }
}

export function logItems(items: string[], color?: (text: string) => string): void {
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
