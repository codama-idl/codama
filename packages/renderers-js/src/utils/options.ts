import type { CamelCaseString } from '@codama/nodes';
import type { LinkableDictionary } from '@codama/visitors-core';
import type { format } from 'prettier/standalone';

import type { TypeManifestVisitor } from '../visitors';
import type { CustomDataOptions, ParsedCustomDataOptions } from './customData';
import type { GetImportFromFunction, LinkOverrides } from './linkOverrides';
import type { NameApi, NameTransformers } from './nameTransformers';

type PrettierOptions = Parameters<typeof format>[1];

export type RenderOptions = GetRenderMapOptions & {
    deleteFolderBeforeRendering?: boolean;
    formatCode?: boolean;
    prettierOptions?: PrettierOptions;
};

export type GetRenderMapOptions = {
    asyncResolvers?: string[];
    customAccountData?: CustomDataOptions[];
    customInstructionData?: CustomDataOptions[];
    dependencyMap?: Record<string, string>;
    internalNodes?: string[];
    linkOverrides?: LinkOverrides;
    nameTransformers?: Partial<NameTransformers>;
    nonScalarEnums?: string[];
    renderParentInstructions?: boolean;
    useGranularImports?: boolean;
};

export type RenderScope = {
    asyncResolvers: CamelCaseString[];
    customAccountData: ParsedCustomDataOptions;
    customInstructionData: ParsedCustomDataOptions;
    dependencyMap: Record<string, string>;
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    nameApi: NameApi;
    nonScalarEnums: CamelCaseString[];
    renderParentInstructions: boolean;
    typeManifestVisitor: TypeManifestVisitor;
    useGranularImports: boolean;
};
