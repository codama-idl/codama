import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createFromJson, type RootNode } from 'codama';

export type GenerateTypesFromFileOptions = {
    codamaIdlPath: string;
    generate: (idl: RootNode) => string;
    outputDirPath: string;
    /**
     * Filename suffix appended after IDL filename.
     * @example 'instruction-types'
     */
    outputFileSuffix: string;
};

/**
 * Shared CLI helper:
 * - Reads a Codama IDL JSON.
 * - Runs a generator function.
 * - Writes the result to `<output-dir>/<idl-filename>-<outputFileSuffix>.ts`
 */
export function generateTypesFromFile(opts: GenerateTypesFromFileOptions): void {
    const { codamaIdlPath, outputDirPath, generate, outputFileSuffix } = opts;

    const idlPath = path.resolve(codamaIdlPath);
    const outputDir = path.resolve(outputDirPath);

    if (!existsSync(idlPath)) {
        throw new Error(`IDL file not found: ${idlPath}`);
    }

    console.log(`Reading IDL from: ${idlPath}`);

    let idlJson: string;
    try {
        idlJson = readFileSync(idlPath, 'utf-8');
    } catch (err) {
        throw new Error(`Cannot read IDL file: ${idlPath}`, { cause: err });
    }

    let idl: RootNode;
    try {
        idl = createFromJson(idlJson).getRoot();
    } catch (err) {
        throw new Error(`${idlPath} is not valid Codama JSON`, {
            cause: err,
        });
    }

    let types: string;
    try {
        console.log(`Generating types for program: ${idl.program.name}`);
        types = generate(idl);
    } catch (err) {
        throw new Error(`Cannot generate types for IDL: ${idlPath}`, {
            cause: err,
        });
    }

    try {
        mkdirSync(outputDir, { recursive: true });
        const fileName = path.basename(idlPath);
        const outputFile = fileName.replace(/\.json$/, `-${outputFileSuffix}.ts`);
        const outputPath = path.join(outputDir, outputFile);

        console.log(`Writing types to: ${outputPath}`);
        writeFileSync(outputPath, types, 'utf-8');
        console.log('Done!');
    } catch (err) {
        throw new Error(`Cannot write generated types`, { cause: err });
    }
}
