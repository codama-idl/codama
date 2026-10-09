import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, identifierFromV1, integerStringFromV1 } from './shared';
import { valueNodeFromV1 } from './valueNodes';

/** v1 display nodes whose shape is unchanged in v2. */
type V1UnchangedDisplayNode =
    | v1.EnumVariantDisplayNode
    | v1.InstructionAccountDisplayNode
    | v1.InstructionDisplayNode
    | v1.StringDisplayNode
    | v1.StructFieldDisplayNode;

/**
 * Convert a v1 display node whose shape is unchanged in v2, in the attribute
 * order of v2. Number displays are converted alongside their number, since
 * date-times and durations moved to the type layer.
 */
export function displayNodeFromV1<T extends V1UnchangedDisplayNode>(
    display: T,
): Extract<v2.RegisteredDisplayNode, { kind: T['kind'] }> {
    const node: V1UnchangedDisplayNode = display;
    return displayNodeInV2OrderFromV1(node) as Extract<v2.RegisteredDisplayNode, { kind: T['kind'] }>;
}

function displayNodeInV2OrderFromV1(display: V1UnchangedDisplayNode): v2.RegisteredDisplayNode {
    switch (display.kind) {
        case 'enumVariantDisplayNode':
            return compactAndFreeze({ kind: display.kind, skipInnerData: display.skipInnerData, label: display.label });
        case 'instructionAccountDisplayNode':
            return compactAndFreeze({ kind: display.kind, skip: display.skip, label: display.label });
        case 'instructionDisplayNode':
            return compactAndFreeze({
                kind: display.kind,
                intent: display.intent,
                interpolatedIntent: display.interpolatedIntent,
            });
        case 'stringDisplayNode':
            return compactAndFreeze({ kind: display.kind, sliceStart: display.sliceStart, sliceEnd: display.sliceEnd });
        case 'structFieldDisplayNode':
            return compactAndFreeze({
                kind: display.kind,
                skip: display.skip,
                flatten: display.flatten,
                label: display.label,
                flattenPrefix: display.flattenPrefix,
            });
    }
}

export function injectableIntegerValueNodeFromV1(
    path: V1NodePath<v1.InjectableNumberValueNode>,
): v2.InjectableIntegerValueNode {
    const value = getLastV1NodeFromPath(path);
    if (value.kind === 'numberValueNode') {
        return compactAndFreeze({ kind: 'integerValueNode', value: integerStringFromV1(value.number) });
    }
    return compactAndFreeze({
        kind: 'injectedValueNode',
        key: identifierFromV1(value.key),
        fallback: value.fallback ? valueNodeFromV1([...path, value.fallback], [...path, INTEGER_HINT]) : undefined,
    });
}

export function injectableStringValueNodeFromV1(
    path: V1NodePath<v1.InjectableStringValueNode>,
): v2.InjectableStringValueNode {
    const value = getLastV1NodeFromPath(path);
    if (value.kind === 'stringValueNode') return compactAndFreeze({ kind: 'stringValueNode', string: value.string });
    return compactAndFreeze({
        kind: 'injectedValueNode',
        key: identifierFromV1(value.key),
        fallback: value.fallback ? valueNodeFromV1([...path, value.fallback], undefined) : undefined,
    });
}

/** Types values that can only be integers, e.g. the fallback of injected decimals. */
const INTEGER_HINT: v1.NumberTypeNode = { endian: 'le', format: 'u64', kind: 'numberTypeNode' };
