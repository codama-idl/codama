import { spawnSync } from 'child_process';

import { canRead, resolveRelativePath } from './fs';
import { getPackageJson } from './packageJson';

type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn';

const FALLBACK_PACKAGE_MANAGER: PackageManager = 'npm';

let packageManager: PackageManager | undefined;
export async function getPackageManager(): Promise<PackageManager> {
    if (!packageManager) {
        packageManager = await detectPackageManager();
    }
    return packageManager;
}

async function detectPackageManager(): Promise<PackageManager> {
    const fromPackageJson = await detectPackageManagerFromPackageJson();
    if (fromPackageJson) return fromPackageJson;

    const fromLockfile = await detectPackageManagerFromLockfile();
    if (fromLockfile) return fromLockfile;

    const fromInstalledCli = detectPackageManagerFromInstalledCli();
    if (fromInstalledCli) return fromInstalledCli;

    return FALLBACK_PACKAGE_MANAGER;
}

async function detectPackageManagerFromPackageJson(): Promise<PackageManager | undefined> {
    const packageJson = await getPackageJson();
    if (!packageJson.packageManager) return undefined;
    if (packageJson.packageManager.startsWith('npm@')) return 'npm';
    if (packageJson.packageManager.startsWith('pnpm@')) return 'pnpm';
    if (packageJson.packageManager.startsWith('yarn@')) return 'yarn';
    if (packageJson.packageManager.startsWith('bun@')) return 'bun';
    return undefined;
}

async function detectPackageManagerFromLockfile(): Promise<PackageManager | undefined> {
    const [isYarn, isPnpm, isBun, isNpm] = await Promise.all([
        canRead(resolveRelativePath('yarn.lock')),
        canRead(resolveRelativePath('pnpm-lock.yaml')),
        canRead(resolveRelativePath('bun.lockb')),
        canRead(resolveRelativePath('package-lock.json')),
    ]);

    if (isYarn) return 'yarn';
    if (isPnpm) return 'pnpm';
    if (isBun) return 'bun';
    if (isNpm) return 'npm';
    return undefined;
}

function detectPackageManagerFromInstalledCli(): PackageManager | undefined {
    if (hasPackageManagerCli('yarn')) return 'yarn';
    if (hasPackageManagerCli('pnpm')) return 'pnpm';
    if (hasPackageManagerCli('bun')) return 'bun';
    return undefined;
}

export function hasPackageManagerCli(packageManager: PackageManager): boolean {
    const consoleOutput = spawnSync(packageManager, ['--version'], { stdio: 'pipe' });
    return consoleOutput.status === 0;
}
