import { isNode, isNodeFilter, PdaNode } from '@codama/nodes';
import { NodeStack, visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { Fragment, fragmentFromTemplate } from './common';

export function getPdaFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        pdaNode: PdaNode;
        pdaStack: NodeStack;
    },
): Fragment {
    const { pdaNode, pdaStack, typeManifestVisitor, nameApi } = scope;

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
        programAddress: pdaNode.programId ?? pdaStack.getProgram()!.publicKey,
        seeds,
    })
        .mergeImportsWith(imports)
        .addImports('solanaAddresses', ['type Address', 'getProgramDerivedAddress', 'type ProgramDerivedAddress']);
}
