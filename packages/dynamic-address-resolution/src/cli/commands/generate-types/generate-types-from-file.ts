import { generateTypes } from '../../../codegen/generate-types';
import { generateTypesFromFile as generateTypesFromFileShared } from '../../../codegen/generate-types-from-file';

export function generateTypesFromFile(codamaIdlPath: string, outputDirPath: string): void {
    generateTypesFromFileShared({
        codamaIdlPath,
        generate: generateTypes,
        outputDirPath,
        outputFileSuffix: 'address-resolution-types',
    });
}
