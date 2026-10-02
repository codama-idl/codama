import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, integerStringFromV1 } from './shared';
import { valueNodeFromV1 } from './valueNodes';

/** v1 display nodes whose shape is unchanged in v2. */
type V1UnchangedDisplayNode =
    | v1.EnumVariantDisplayNode
    | v1.InstructionAccountDisplayNode
    | v1.InstructionDisplayNode
    | v1.StringDisplayNode
    | v1.StructFieldDisplayNode;

/**
 * Convert a v1 display node whose shape is unchanged in v2. Number displays
 * are converted alongside their number, since date-times and durations moved
 * to the type layer.
 */
export function displayNodeFromV1<T extends V1UnchangedDisplayNode>(
    display: T,
): Extract<v2.RegisteredDisplayNode, { kind: T['kind'] }> {
    return compactAndFreeze({ ...display }) as unknown as Extract<v2.RegisteredDisplayNode, { kind: T['kind'] }>;
}

export function injectableIntegerValueNodeFromV1(
    path: V1NodePath<v1.InjectableNumberValueNode>,
): v2.InjectableIntegerValueNode {
    const value = getLastV1NodeFromPath(path);
    if (value.kind === 'numberValueNode') {
        return compactAndFreeze({ kind: 'integerValueNode', value: integerStringFromV1(value.number) });
    }
    return compactAndFreeze({
        fallback: value.fallback ? valueNodeFromV1([...path, value.fallback], [...path, INTEGER_HINT]) : undefined,
        key: value.key as string as v2.IdentifierString,
        kind: 'injectedValueNode',
    });
}

export function injectableStringValueNodeFromV1(
    path: V1NodePath<v1.InjectableStringValueNode>,
): v2.InjectableStringValueNode {
    const value = getLastV1NodeFromPath(path);
    if (value.kind === 'stringValueNode') return compactAndFreeze({ kind: 'stringValueNode', string: value.string });
    return compactAndFreeze({
        fallback: value.fallback ? valueNodeFromV1([...path, value.fallback], undefined) : undefined,
        key: value.key as string as v2.IdentifierString,
        kind: 'injectedValueNode',
    });
}

/** Types values that can only be integers, e.g. the fallback of injected decimals. */
const INTEGER_HINT: v1.NumberTypeNode = { endian: 'le', format: 'u64', kind: 'numberTypeNode' };
