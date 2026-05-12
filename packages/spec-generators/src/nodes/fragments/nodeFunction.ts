import { type Fragment, fragment, getDocblockFragment } from '@codama/fragments/javascript';
import type { AttributeSpec, NodeSpec } from '@codama/spec';

import { getTypeParameterIdentifierListFragment } from '../../shared';
import type { NodeConstructorConfig } from '../config';
import type { ResolvedRenderOptions } from '../options';
import { getNodeFunctionBodyFragment } from './nodeFunctionBody';
import { getNodeFunctionPositionalArgumentsFragment } from './nodeFunctionPositionalArguments';
import { getNodeFunctionReturnTypeFragment } from './nodeFunctionReturnType';
import { getNodeFunctionTypeParametersFragment } from './nodeFunctionTypeParameters';
import { computeConstructorDefaults } from './nodeTypeParameters';

/** The `export function xxxNode(...)` declaration: signature + body. */
export function getNodeFunctionFragment(
    node: NodeSpec,
    interfaceName: string,
    config: NodeConstructorConfig | undefined,
    typeParameterAttributes: readonly AttributeSpec[],
    scope: Pick<ResolvedRenderOptions, 'narrowableDataAttributes'>,
): Fragment {
    const isPositional = config?.positionalArgs !== undefined;
    const constructorDefaults = computeConstructorDefaults(node, typeParameterAttributes, config, scope);

    const docComment = getDocblockFragment(node.docs, { withLineJump: true });
    const typeParameters = getNodeFunctionTypeParametersFragment(typeParameterAttributes, constructorDefaults);
    const returnType = getNodeFunctionReturnTypeFragment(interfaceName, typeParameterAttributes);
    const params = isPositional
        ? getNodeFunctionPositionalArgumentsFragment(node, typeParameterAttributes, config)
        : getNodeFunctionInputParameterFragment(interfaceName, typeParameterAttributes);
    const body = getNodeFunctionBodyFragment(node, config, typeParameterAttributes);

    const fnName = camelCaseFirst(interfaceName);
    return fragment`${docComment}export function ${fnName}${typeParameters}(${params}): ${returnType} {\n${body}\n}\n`;
}

/** The single-`input`-object parameter: `input: XxxNodeInput<TA, TB>`. */
function getNodeFunctionInputParameterFragment(
    interfaceName: string,
    typeParameterAttributes: readonly AttributeSpec[],
): Fragment {
    const inputName = `${interfaceName}Input`;
    if (typeParameterAttributes.length === 0) return fragment`input: ${inputName}`;
    const args = getTypeParameterIdentifierListFragment(typeParameterAttributes);
    return fragment`input: ${inputName}<${args}>`;
}

function camelCaseFirst(s: string): string {
    return s.charAt(0).toLowerCase() + s.slice(1);
}
