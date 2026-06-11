import { type Fragment, fragment, use } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';

import { getTypeParameterIdentifierListFragment } from '../../shared';

/** The node function's return type: `XxxNode<TA, TB>` or just `XxxNode`. */
export function getNodeFunctionReturnTypeFragment(
    interfaceName: string,
    typeParameterAttributes: readonly AttributeSpec[],
): Fragment {
    const interfaceRef = use(`type ${interfaceName}`, '@codama/node-types');
    if (typeParameterAttributes.length === 0) return interfaceRef;
    const args = getTypeParameterIdentifierListFragment(typeParameterAttributes);
    return fragment`${interfaceRef}<${args}>`;
}
