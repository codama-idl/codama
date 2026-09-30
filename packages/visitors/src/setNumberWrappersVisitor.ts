import { CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER, CodamaError } from '@codama/errors';
import {
    amountNumberDisplayNode,
    dateTimeTypeNode,
    durationTypeNode,
    fixedPointTypeNode,
    FloatTypeNode,
    floatTypeNode,
    InjectableIntegerValueNode,
    InjectableStringValueNode,
    IntegerTypeNode,
    integerTypeNode,
    isNode,
    Node,
    NodeKind,
    TypeNode,
    unitNumberDisplayNode,
} from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor, NodePath } from '@codama/visitors-core';

/** A semantic wrapper to apply to a number: a scaled quantity, a point in time, a duration, a unit or a display. */
export type NumberWrapper =
    | { base?: 2 | 10; kind: 'FixedPoint'; scale: number; unit?: string }
    | { decimals: InjectableIntegerValueNode; kind: 'AmountDisplay'; unit?: InjectableStringValueNode }
    | { kind: 'DateTime'; ticksPerSecond?: number }
    | { kind: 'Duration'; ticksPerSecond?: number }
    | { kind: 'SolAmount' }
    | { kind: 'Unit'; unit: string }
    | { kind: 'UnitDisplay'; unit: InjectableStringValueNode };

type NumberWrapperMap = Record<string, NumberWrapper>;

const INTEGER_ONLY_KINDS = ['AmountDisplay', 'DateTime', 'Duration', 'FixedPoint', 'SolAmount'];
const INTEGER_AND_FLOAT_KINDS = ['Unit', 'UnitDisplay'];

/**
 * Nodes whose integer children are sizes, prefixes or already-wrapped
 * numbers rather than values, so they are never wrapped.
 */
const NON_VALUE_INTEGER_PARENTS: NodeKind[] = [
    'booleanTypeNode',
    'dateTimeTypeNode',
    'durationTypeNode',
    'enumTypeNode',
    'fixedPointTypeNode',
    'prefixedCountNode',
    'sizePrefixTransformNode',
];

/**
 * Give semantic meaning to the numbers matching the given selectors, e.g.
 * turn a `u64` into a token amount or a timestamp.
 *
 * - `FixedPoint` and `SolAmount` wrap the integer in a `fixedPointTypeNode`
 *   (`SolAmount` being a fixed point of scale 9 in `SOL`).
 * - `DateTime` and `Duration` wrap the integer in a `dateTimeTypeNode` or
 *   a `durationTypeNode`.
 * - `Unit` sets the unit of an integer or a float.
 * - `AmountDisplay` and `UnitDisplay` set the display of an integer (or of
 *   a float, for `UnitDisplay`) to an `amountNumberDisplayNode` or a
 *   `unitNumberDisplayNode`.
 *
 * Wrappers carry the `transforms` of the number they wrap. Integers used as
 * sizes or prefixes (e.g. an enum size or a size prefix), and numbers within
 * the type of a constant (e.g. a hidden prefix), are left untouched.
 *
 * @throws {CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER} if the wrapper
 * kind is unknown, if a fixed point has a zero scale or wraps a `shortU16`,
 * or if a wrapped integer already carries a unit or display.
 *
 * @example
 * ```ts
 * setNumberWrappersVisitor({
 *     'mint.supply': { kind: 'FixedPoint', scale: 6, unit: 'USDC' },
 *     lamports: { kind: 'SolAmount' },
 *     createdAt: { kind: 'DateTime' },
 *     'transfer.amount': { decimals: injectedValueNode({ key: 'decimals' }), kind: 'AmountDisplay' },
 * });
 * ```
 */
export function setNumberWrappersVisitor(map: NumberWrapperMap) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(([selector, wrapper]): BottomUpNodeTransformerWithSelector => {
            assertValidWrapper(wrapper);
            const kinds = INTEGER_AND_FLOAT_KINDS.includes(wrapper.kind)
                ? '[integerTypeNode|floatTypeNode]'
                : '[integerTypeNode]';
            return {
                select: [`${selector}.${kinds}`, path => isValueNumber(path)],
                transform: node => {
                    if (isNode(node, 'floatTypeNode')) return wrapFloat(node, wrapper);
                    if (isNode(node, 'integerTypeNode')) return wrapInteger(node, wrapper);
                    return node;
                },
            };
        }),
    );
}

