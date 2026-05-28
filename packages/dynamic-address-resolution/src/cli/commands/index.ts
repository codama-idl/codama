import type { Command } from 'commander';

import { registerGenerateTypesCommand } from './generate-types/register-command';

export function registerCommands(program: Command): void {
    registerGenerateTypesCommand(program);
}
