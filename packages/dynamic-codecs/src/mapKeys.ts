import {
    CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CodamaError,
} from '@codama/errors';
import { DefinedTypeLinkNode, DefinedTypeNode, isNode, TypeNode } from '@codama/nodes';
import { getLastNodeFromPath, LinkableDictionary, NodePath } from '@codama/visitors-core';

import { isObjectRecord } from './validation';

/**
 * The key of a map entry in the object value of its map, since object keys are strings.
 * Strings are used as they are, e.g. `'alice'`, and other scalars as their string form,
 * e.g. `'42'` or `'true'`. Variants without data use their identifier, e.g. `'quit'`.
 * Other keys, e.g. structs or tuples, use a deterministic JSON form, e.g. `'{"x":1,"y":2}'`,
 * that keeps the order of object keys, writes integers with all their digits, and writes
 * non-finite numbers and negative zero as `NaN`, `Infinity`, `-Infinity` and `-0.0`.
 *
 * Map keys are parsed back from these strings by {@link getMapKeyParser}.
 *
 * @example
 * ```ts
 * getMapKeyString(42n); // '42'
 * getMapKeyString({ __discriminator: 0, __kind: 'quit' }); // 'quit'
 * getMapKeyString({ x: 1n, y: 2n }); // '{"x":1,"y":2}'
 * ```
 */
export function getMapKeyString(key: unknown): string {
    if (typeof key === 'string') return key;
    if (typeof key === 'bigint' || typeof key === 'boolean') return String(key);
    if (typeof key === 'number') return Object.is(key, -0) ? '-0' : String(key);
    if (isObjectRecord(key) && isVariantWithoutData(key)) return key.__kind;
    return stringifyJson(key);
}

/**
 * Get a function parsing the keys of the object value of a map back into the values of its
 * key type, the reverse of {@link getMapKeyString}. Links in the key type are resolved to
 * their defined types to know how to parse their keys, e.g. integer keys parse as `bigint`s.
 *
 * Keys that do not parse throw a `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error whose path is
 * the path of the resolved key type. Keys that parse are then validated by the key codec.
 *
 * @param keyPath - The path of the key type of the map, e.g. `[...mapPath, map.key]`.
 * @param linkables - Used to follow `definedTypeLinkNode`s.
 *
 * @example
 * ```ts
 * const parseKey = getMapKeyParser([map, map.key], linkables); // with a `u64` key
 * parseKey('42'); // 42n
 * ```
 */
export function getMapKeyParser(keyPath: NodePath<TypeNode>, linkables: LinkableDictionary): (key: string) => unknown {
    const path = resolveKeyTypePath(keyPath, linkables);
    const keyType = getLastNodeFromPath(path);
    const fail = (key: string, expectedType: string): never => {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: `key '${key}'`,
            expectedType,
            path,
        });
    };
    const parseJsonKey = (key: string) => parseJson(key, () => fail(key, 'JSON key'));

    switch (keyType.kind) {
        case 'publicKeyTypeNode':
        case 'stringTypeNode':
            return key => key;
        case 'dateTimeTypeNode':
        case 'durationTypeNode':
        case 'fixedPointTypeNode':
        case 'integerTypeNode':
            return key => (INTEGER_REGEX.test(key) ? BigInt(key) : fail(key, 'integer key'));
        case 'floatTypeNode':
            return key => {
                const value = Number(key);
                const isValid = key.trim() !== '' && (!Number.isNaN(value) || key === 'NaN');
                return isValid ? value : fail(key, 'number key');
            };
        case 'booleanTypeNode':
            return key => (key === 'true' ? true : key === 'false' ? false : fail(key, "'true' | 'false'"));
        case 'enumTypeNode':
            // Variants without data use their identifier, which enums encode from.
            return key => (key.startsWith('{') ? parseJsonKey(key) : key);
        default:
            return parseJsonKey;
    }
}

const INTEGER_REGEX = /^-?\d+$/;

/** Whether the value is an enum variant without data, e.g. `{ __discriminator: 0, __kind: 'quit' }`. */
function isVariantWithoutData(value: Record<string, unknown>): value is { __kind: string } {
    if (typeof value.__kind !== 'string') return false;
    return Object.keys(value).every(key => key === '__kind' || key === '__discriminator');
}

