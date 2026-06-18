import { generateTypesFromFile } from '@codama/dynamic-address-resolution/codegen';

import { generateClientTypes } from './generate-client-types';

export function generateClientTypesFromFile(codamaIdlPath: string, outputDirPath: string): void {
    generateTypesFromFile({
        codamaIdlPath,
        generate: generateClientTypes,
        outputDirPath,
        outputFileSuffix: 'types',
    });
}
