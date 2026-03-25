import { getNodeCodec } from '@codama/dynamic-codecs';
import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
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

import { isConvertibleAddress } from '../../shared/address';
import { getCodecFromBytesEncoding } from '../../shared/bytes-encoding';
import { getMemoizedAddressEncoder, getMemoizedBooleanEncoder, getMemoizedUtf8Codec } from '../../shared/codecs';
import { AccountError } from '../../shared/errors';
import { safeStringify } from '../../shared/util';
import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import type { BaseResolutionContext } from '../resolvers/types';
import { createInputValueTransformer } from './input-value-transformer';

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
): Visitor<
    Promise<ReadonlyUint8Array>,
    | 'accountValueNode'
    | 'argumentValueNode'
    | 'booleanValueNode'
    | 'bytesValueNode'
    | 'constantValueNode'
    | 'noneValueNode'
    | 'numberValueNode'
    | 'programIdValueNode'
    | 'publicKeyValueNode'
    | 'someValueNode'
    | 'stringValueNode'
> {
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
                throw new AccountError(
                    `Cannot resolve dependent account for PDA seed ${node.name} in ${ixNode.name} instruction`,
                );
            }

            return getMemoizedAddressEncoder().encode(resolvedAddress);
        },

        visitArgumentValue: async (node: ArgumentValueNode) => {
            const ixArgumentNode = ixNode.arguments.find(arg => arg.name === node.name);
            if (!ixArgumentNode) {
                throw new AccountError(`Missing instruction argument node for PDA seed: ${node.name}`);
            }
            const argInput = argumentsInput[node.name];

            // Use the PDA seed's declared type (e.g. plain stringTypeNode) rather than
            // the instruction argument's type (e.g. sizePrefixTypeNode) so the seed
            // bytes match what the on-chain program derives.
            const typeNode = seedTypeNode ?? ixArgumentNode.type;

            if (argInput === undefined || argInput === null) {
                // optional remainderOptionTypeNode seeds encodes to zero bytes.
                if (isNode(typeNode, 'remainderOptionTypeNode')) {
                    return new Uint8Array(0);
                }
                throw new AccountError(`Missing argument for PDA seed ${node.name} in ${ixNode.name} instruction`);
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
                throw new AccountError(`Unsupported constant PDA seed value: ${innerNode.kind}`);
            });
        },

        visitNoneValue: async (_node: NoneValueNode) => await Promise.resolve(new Uint8Array(0)),

        visitNumberValue: async (node: NumberValueNode) => {
            if (!Number.isInteger(node.number) || node.number < 0 || node.number > 0xff) {
                throw new AccountError(
                    `NumberValueNode seed value ${node.number} cannot be encoded as a single byte. ` +
                        `Expected an integer in range [0, 255].`,
                );
            }
            return await Promise.resolve(new Uint8Array([node.number]));
        },

        visitProgramIdValue: async (_node: ProgramIdValueNode) => {
            if (!isConvertibleAddress(programId)) {
                throw new AccountError(
                    `Expected base58-encoded Address for programId, got: ${safeStringify(programId)}`,
                );
            }
            return await Promise.resolve(getMemoizedAddressEncoder().encode(address(programId)));
        },

        visitPublicKeyValue: async (node: PublicKeyValueNode) => {
            if (!isConvertibleAddress(node.publicKey)) {
                throw new AccountError(`Expected base58-encoded Address, got: ${safeStringify(node.publicKey)}`);
            }
            return await Promise.resolve(getMemoizedAddressEncoder().encode(address(node.publicKey)));
        },

        visitSomeValue: async (node: SomeValueNode) => {
            const innerVisitor = createPdaSeedValueVisitor(ctx);
            return await visitOrElse(node.value, innerVisitor, innerNode => {
                throw new AccountError(`Unsupported some PDA seed value: ${innerNode.kind}`);
            });
        },

        visitStringValue: async (node: StringValueNode) =>
            await Promise.resolve(getMemoizedUtf8Codec().encode(node.string)),
    };
}