/** Follow the links of a key type to the type they define, e.g. a `u64` for a link to an `id` type. */
function resolveKeyTypePath(keyPath: NodePath<TypeNode>, linkables: LinkableDictionary): NodePath<TypeNode> {
    let path = keyPath;
    const followedTypes = new Set<DefinedTypeNode>();
    for (;;) {
        const node = getLastNodeFromPath(path);
        if (!isNode(node, 'definedTypeLinkNode')) return path;
        const definedTypePath = linkables.getPathOrThrow(path as NodePath<DefinedTypeLinkNode>);
        const definedType = getLastNodeFromPath(definedTypePath);
        // An alias cycle (e.g. `a = b`, `b = a`) never reaches a type to parse keys with.
        if (followedTypes.has(definedType)) {
            throw new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, { path: definedTypePath });
        }
        followedTypes.add(definedType);
        path = [...definedTypePath, definedType.type];
    }
}

/** The deterministic JSON form of a key, see {@link getMapKeyString}. */
function stringifyJson(value: unknown): string {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return String(value);
        return Object.is(value, -0) ? '-0.0' : JSON.stringify(value);
    }
    if (typeof value === 'string' || typeof value === 'boolean' || value === null) return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stringifyJson).join(',')}]`;
    if (isObjectRecord(value)) {
        const entries = Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}:${stringifyJson(item)}`);
        return `{${entries.join(',')}}`;
    }
    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
        message: `Map keys cannot hold values of type [${typeof value}].`,
    });
}

const WHITESPACE_REGEX = /[ \t\n\r]*/y;
// JSON strings cannot hold unescaped control characters.
// eslint-disable-next-line no-control-regex
const STRING_REGEX = /"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/y;
const NUMBER_REGEX = /-?(?:0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/y;
const LITERALS: readonly (readonly [string, unknown])[] = [
    ['-Infinity', -Infinity],
    ['Infinity', Infinity],
    ['NaN', NaN],
    ['false', false],
    ['null', null],
    ['true', true],
];

/**
 * Parse the JSON form of a key, see {@link getMapKeyString}. Integer literals parse as
 * `bigint`s, so they keep all their digits, and other numbers as `number`s.
 */
function parseJson(text: string, fail: () => never): unknown {
    let offset = 0;
    const match = (regex: RegExp): RegExpExecArray | null => {
        regex.lastIndex = offset;
        const result = regex.exec(text);
        if (result) offset = regex.lastIndex;
        return result;
    };
    const skipWhitespace = () => match(WHITESPACE_REGEX);
    const consume = (token: string): boolean => {
        skipWhitespace();
        if (!text.startsWith(token, offset)) return false;
        offset += token.length;
        return true;
    };
    const expect = (token: string) => consume(token) || fail();

    // Collect the items of an array or object, e.g. `1,2]`, after its opening token.
    const parseItems = <T>(close: string, parseItem: () => T): T[] => {
        const items: T[] = [];
        if (consume(close)) return items;
        do {
            items.push(parseItem());
        } while (consume(','));
        expect(close);
        return items;
    };
    const parseString = (): string => {
        skipWhitespace();
        const result = match(STRING_REGEX);
        return result ? (JSON.parse(result[0]) as string) : fail();
    };
    const parseValue = (): unknown => {
        skipWhitespace();
        if (consume('[')) return parseItems(']', parseValue);
        if (consume('{')) {
            const parseEntry = () => {
                const key = parseString();
                expect(':');
                return [key, parseValue()] as const;
            };
            // Unlike assignments, `fromEntries` defines keys such as `__proto__` as own properties.
            return Object.fromEntries(parseItems('}', parseEntry));
        }
        if (text[offset] === '"') return parseString();
        const literal = LITERALS.find(([token]) => text.startsWith(token, offset));
        if (literal) {
            offset += literal[0].length;
            return literal[1];
        }
        const number = match(NUMBER_REGEX);
        if (!number) return fail();
        const [digits, fraction, exponent] = number;
        return fraction === undefined && exponent === undefined ? BigInt(digits) : Number(digits);
    };

    const value = parseValue();
    skipWhitespace();
    return offset === text.length ? value : fail();
}
