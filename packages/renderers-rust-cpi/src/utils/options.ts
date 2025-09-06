import { getByteSizeVisitor, LinkableDictionary } from '@codama/visitors-core';

import { TypeManifestVisitor } from '../visitors/getTypeManifestVisitor';
import { GetImportFromFunction, LinkOverrides } from './linkOverrides';
import { GetTraitsFromNodeFunction, TraitOptions } from './traitOptions';

export type RenderOptions = GetRenderMapOptions & {
    crateFolder?: string;
    deleteFolderBeforeRendering?: boolean;
    formatCode?: boolean;
    toolchain?: string;
};

export type GetRenderMapOptions = {
    anchorTraits?: boolean;
    defaultTraitOverrides?: string[];
    dependencyMap?: Record<string, string>;
    linkOverrides?: LinkOverrides;
    renderParentInstructions?: boolean;
    traitOptions?: TraitOptions;
};

export type RenderScope = {
    byteSizeVisitor: ReturnType<typeof getByteSizeVisitor>;
    dependencyMap: Record<string, string>;
    getImportFrom: GetImportFromFunction;
    getTraitsFromNode: GetTraitsFromNodeFunction;
    linkables: LinkableDictionary;
    renderParentInstructions: boolean;
    typeManifestVisitor: TypeManifestVisitor;
};
