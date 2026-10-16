import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';

import type * as v1 from '../v1';
import type * as v2 from '../v2';

/**
 * Build a v2 node from the given attributes, dropping the `undefined` ones and
 * the empty arrays, as the v2 node constructors do. The node is frozen, along
 * with copies of its array attributes. Nested nodes are already frozen since
 * they are built with this function too, whereas opaque values such as plugin
 * payloads are kept as is, as the v2 node constructors do.
 *
 * Nodes are built as plain objects rather than through the `@codama/nodes`
 * constructors so this upgrade step keeps producing v2 nodes once the
 * constructors move on to later majors.
 */
export function compactAndFreeze<T extends object>(attributes: T): T {
    const entries = Object.entries(attributes)
        .filter(([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0))
        .map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value]);
    return Object.freeze(Object.fromEntries(entries)) as T;
}

/**
 * The v2 identifier of a v1 name, e.g. an account name. v1 names were meant
 * to be camelCase, so they are valid v2 identifiers, except for hand-written
 * names with dashes, e.g. `token-2022`, whose dashes become underscores.
 *
 * @throws `CODAMA_ERROR__INVALID_BRANDED_STRING` for any other invalid name.
 */
export function identifierFromV1(name: string): v2.IdentifierString {
    return brandFromV1(name, IDENTIFIER_REGEX, 'identifier (letters, digits and underscores; no leading digit)');
}

/** The v2 path of a v1 name referencing a top-level field, e.g. an argument name. See {@link identifierFromV1}. */
export function pathFromV1(name: string): v2.PathString {
    return brandFromV1(name, IDENTIFIER_REGEX, 'path (e.g. "data.amount" or "[0].field")');
}

/** The v2 namespace of a v1 plugin name. See {@link identifierFromV1}. */
export function namespaceFromV1(name: string): v2.NamespaceString {
    return brandFromV1(name, NAMESPACE_REGEX, 'namespace (dot-separated identifiers)');
}

const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
const NAMESPACE_REGEX = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;

function brandFromV1<T extends string>(name: string, regex: RegExp, expected: string): T {
    const value = name.replaceAll('-', '_');
    if (!regex.test(value)) throw new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, { actual: name, expected });
    return value as T;
}

/** v1 docs are arrays of lines, joined with line breaks in v2. Empty docs are dropped. */
export function docsFromV1(docs: v1.Docs | undefined): string | undefined {
    return docs && docs.length > 0 ? docs.join('\n') : undefined;
}

/**
 * The canonical integer string of a v1 number, e.g. `42` becomes `"42"`.
 * Integers beyond the safe range were already rounded when the v1 JSON was
 * parsed, so the rounded value is kept as is.
 */
export function integerStringFromV1(value: number): v2.IntegerString {
    if (!Number.isInteger(value)) {
        throw new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
            actual: String(value),
            expected: 'integer (base-10, no leading zeros)',
        });
    }
    return BigInt(value).toString() as v2.IntegerString;
}

/**
 * The canonical decimal string of a v1 number, without exponent nor trailing
 * zeros, e.g. `1e-7` becomes `"0.0000001"`.
 */
export function decimalStringFromV1(value: number): v2.DecimalString {
    if (Number.isNaN(value)) return 'NaN' as v2.DecimalString;
    if (value === Infinity) return 'Infinity' as v2.DecimalString;
    if (value === -Infinity) return '-Infinity' as v2.DecimalString;
    if (Object.is(value, -0)) return '-0' as v2.DecimalString;

    const [mantissa, exponentString] = Math.abs(value).toString().split('e');
    const sign = value < 0 ? '-' : '';
    if (exponentString === undefined) return `${sign}${mantissa}` as v2.DecimalString;

    // Expand the exponent form, e.g. `1.5e+21` or `1.5e-7`.
    const exponent = Number(exponentString);
    const [integerDigits, fractionDigits = ''] = mantissa.split('.');
    const digits = integerDigits + fractionDigits;
    const pointIndex = integerDigits.length + exponent;
    let decimal: string;
    if (pointIndex <= 0) {
        decimal = `0.${'0'.repeat(-pointIndex)}${digits}`;
    } else if (pointIndex >= digits.length) {
        decimal = digits + '0'.repeat(pointIndex - digits.length);
    } else {
        decimal = `${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`;
    }
    const canonical = decimal.includes('.') ? decimal.replace(/0+$/, '').replace(/\.$/, '') : decimal;
    return `${sign}${canonical.replace(/^0+(?=\d)/, '')}` as v2.DecimalString;
}
