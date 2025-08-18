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
export async function getPackageJson(): Promise<PackageJson> {
    if (!packageJson) {
        const packageJsonPath = resolveRelativePath('package.json');
        if (!(await canRead(packageJsonPath))) {
            throw new CliError('Cannot read package.json.', [`${pico.bold('Path')}: ${packageJsonPath}`]);
        }
        packageJson = await readJson<PackageJson>(packageJsonPath);
    }
    return packageJson;
}

export async function getPackageJsonDependencies(options: { includeDev?: boolean } = {}): Promise<string[]> {
    const packageJson = await getPackageJson();
    return [
        ...(packageJson.dependencies ? Object.keys(packageJson.dependencies) : []),
        ...(options.includeDev && packageJson.devDependencies ? Object.keys(packageJson.devDependencies) : []),
    ];
}