/** Nodes whose descendants are the types of constants, which are never wrapped. */
const CONSTANT_ANCESTORS: NodeKind[] = ['constantPdaSeedNode', 'constantValueNode'];

/**
 * Whether the number at the end of the path is a value rather than a size,
 * a prefix, a wrapped number or (part of) the type of a constant.
 */
function isValueNumber(path: NodePath<Node>): boolean {
    if (path.some(node => CONSTANT_ANCESTORS.includes(node.kind))) return false;
    const number = path[path.length - 1];
    const parent = path[path.length - 2] as Node | undefined;
    if (!parent) return true;
    if (NON_VALUE_INTEGER_PARENTS.includes(parent.kind)) return false;
    return !(isNode(parent, 'optionTypeNode') && parent.prefix === number && parent.item !== number);
}

function assertValidWrapper(wrapper: NumberWrapper): void {
    if (![...INTEGER_ONLY_KINDS, ...INTEGER_AND_FLOAT_KINDS].includes(wrapper.kind)) {
        throw invalidWrapper(wrapper, 'unknown wrapper kind');
    }
    if (wrapper.kind === 'FixedPoint' && wrapper.scale === 0) {
        throw invalidWrapper(wrapper, 'a fixed point must have a non-zero scale; use a `Unit` wrapper instead');
    }
}

function wrapInteger(number: IntegerTypeNode, wrapper: NumberWrapper): TypeNode {
    switch (wrapper.kind) {
        case 'Unit':
            return integerTypeNode(number.format, { ...number, unit: wrapper.unit });
        case 'UnitDisplay':
            return integerTypeNode(number.format, {
                ...number,
                display: unitNumberDisplayNode({ unit: wrapper.unit }),
            });
        case 'AmountDisplay':
            return integerTypeNode(number.format, {
                ...number,
                display: amountNumberDisplayNode({ decimals: wrapper.decimals, unit: wrapper.unit }),
            });
        default:
            return wrapIntegerInTypeNode(number, wrapper);
    }
}

/** Wrap an integer in a fixed point, date-time or duration, which carries its transforms. */
function wrapIntegerInTypeNode(
    number: IntegerTypeNode,
    wrapper: Extract<NumberWrapper, { kind: 'DateTime' | 'Duration' | 'FixedPoint' | 'SolAmount' }>,
): TypeNode {
    if (number.unit !== undefined || number.display !== undefined) {
        throw invalidWrapper(wrapper, 'the wrapped integer must not carry a unit or display');
    }
    const { transforms } = number;
    const inner = integerTypeNode(number.format, { ...number, transforms: undefined });
    switch (wrapper.kind) {
        case 'DateTime':
            return dateTimeTypeNode(inner, { ticksPerSecond: wrapper.ticksPerSecond, transforms });
        case 'Duration':
            return durationTypeNode(inner, { ticksPerSecond: wrapper.ticksPerSecond, transforms });
        case 'FixedPoint':
        case 'SolAmount': {
            if (number.format === 'shortU16') {
                throw invalidWrapper(wrapper, 'a fixed point cannot wrap a variable-size `shortU16` integer');
            }
            return wrapper.kind === 'SolAmount'
                ? fixedPointTypeNode(inner, 9, { transforms, unit: 'SOL' })
                : fixedPointTypeNode(inner, wrapper.scale, { base: wrapper.base, transforms, unit: wrapper.unit });
        }
    }
}

function wrapFloat(number: FloatTypeNode, wrapper: NumberWrapper): TypeNode {
    switch (wrapper.kind) {
        case 'Unit':
            return floatTypeNode(number.format, { ...number, unit: wrapper.unit });
        case 'UnitDisplay':
            return floatTypeNode(number.format, { ...number, display: unitNumberDisplayNode({ unit: wrapper.unit }) });
        default:
            return number;
    }
}

function invalidWrapper(wrapper: NumberWrapper, reason: string): CodamaError {
    return new CodamaError(CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER, { kind: wrapper.kind, reason, wrapper });
}
