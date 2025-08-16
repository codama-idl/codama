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

export async function installMissingDependencies(message: string, requiredDependencies: string[]): Promise<void> {
    if (requiredDependencies.length === 0) return;

    const installedDependencies = await getPackageJsonDependencies({ includeDev: true });
    const missingDependencies = requiredDependencies.filter(dep => !installedDependencies.includes(dep));
    if (missingDependencies.length === 0) return;

    await installDependencies(message, missingDependencies);
}

export async function installDependencies(message: string, dependencies: string[]): Promise<void> {
    if (dependencies.length === 0) return;
    const installCommand = await getPackageManagerInstallCommand(dependencies);

    logWarning(message);
    logWarning(`Install command: ${pico.yellow(formatChildCommand(installCommand))}`);

    const dependencyResult: { installDependencies: boolean } = await prompts(
        { initial: true, message: 'Install dependencies?', name: 'installDependencies', type: 'confirm' },
        PROMPT_OPTIONS,
    );
    if (!dependencyResult.installDependencies) {
        logWarning('Skipping installation. You can install manually later with:');
        logWarning(pico.yellow(formatChildCommand(installCommand)));
        return;
    }

    try {
        logInfo(`Installing`, dependencies);
        await spawnChildCommand(installCommand, { quiet: true });
        logSuccess(`Dependencies installed successfully.`);
    } catch {
        logError(`Failed to install dependencies. Please try manually:`);
        logError(pico.yellow(formatChildCommand(installCommand)));
    }
}
