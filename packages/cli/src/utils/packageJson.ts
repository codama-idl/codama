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
            throw new Error(`Cannot read ${packageJsonPath}`);
        }
        packageJson = await readJson<PackageJson>(packageJsonPath);
    }
    return packageJson;
}
