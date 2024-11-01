import { isNode, isNodeFilter, PdaNode } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { Fragment, fragmentFromTemplate } from './common';

export function getPdaFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaPath: NodePath<PdaNode>;
    },
): Fragment {
    const { pdaPath, typeManifestVisitor, nameApi } = scope;
    const pdaNode = getLastNodeFromPath(pdaPath);
    const programNode = findProgramNodeFromPath(pdaPath)!;

    // Seeds.
    const imports = new ImportMap();
    const seeds = pdaNode.seeds.map(seed => {
        if (isNode(seed, 'variablePdaSeedNode')) {
            const seedManifest = visit(seed.type, typeManifestVisitor);
            imports.mergeWith(seedManifest.looseType, seedManifest.encoder);
            return { ...seed, typeManifest: seedManifest };
        }
        if (isNode(seed.value, 'programIdValueNode')) {
            imports.add('solanaAddresses', 'getAddressEncoder');
            return seed;
        }
        const seedManifest = visit(seed.type, typeManifestVisitor);
        imports.mergeWith(seedManifest.encoder);
        const valueManifest = visit(seed.value, typeManifestVisitor).value;
        imports.mergeWith(valueManifest.imports);
        return { ...seed, typeManifest: seedManifest, valueManifest };
    });
    const hasVariableSeeds = pdaNode.seeds.filter(isNodeFilter('variablePdaSeedNode')).length > 0;

    return fragmentFromTemplate('pdaFunction.njk', {
        findPdaFunction: nameApi.pdaFindFunction(pdaNode.name),
        hasVariableSeeds,
        pdaSeedsType: nameApi.pdaSeedsType(pdaNode.name),
        programAddress: pdaNode.programId ?? programNode.publicKey,
        seeds,
    })
        .mergeImportsWith(imports)
        .addImports('solanaAddresses', ['type Address', 'getProgramDerivedAddress', 'type ProgramDerivedAddress']);
}
