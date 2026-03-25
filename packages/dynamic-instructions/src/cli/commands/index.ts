import type { Command } from 'commander';

import { registerGenerateClientTypesCommand } from './generate-client-types/register-command';

export function registerCommands(program: Command): void {
    registerGenerateClientTypesCommand(program);
}
