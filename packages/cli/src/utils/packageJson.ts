import pico from 'picocolors';

import { CliError } from './errors';
import { canRead, readJson, resolveRelativePath } from './fs';

type PackageJson = {
    name: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    packageManager?: string;
    [key: string]: unknown;
};

let packageJson: PackageJson | undefined;
let packageJsonChecked = false;

/**
 * Reads the local `package.json` if one exists. Returns `undefined` when none is found so callers
 * can degrade gracefully (e.g. when running outside a Node project or via `npx`).
 */
export async function tryGetPackageJson(): Promise<PackageJson | undefined> {
    if (!packageJsonChecked) {
        const packageJsonPath = resolveRelativePath('package.json');
        if (await canRead(packageJsonPath)) {
            packageJson = await readJson<PackageJson>(packageJsonPath);
        }
        packageJsonChecked = true;
    }
    return packageJson;
}

/** Reads the local `package.json`, throwing when none exists. */
export async function getPackageJson(): Promise<PackageJson> {
    const json = await tryGetPackageJson();
    if (!json) {
        const packageJsonPath = resolveRelativePath('package.json');
        throw new CliError('Cannot read package.json.', [`${pico.bold('Path')}: ${packageJsonPath}`]);
    }
    return json;
}

export async function getPackageJsonDependencies(options: { includeDev?: boolean } = {}): Promise<string[]> {
    const packageJson = await tryGetPackageJson();
    if (!packageJson) return [];
    return [
        ...(packageJson.dependencies ? Object.keys(packageJson.dependencies) : []),
        ...(options.includeDev && packageJson.devDependencies ? Object.keys(packageJson.devDependencies) : []),
    ];
}
