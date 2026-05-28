import { generateTypesFromFile as generateTypesFromFileShared } from '@codama/dynamic-address-resolution/codegen';

import { generateTypes } from '../../../codegen/generate-types';

export function generateTypesFromFile(codamaIdlPath: string, outputDirPath: string): void {
    generateTypesFromFileShared({
        codamaIdlPath,
        generate: generateTypes,
        outputDirPath,
        outputFileSuffix: 'instruction-types',
    });
}
