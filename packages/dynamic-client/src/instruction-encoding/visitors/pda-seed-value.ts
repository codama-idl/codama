import { getNodeCodec } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type {
    AccountValueNode,
    ArgumentValueNode,
    BooleanValueNode,
    BytesValueNode,
    ConstantValueNode,
    NoneValueNode,
    NumberValueNode,
    ProgramIdValueNode,
    PublicKeyValueNode,
    SomeValueNode,
    StringValueNode,
    TypeNode,
    Visitor,
} from 'codama';
import { isNode, visitOrElse } from 'codama';

import { toAddress } from '../../shared/address';
import { getCodecFromBytesEncoding } from '../../shared/bytes-encoding';
import { getMemoizedAddressEncoder, getMemoizedBooleanEncoder, getMemoizedUtf8Codec } from '../../shared/codecs';
import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import type { BaseResolutionContext } from '../resolvers/types';
import { createInputValueTransformer } from './input-value-transformer';
import { formatArgumentPathSuffix, resolveArgumentPathType, resolveArgumentPathValue } from './resolve-argument-path';

export const PDA_SEED_VALUE_SUPPORTED_NODE_KINDS = [
    'accountValueNode',
    'argumentValueNode',
    'booleanValueNode',
    'bytesValueNode',
    'constantValueNode',
    'noneValueNode',
    'numberValueNode',
    'programIdValueNode',
    'publicKeyValueNode',
    'someValueNode',
    'stringValueNode',
] as const;

type PdaSeedValueSupportedNodeKind = (typeof PDA_SEED_VALUE_SUPPORTED_NODE_KINDS)[number];

type PdaSeedValueVisitorContext = BaseResolutionContext & {
    programId: Address;
    seedTypeNode?: TypeNode;
};

/**
 * Visitor for resolving PdaSeedValueNode value to raw bytes.
 * Supports recursive resolution of dependent PDAs (accounts that are themselves auto-derived PDAs).
 * This is used for both:
 * - Variable seeds (e.g. seeds based on instruction accounts/arguments), and
 * - Constant seeds (e.g. bytes/string/programId/publicKey constants).
 */
export function createPdaSeedValueVisitor(
    ctx: PdaSeedValueVisitorContext,
): Visitor<Promise<ReadonlyUint8Array>, PdaSeedValueSupportedNodeKind> {
    const { root, ixNode, programId, seedTypeNode, resolversInput, resolutionPath } = ctx;
    const accountsInput = ctx.accountsInput ?? {};
    const argumentsInput = ctx.argumentsInput ?? {};

    return {
        visitAccountValue: async (node: AccountValueNode) => {
            const resolvedAddress = await resolveAccountValueNodeAddress(node, {
                accountsInput,
                argumentsInput,
                ixNode,
                resolutionPath,
                resolversInput,
                root,
            });

            if (resolvedAddress === null) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, {
                    accountName: node.name,
                });
            }

            return getMemoizedAddressEncoder().encode(resolvedAddress);
        },

        visitArgumentValue: async (node: ArgumentValueNode) => {
            const ixArgumentNode = ixNode.arguments.find(arg => arg.name === node.name);
            if (!ixArgumentNode) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
                    instructionName: ixNode.name,
                    referencedName: node.name,
                });
            }

            const argFieldType =
                node.path && node.path.length > 0
                    ? resolveArgumentPathType(ixArgumentNode.type, node.path, root, node.name)
                    : ixArgumentNode.type;
            const argInput =
                node.path && node.path.length > 0
                    ? resolveArgumentPathValue(argumentsInput[node.name], node.path, node.name, ixNode.name)
                    : argumentsInput[node.name];

            // Use the PDA seed's declared type (e.g. plain stringTypeNode) rather than
            // the (nested) instruction argument's type (e.g. sizePrefixTypeNode) so the
            // seed bytes match what the on-chain program derives.
            const typeNode = seedTypeNode ?? argFieldType;

            if (argInput === undefined || argInput === null) {
                // optional remainderOptionTypeNode seeds encodes to zero bytes.
                if (isNode(typeNode, 'remainderOptionTypeNode')) {
                    return new Uint8Array(0);
                }
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING, {
                    argumentName: node.name,
                    argumentPath: formatArgumentPathSuffix(node.path ?? []),
                    instructionName: ixNode.name,
                });
            }
            const codec = getNodeCodec([root, root.program, ixNode, { ...ixArgumentNode, type: typeNode }]);
            const transformer = createInputValueTransformer(typeNode, root, {
                bytesEncoding: 'base16',
            });
            const transformedInput = transformer(argInput);
            return await Promise.resolve(codec.encode(transformedInput));
        },

        visitBooleanValue: async (node: BooleanValueNode) =>
            await Promise.resolve(getMemoizedBooleanEncoder().encode(node.boolean)),

        visitBytesValue: async (node: BytesValueNode) => {
            const encodedValue = getCodecFromBytesEncoding(node.encoding).encode(node.data);
            return await Promise.resolve(encodedValue);
        },

        visitConstantValue: async (node: ConstantValueNode) => {
            const innerVisitor = createPdaSeedValueVisitor(ctx);
            return await visitOrElse(node.value, innerVisitor, innerNode => {
                throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [...PDA_SEED_VALUE_SUPPORTED_NODE_KINDS],
                    kind: innerNode.kind,
                    node: innerNode,
                });
            });
        },

        visitNoneValue: async (_node: NoneValueNode) => await Promise.resolve(new Uint8Array(0)),

        visitNumberValue: async (node: NumberValueNode) => {
            // Sanity check: a violation here indicates a malformed IDL, not a user input error.
            if (!Number.isInteger(node.number) || node.number < 0 || node.number > 0xff) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
                    message: `NumberValueNode PDA seed is out of range: must be a valid u8 (0–255), got ${node.number}`,
                });
            }
            return await Promise.resolve(new Uint8Array([node.number]));
        },

        visitProgramIdValue: async (_node: ProgramIdValueNode) => {
            return await Promise.resolve(getMemoizedAddressEncoder().encode(toAddress(programId)));
        },

        visitPublicKeyValue: async (node: PublicKeyValueNode) => {
            return await Promise.resolve(getMemoizedAddressEncoder().encode(toAddress(node.publicKey)));
        },

        visitSomeValue: async (node: SomeValueNode) => {
            const innerVisitor = createPdaSeedValueVisitor(ctx);
            return await visitOrElse(node.value, innerVisitor, innerNode => {
                throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [...PDA_SEED_VALUE_SUPPORTED_NODE_KINDS],
                    kind: innerNode.kind,
                    node: innerNode,
                });
            });
        },

        visitStringValue: async (node: StringValueNode) =>
            await Promise.resolve(getMemoizedUtf8Codec().encode(node.string)),
    };
}
