import { getNodeValueCodecVisitor, getValueNodeVisitor } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getRecordLinkablesVisitor,
    type IdentifierString,
    type InstructionNode,
    isNode,
    LinkableDictionary,
    type Node,
    type NodePath,
    NodeStack,
    ProvidedScope,
    type TypeNode,
    type ValueNode,
    visit,
} from 'codama';

import { type AddressInput, toAddress } from '../shared/address';
import type { AccountsInput, DataInput, FetchAccountsFn } from '../shared/types';
import { formatValueType } from '../shared/util';
import { getBatchedFetchAccounts } from './batched-fetch-accounts';
import type { ResolutionContext } from './types';

const linkablesCache = new WeakMap<Node, LinkableDictionary>();

/** Record, once per root node, the linkable nodes of the tree containing the given path. */
export function getLinkables(path: NodePath): LinkableDictionary {
    const root = path[0];
    let linkables = linkablesCache.get(root);
    if (!linkables) {
        linkables = new LinkableDictionary();
        visit(root, getRecordLinkablesVisitor(linkables));
        linkablesCache.set(root, linkables);
    }
    return linkables;
}

/** Open a frame for every instruction in the path, parents first, so their `provides` resolve injected values. */
export function getProvidedScope(path: NodePath): ProvidedScope {
    return new ProvidedScope(...path.flatMap(node => (isNode(node, 'instructionNode') ? [node.provides ?? []] : [])));
}

/** Create the resolution context of the instruction at the end of the given path. */
export function createResolutionContext<TAccounts extends AccountsInput, TData extends DataInput>(
    instructionPath: NodePath<InstructionNode>,
    inputs: { accountsInput?: TAccounts; dataInput?: TData; fetchAccounts?: FetchAccountsFn },
): ResolutionContext<TAccounts, TData> {
    return {
        accountsInput: inputs.accountsInput,
        dataInput: inputs.dataInput,
        fetchAccounts: inputs.fetchAccounts ? getBatchedFetchAccounts(inputs.fetchAccounts) : undefined,
        instructionPath,
        linkables: getLinkables(instructionPath),
        resolutionPath: [],
        scope: getProvidedScope(instructionPath),
    };
}

/**
 * The address provided for the given account, if any. Throws
 * `UNEXPECTED_ADDRESS_TYPE` when given a list of addresses, which only
 * remaining accounts accept.
 */
export function getAccountInput(
    ctx: Pick<ResolutionContext, 'accountsInput'>,
    accountName: IdentifierString,
): AddressInput | null | undefined {
    const input = ctx.accountsInput?.[accountName];
    if (Array.isArray(input)) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
            accountName,
            actualType: formatValueType(input),
            expectedType: 'Address | PublicKey',
        });
    }
    return input as AddressInput | null | undefined;
}

export function getInstruction(ctx: ResolutionContext): InstructionNode {
    return getLastNodeFromPath(ctx.instructionPath);
}

/** The address of the program defining the node at the end of the given path. */
export function getProgramAddress(path: NodePath): Address {
    const program = findProgramNodeFromPath(path);
    if (!program) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `Cannot find the program of [${path[path.length - 1]?.kind}]: its path must include its program.`,
        });
    }
    return toAddress(program.publicKey);
}

/** Get the raw value of a value node, e.g. `integerValueNode('42')` returns `42n`, resolving injections from the scope. */
export function getValue(
    ctx: Pick<ResolutionContext, 'linkables' | 'scope'>,
    parentPath: NodePath,
    node: ValueNode,
): unknown {
    const valueVisitor = getValueNodeVisitor(ctx.linkables, {
        scope: ctx.scope.clone(),
        stack: new NodeStack(parentPath),
    });
    return visit(node, valueVisitor);
}

/** Encode a value using the codec of the given type, whose links resolve from its parent path. */
export function encodeValue(
    ctx: Pick<ResolutionContext, 'linkables' | 'scope'>,
    parentPath: NodePath,
    type: TypeNode,
    value: unknown,
): ReadonlyUint8Array {
    const codecVisitor = getNodeValueCodecVisitor(ctx.linkables, {
        scope: ctx.scope.clone(),
        stack: new NodeStack(parentPath),
    });
    return visit(type, codecVisitor).encode(value);
}
