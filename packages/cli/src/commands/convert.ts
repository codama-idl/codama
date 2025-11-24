import { Command } from 'commander';

import { getRootNodeFromIdl, readJson, writeFile } from '../utils';

export function setConvertCommand(program: Command): void {
    program
        .command('convert')
        .argument('<idlPath>', 'Path to the input IDL file (e.g., Anchor or supported standard)')
        .argument('<outPath>', 'Path for the output Codama IDL file')
        .description('Convert a supported IDL file to Codama IDL format')
        .action(doConvert);
}

async function doConvert(idlPath: string, outPath: string) {
    const idl = await readJson(idlPath);

    const node = await getRootNodeFromIdl(idl);

    await writeFile(outPath, JSON.stringify(node, null, 2));

    console.log(`Converted IDL written to ${outPath}`);
}
