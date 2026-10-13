import { CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER, CodamaError } from '@codama/errors';
import type { AccountDataValueNode, AccountValueNode, DataValueNode } from '@codama/node-types';

import { accountDataValueNode } from './generated/contextualValueNodes/AccountDataValueNode';
import { accountValueNode } from './generated/contextualValueNodes/AccountValueNode';
import { dataValueNode } from './generated/contextualValueNodes/DataValueNode';
import { isNode } from './Node';

/**
 * A part of an interpolated intent: either literal text or the value a
 * placeholder refers to, as the contextual value node it is equivalent to.
 *
 * - `${data.config.fees[0]}` is `dataValueNode('config.fees[0]')`.
 * - `${accounts.mint}` is `accountValueNode('mint')`, the account's address.
 * - `${accounts.mint.data.decimals}` is `accountDataValueNode('mint', { path: 'decimals' })`.
 */
export type InterpolatedIntentPart = AccountDataValueNode | AccountValueNode | DataValueNode | string;

const PLACEHOLDER_START = '${';
const PLACEHOLDER_END = '}';
const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*/;
/** A path continuing after a root or an account: `.identifier…` or `[n]…`, as in `${data.amount}` or `${data[0]}`. */
const PATH_CONTINUATION_REGEX =
    /^(?:\.[A-Za-z_][A-Za-z0-9_]*|\[(?:0|[1-9][0-9]*)\])(?:\.[A-Za-z_][A-Za-z0-9_]*|\[(?:0|[1-9][0-9]*)\])*$/;

/**
 * Parse an interpolated intent into its literal text and the contextual
 * value nodes its placeholders refer to.
 *
 * Placeholders start with the `data` root, followed by a path into the
 * instruction data, or the `accounts` root, followed by an account
 * identifier and, optionally, `.data` and a path into the account's decoded
 * data. Text outside placeholders is kept as is, and empty text is omitted.
 *
 * @throws `CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER` on the first
 *   placeholder that does not follow this grammar, e.g. `${accounts.mint.lamports}`,
 *   or that is not closed.
 *
 * @example
 * ```ts
 * parseInterpolatedIntent('Transfer ${data.amount} to ${accounts.destination.data.owner}');
 * // ['Transfer ', dataValueNode('amount'), ' to ', accountDataValueNode('destination', { path: 'owner' })]
 * ```
 */
export function parseInterpolatedIntent(template: string): InterpolatedIntentPart[] {
    const parts: InterpolatedIntentPart[] = [];
    let cursor = 0;
    for (;;) {
        const start = template.indexOf(PLACEHOLDER_START, cursor);
        if (start < 0) break;
        if (start > cursor) parts.push(template.slice(cursor, start));
        const end = template.indexOf(PLACEHOLDER_END, start + PLACEHOLDER_START.length);
        if (end < 0) throw getInvalidPlaceholderError(template.slice(start), template);
        const placeholder = template.slice(start, end + PLACEHOLDER_END.length);
        parts.push(parsePlaceholder(template.slice(start + PLACEHOLDER_START.length, end), placeholder, template));
        cursor = end + PLACEHOLDER_END.length;
    }
    if (cursor < template.length) parts.push(template.slice(cursor));
    return parts;
}

/**
 * Print the parts of an interpolated intent back into its template, the
 * inverse of {@link parseInterpolatedIntent}.
 *
 * @example
 * ```ts
 * printInterpolatedIntent(['Transfer ', dataValueNode('amount')]); // "Transfer ${data.amount}"
 * ```
 */
export function printInterpolatedIntent(parts: readonly InterpolatedIntentPart[]): string {
    return parts
        .map(part => {
            if (typeof part === 'string') return part;
            if (isNode(part, 'dataValueNode')) return `\${data${printPathContinuation(part.path)}}`;
            if (isNode(part, 'accountValueNode')) return `\${accounts.${part.identifier}}`;
            const path = part.path === undefined ? '' : printPathContinuation(part.path);
            return `\${accounts.${part.account}.data${path}}`;
        })
        .join('');
}

function parsePlaceholder(content: string, placeholder: string, template: string): InterpolatedIntentPart {
    const invalid = () => getInvalidPlaceholderError(placeholder, template);
    if (content.startsWith('data')) {
        const path = parsePathContinuation(content.slice('data'.length));
        if (path === undefined) throw invalid();
        return dataValueNode(path);
    }
    if (content.startsWith('accounts.')) {
        const rest = content.slice('accounts.'.length);
        const account = IDENTIFIER_REGEX.exec(rest)?.[0];
        if (account === undefined) throw invalid();
        const attribute = rest.slice(account.length);
        if (attribute === '') return accountValueNode(account);
        if (attribute === '.data') return accountDataValueNode(account);
        if (!attribute.startsWith('.data')) throw invalid();
        const path = parsePathContinuation(attribute.slice('.data'.length));
        if (path === undefined) throw invalid();
        return accountDataValueNode(account, { path });
    }
    throw invalid();
}

/** The path expression of a path continuation, e.g. `amount` for `.amount` or `[0]` for `[0]`. */
function parsePathContinuation(continuation: string): string | undefined {
    if (!PATH_CONTINUATION_REGEX.test(continuation)) return undefined;
    return continuation.startsWith('.') ? continuation.slice(1) : continuation;
}

function printPathContinuation(path: string): string {
    return path.startsWith('[') ? path : `.${path}`;
}

function getInvalidPlaceholderError(placeholder: string, template: string): CodamaError {
    return new CodamaError(CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER, { placeholder, template });
}
