import { isNode, isNodeFilter, PdaNode, ProgramNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { Fragment, fragmentFromTemplate } from './common';

export function getPdaFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaNode: PdaNode;
        programNode: ProgramNode;
    },
): Fragment {
    const { pdaNode, programNode, typeManifestVisitor, nameApi } = scope;

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
        program: programNode,
        seeds,
    })
        .mergeImportsWith(imports)
        .addImports('solanaAddresses', ['Address', 'getProgramDerivedAddress', 'ProgramDerivedAddress']);
}
