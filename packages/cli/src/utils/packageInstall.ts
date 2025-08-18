import pico from 'picocolors';
import prompts from 'prompts';

import { ChildCommand, createChildCommand, formatChildCommand, spawnChildCommand } from './childCommands';
import { logError, logInfo, logSuccess, logWarning } from './logs';
import { getPackageJsonDependencies } from './packageJson';
import { getPackageManager } from './packageManager';
import { PROMPT_OPTIONS } from './prompts';

export async function getPackageManagerInstallCommand(
    packages: string[],
    options: string[] = [],
): Promise<ChildCommand> {
    const packageManager = await getPackageManager();
    const args = [packageManager === 'yarn' ? 'add' : 'install', ...packages, ...options];
    return createChildCommand(packageManager, args);
}

export async function installMissingDependencies(message: string, requiredDependencies: string[]): Promise<boolean> {
    if (requiredDependencies.length === 0) return true;

    const installedDependencies = await getPackageJsonDependencies({ includeDev: true });
    const missingDependencies = requiredDependencies.filter(dep => !installedDependencies.includes(dep));
    if (missingDependencies.length === 0) return true;

    return await installDependencies(message, missingDependencies);
}

export async function installDependencies(message: string, dependencies: string[]): Promise<boolean> {
    if (dependencies.length === 0) return true;
    const installCommand = await getPackageManagerInstallCommand(dependencies);
    const formattedInstallCommand = pico.yellow(formatChildCommand(installCommand));

    if (process.env.CI) {
        logWarning(message);
        logWarning(`Skipping installation in CI environment. Please install manually:`);
        logWarning(formattedInstallCommand);
        return false;
    }

    logWarning(message);
    logWarning(`Install command: ${formattedInstallCommand}`);

    const dependencyResult: { installDependencies: boolean } = await prompts(
        { initial: true, message: 'Install dependencies?', name: 'installDependencies', type: 'confirm' },
        PROMPT_OPTIONS,
    );
    if (!dependencyResult.installDependencies) {
        logWarning('Skipping installation.');
        return false;
    }

    try {
        logInfo(`Installing`, dependencies);
        await spawnChildCommand(installCommand, { quiet: true });
        logSuccess(`Dependencies installed successfully.`);
        return true;
    } catch {
        logError(`Failed to install dependencies. Please try manually:`);
        logError(formattedInstallCommand);
        return false;
    }
}
