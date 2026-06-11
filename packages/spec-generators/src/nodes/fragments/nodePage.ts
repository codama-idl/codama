import { type Fragment, fragment } from '@codama/fragments/javascript';
import type { NodeSpec } from '@codama/spec';

import type { NodeConstructorConfig } from '../config';
import { getNodeTypeParameterAttributes, type ResolvedRenderOptions } from '../options';
import { getInputTypeFragment } from './inputType';
import { getNodeFunctionFragment } from './nodeFunction';

/**
 * The full file body for one node's constructor file: an optional
 * `XxxNodeInput` type declaration followed by the node function.
 * Positional-arg node functions don't emit an Input type.
 *
 * The type-parameter-attribute list is computed once here and threaded
 * down to the input type and the node function so neither has to
 * recompute it.
 */
export function getNodePageFragment(
    node: NodeSpec,
    interfaceName: string,
    config: NodeConstructorConfig | undefined,
    scope: Pick<ResolvedRenderOptions, 'genericParamOrder' | 'narrowableDataAttributes'>,
): Fragment {
    const isPositional = config?.positionalArgs !== undefined;
    const typeParameterAttributes = getNodeTypeParameterAttributes(node, scope);
    const inputType = isPositional
        ? undefined
        : getInputTypeFragment(node, interfaceName, config, typeParameterAttributes);
    const nodeFunction = getNodeFunctionFragment(node, interfaceName, config, typeParameterAttributes, scope);
    return inputType ? fragment`${inputType}\n${nodeFunction}` : nodeFunction;
}
