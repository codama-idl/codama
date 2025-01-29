import chalk from 'chalk';

export function logSuccess(...args: unknown[]): void {
    console.log(chalk.green('[Success]'), ...args);
}

export function logInfo(...args: unknown[]): void {
    console.log(chalk.blueBright('[Info]'), ...args);
}

export function logWarning(...args: unknown[]): void {
    console.log(chalk.yellow('[Warning]'), ...args);
}

export function logError(...args: unknown[]): void {
    console.log(chalk.red('[Error]'), ...args);
}

export function logBanner(): void {
    console.log(getBanner());
}

function getBanner(): string {
    const textBanner = 'Welcome to Codama!';
    const gradientBanner = chalk.bold(chalk.hex('#e7ab61')(textBanner));
    return process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? gradientBanner : textBanner;
}
