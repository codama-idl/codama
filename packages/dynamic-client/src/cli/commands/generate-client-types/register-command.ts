import type { Command } from 'commander';

import { generateClientTypesFromFile } from './generate-client-types-from-file';

export function registerGenerateClientTypesCommand(program: Command): void {
    program
        .command('generate-client-types')
        .description('Generate TypeScript types from a Codama IDL JSON file')
        .argument('<codama-idl>', 'Path to a Codama IDL JSON file (e.g., ./idl/codama.json)')
        .argument('<output-dir>', 'Path to the output directory for the generated .ts file, e.g., ./generated')
        .action((idlArg: string, outputDirArg: string) => {
            generateClientTypesFromFile(idlArg, outputDirArg);
        });
}
