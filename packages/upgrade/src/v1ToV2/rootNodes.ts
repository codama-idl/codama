import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { V2_VERSION } from '../v2';
import {
    accountNodeFromV1,
    constantNodeFromV1,
    definedTypeNodeFromV1,
    errorNodeFromV1,
    eventNodeFromV1,
} from './definitionNodes';
import { instructionNodeFromV1 } from './instructionNodes';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { pdaNodeFromV1 } from './pdaNodes';
import { compactAndFreeze, docsFromV1, identifierFromV1 } from './shared';

/**
 * Upgrade a Codama IDL from v1 to v2, stamping it with the latest v2 spec
 * version. Use {@link upgrade} to upgrade IDLs of any major to the latest
 * one; this function only bundles the v1 to v2 step.
 *
 * Information v2 cannot express in the IDL itself moves into the official
 * `codama.*` plugins, e.g. resolvers become `codama.resolver` plugins.
 *
 * @param root - The v1 IDL to upgrade.
 * @return The v2 IDL, frozen.
 * @throws `CODAMA_ERROR__INVALID_BRANDED_STRING` for v1 names that are not
 * valid v2 identifiers once their dashes are replaced with underscores.
 *
 * @example
 * ```ts
 * import { upgradeV1ToV2 } from '@codama/upgrade';
 *
 * const v2Root = upgradeV1ToV2(v1Root);
 * ```
 */
export function upgradeV1ToV2(root: v1.RootNode): v2.RootNode {
    return compactAndFreeze({
        kind: 'rootNode',
        standard: 'codama',
        version: V2_VERSION,
        program: programNodeFromV1([root, root.program]),
        additionalPrograms: root.additionalPrograms?.map(program => programNodeFromV1([root, program])),
    });
}

/** Convert a v1 program. Its `origin` is dropped, since v2 programs have none. */
export function programNodeFromV1(path: V1NodePath<v1.ProgramNode>): v2.ProgramNode {
    const program = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'programNode',
        identifier: identifierFromV1(program.name),
        publicKey: program.publicKey,
        version: program.version,
        docs: docsFromV1(program.docs),
        accounts: program.accounts?.map(account => accountNodeFromV1([...path, account])),
        instructions: program.instructions?.map(instruction => instructionNodeFromV1([...path, instruction])),
        definedTypes: program.definedTypes?.map(definedType => definedTypeNodeFromV1([...path, definedType])),
        pdas: program.pdas?.map(pda => pdaNodeFromV1([...path, pda])),
        events: program.events?.map(event => eventNodeFromV1([...path, event])),
        errors: program.errors?.map(errorNodeFromV1),
        constants: program.constants?.map(constant => constantNodeFromV1([...path, constant])),
    });
}
