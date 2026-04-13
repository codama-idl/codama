import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createFromJson, type RootNode } from 'codama';

import { generateClientTypes } from './generate-client-types';

export function generateClientTypesFromFile(codamaIdlPath: string, outputDirPath: string) {
    const idlPath = path.resolve(codamaIdlPath);
    const outputDir = path.resolve(outputDirPath);

    if (!existsSync(idlPath)) {
        console.error(`Error: IDL file not found: ${idlPath}`);
        process.exit(1);
    }

    console.log(`Reading IDL from: ${idlPath}`);

    let idlJson: string;
    try {
        idlJson = readFileSync(idlPath, 'utf-8');
    } catch (err) {
        console.error(`Error reading IDL file: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }

    let idl: RootNode;
    try {
        idl = createFromJson(idlJson).getRoot();
    } catch (err) {
        console.error(
            `Error: ${idlPath} is not valid Codama JSON: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
    }

    let types: string = '';
    try {
        console.log(`Generating types for program: ${idl.program.name}`);
        types = generateClientTypes(idl);
    } catch (err) {
        console.error(`Error generating client types: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }

    try {
        mkdirSync(outputDir, { recursive: true });
        const fileName = path.basename(idlPath);
        const outputFile = fileName.replace(/\.json$/, '-types.ts');
        const outputPath = path.join(outputDir, outputFile);

        console.log(`Writing types to: ${outputPath}`);
        writeFileSync(outputPath, types, 'utf-8');
        console.log('Done!');
    } catch (err) {
        console.error(`Error writing generated types: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }
}
