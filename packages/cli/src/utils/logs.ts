import pico from 'picocolors';

export function logSuccess(...args: unknown[]): void {
    console.log(pico.green('✔'), ...args);
}

export function logInfo(...args: unknown[]): void {
    console.log(pico.blueBright('→'), ...args);
}

export function logWarning(...args: unknown[]): void {
    console.log(pico.yellow('▲'), ...args);
}

export function logError(...args: unknown[]): void {
    console.log(pico.red('✖'), ...args);
}

export function logDebug(...args: unknown[]): void {
    console.log(pico.magenta('✱'), ...args);
}

export function logBanner(): void {
    console.log(getBanner());
}

function getBanner(): string {
    const textBanner = 'Welcome to Codama!';
    const gradientBanner = pico.bold(`\x1b[38;2;231;171;97m${textBanner}\x1b[0m`);
    return process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? gradientBanner : textBanner;
}
