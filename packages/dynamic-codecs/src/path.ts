import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CodamaError } from '@codama/errors';
import { PathString } from '@codama/nodes';
import { getLastNodeFromPath, parsePath, PathSegment } from '@codama/visitors-core';

import { DecodedAccountNode, DecodedNode, DecodedPublicKeyTypeNode, isDecodedNode } from './decoded';
import type { FormattedAccountNode, FormattedNode, FormattedPublicKeyTypeNode } from './formatted';

/** Options of {@link getDecodedNodeAtPath}. */
export type GetDecodedNodeAtPathOptions<
    TPublicKey extends DecodedPublicKeyTypeNode = DecodedPublicKeyTypeNode,
    TAccount extends DecodedAccountNode = DecodedAccountNode,
> = {
    /**
     * Get the decoded data of the account a public key links to, e.g. from accounts fetched
     * beforehand, so paths can cross its `accountLink` with a `.data` segment, as
     * `mint.data.decimals` does. Returning
     * `undefined`, e.g. for an account that was not fetched, makes the whole path resolve to
     * `undefined`. Without it, crossing an account link throws.
     */
    resolveAccountLink?: (publicKey: TPublicKey) => TAccount | undefined;
};

/**
 * Get the decoded node a path expression points to within a decoded node, e.g. to fill the
 * `${data.config.fees[0]}` placeholder of an instruction display. It works on formatted nodes
 * too, returning a formatted node.
 *
 * A `.identifier` segment selects a struct field, returned as is, e.g. with its label when
 * formatted, and an `[n]` segment selects the n-th item of an array, set or tuple. Accounts,
 * events, instructions, defined types, struct fields and enum variants along the way resolve to
 * their data or type, as for `resolveTypePath`. Options and enums are not, so a path cannot
 * go through them. A `.data` segment applied to a public key whose type carries an
 * `accountLink` continues into the data of the linked account, as given by the
 * `resolveAccountLink` option, e.g. `mint.data.decimals`, and `mint.data` returns that data.
 *
 * Returns `undefined` when the decoded data has no such node, i.e. an index beyond the items of
 * an array or set, or a linked account that `resolveAccountLink` does not provide.
 *
 * @throws `CODAMA_ERROR__CANNOT_RESOLVE_PATH` when a segment cannot be applied to the node it
 *   reaches, e.g. an unknown struct field, an index into an integer, a segment other than
 *   `.data` on a linked public key, or a `.data` segment without a `resolveAccountLink` option.
 *
 * @example
 * ```ts
 * // data: struct { config: struct { fees: array(u16) } }
 * getDecodedNodeAtPath(instruction, pathString('config.fees[0]')); // the decoded u16
 * getDecodedNodeAtPath(formatDecodedNode(instruction), pathString('config.fees[0]'))?.text; // "25"
 *
 * // data: struct { mint: publicKey(accountLink: mint) }
 * getDecodedNodeAtPath(instruction, pathString('mint.data.decimals'), {
 *     resolveAccountLink: publicKey => decodedAccounts.get(publicKey.value),
 * }); // the decoded `decimals` of the mint account
 * ```
 */
export function getDecodedNodeAtPath(
    decoded: FormattedNode,
    path: PathString,
    options?: GetDecodedNodeAtPathOptions<FormattedPublicKeyTypeNode, FormattedAccountNode>,
): FormattedNode | undefined;
export function getDecodedNodeAtPath(
    decoded: DecodedNode,
    path: PathString,
    options?: GetDecodedNodeAtPathOptions,
): DecodedNode | undefined;
export function getDecodedNodeAtPath(
    decoded: DecodedNode,
    path: PathString,
    options: GetDecodedNodeAtPathOptions<never> = {},
): DecodedNode | undefined {
    // The overloads only pass formatted public keys to resolvers of formatted nodes.
    const resolveOptions = options as GetDecodedNodeAtPathOptions;
    let current: DecodedNode = decoded;
    for (const segment of parsePath(path)) {
        const container = resolveContainer(current, path, segment);
        if (
            segment.kind === 'field' &&
            entersLinkedAccountData(container, segment) &&
            resolveOptions.resolveAccountLink
        ) {
            const account = resolveOptions.resolveAccountLink(container);
            if (!account) return undefined;
            current = account.data;
        } else if (segment.kind === 'field') {
            const field = isDecodedNode(container, 'structTypeNode')
                ? container.fields.find(field => getLastNodeFromPath(field.path).identifier === segment.identifier)
                : undefined;
            if (!field) throw getCannotResolvePathError(container, path, segment);
            current = field;
        } else if (isDecodedNode(container, 'tupleTypeNode')) {
            const item = container.items[segment.index];
            if (!item) throw getCannotResolvePathError(container, path, segment);
            current = item;
        } else if (isDecodedNode(container, ['arrayTypeNode', 'setTypeNode'])) {
            const item = container.items[segment.index];
            if (!item) return undefined;
            current = item;
        } else {
            throw getCannotResolvePathError(container, path, segment);
        }
    }
    return current;
}

/** Resolve accounts, events, instructions, defined types, struct fields and enum variants to their data or type. */
function resolveContainer(decoded: DecodedNode, path: PathString, segment: PathSegment): DecodedNode {
    let current = decoded;
    for (;;) {
        if (isDecodedNode(current, ['accountNode', 'enumVariantTypeNode', 'eventNode', 'instructionNode'])) {
            if (!current.data) throw getCannotResolvePathError(current, path, segment);
            current = current.data;
        } else if (isDecodedNode(current, ['definedTypeNode', 'structFieldTypeNode'])) {
            current = current.type;
        } else {
            return current;
        }
    }
}

/** Whether a segment enters the data of the account a decoded public key links to, i.e. a `.data` segment on a linked public key. */
function entersLinkedAccountData(
    decoded: DecodedNode,
    segment: PathSegment & { kind: 'field' },
): decoded is DecodedPublicKeyTypeNode {
    return (
        segment.identifier === 'data' &&
        isDecodedNode(decoded, 'publicKeyTypeNode') &&
        getLastNodeFromPath(decoded.path).accountLink !== undefined
    );
}

function getCannotResolvePathError(decoded: DecodedNode, path: PathString, segment: PathSegment): CodamaError {
    return new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        nodePath: decoded.path,
        path,
        segment: segment.kind === 'field' ? segment.identifier : `[${segment.index}]`,
    });
}
