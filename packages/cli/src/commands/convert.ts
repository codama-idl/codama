import type { RootNode } from '@codama/nodes';
import { Command } from 'commander';

import {
    CliError,
    getRootNodeFromIdl,
    importModuleItem,
    installMissingDependencies,
    readJson,
    writeFile,
} from '../utils';

export function setConvertCommand(program: Command): void {
    program
        .command('convert')
        .argument('<idlPath>', 'Path to the Anchor IDL file')
        .argument('<outPath>', 'Path for output Codama IDL file')
        .description('Convert an Anchor IDL to Codama IDL format')
        .action(doConvert);
}

async function doConvert(idlPath: string, outPath: string) {
    const hasCreateFromRoot = await installMissingDependencies(
        'Additional dependencies are required to convert Anchor IDLs.',
        ['codama'],
    );

    if (!hasCreateFromRoot) {
        throw new CliError('Cannot proceed without the codama package.');
    }

    const createFromRoot = await importModuleItem<(rootNode: RootNode) => { getJson(): string }>({
        from: 'codama',
        item: 'createFromRoot',
    });

    const idl = await readJson(idlPath);

    const node = await getRootNodeFromIdl(idl);
    const codama = createFromRoot(node);

    await writeFile(outPath, codama.getJson());

    console.log(`Converted IDL written to ${outPath}`);
}
