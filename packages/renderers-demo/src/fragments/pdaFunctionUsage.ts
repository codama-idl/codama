import { isNode, pascalCase, PdaNode } from '@codama/nodes';

import { addFragmentImports, Fragment, fragment } from '../utils';

export function getPdaFunctionUsageFragment(node: PdaNode): Fragment {
    const functionName = `find${pascalCase(node.name)}Pda`;
    const variableSeedNames = node.seeds.filter(s => isNode(s, 'variablePdaSeedNode')).map(s => s.name);
    const seedObject =
        variableSeedNames.length > 2
            ? `{\n${variableSeedNames.join(',\n')},\n}`
            : `{ ${variableSeedNames.join(', ')} }`;
    return addFragmentImports(
        fragment`const [address, bump] = await ${functionName}(${seedObject});`,
        'generatedPdas',
        pascalCase(node.name),
    );
}
