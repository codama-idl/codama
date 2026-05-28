import type { Command } from 'commander';

import { generateTypesFromFile } from './generate-types-from-file';

export function registerGenerateTypesCommand(program: Command): void {
    program
        .command('generate-types')
        .description(
            'Generate TypeScript address-resolution types (PDA seeds, instruction Args/Accounts/Resolvers) from a Codama IDL JSON file',
        )
        .argument('<codama-idl>', 'Path to a Codama IDL JSON file (e.g., ./idl/codama.json)')
        .argument('<output-dir>', 'Path to the output directory for the generated .ts file, e.g., ./generated')
        .action((idlArg: string, outputDirArg: string) => {
            try {
                generateTypesFromFile(idlArg, outputDirArg);
            } catch (err) {
                console.error(err);
                process.exit(1);
            }
        });
}
