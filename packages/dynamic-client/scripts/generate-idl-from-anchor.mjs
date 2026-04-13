import { readFileSync } from 'node:fs';
import path from 'node:path';

import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { writeFile } from '@codama/renderers-core';
import { createFromRoot } from 'codama';

// This script generates Codama IDL from Anchor programs for tests.
const packageRoot = process.cwd();
const programs = ['example', 'blog'];

for (const program of programs) {
    const idlPath = path.join(packageRoot, 'test', 'programs', 'anchor', 'target', 'idl', `${program}.json`);
    console.log(`Start generation from IDL: ${idlPath}`);
    const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));

    console.log('Creating codama client..');
    const codama = createFromRoot(rootNodeFromAnchor(idl));

    const pathToIdl = path.join(packageRoot, 'test', 'programs', 'idls', `${program}-idl.json`);
    console.log(`Writing Codama IDL to: ${pathToIdl}`);

    const codamaJson = JSON.parse(codama.getJson());
    const json = JSON.stringify(codamaJson, null, 4) + '\n';

    writeFile(pathToIdl, json);
    console.log(`Done: ${program}`);
}
