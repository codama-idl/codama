import { CODAMA_ERROR__UNSUPPORTED_VERSION, CODAMA_ERROR__VERSION_MISMATCH, CodamaError } from '@codama/errors';
import { assertIsNode, CODAMA_VERSION, getCodamaVersionMajor, Node, RootNode } from '@codama/nodes';

import type * as v1 from './v1';

/**
 * Any Codama IDL that {@link upgrade} can bring to the latest major —
 * the union of every supported major's `RootNode` shape. Grows by one
 * member per frozen major.
 */
export type UpgradableRootNode = RootNode | v1.RootNode;

/**
 * Upgrades a Codama IDL of any supported major to the latest major
 * and restamps it with the latest `CODAMA_VERSION`.
 *
 * Each supported major is bridged by a pure, hand-written function
 * upgrading exactly one major to the next; the chain is append-only, so
 * every major back to 1.0.0 remains upgradable forever. IDLs already
 * on the latest major go through unchanged, minus the version restamp.
 * Pre-1.0 IDLs are refused with `CODAMA_ERROR__UNSUPPORTED_VERSION`;
 * IDLs above the latest supported major are refused with
 * `CODAMA_ERROR__VERSION_MISMATCH`.
 */
export function upgrade(root: UpgradableRootNode): RootNode {
    const node = root as Node | null | undefined;
    assertIsNode(node, 'rootNode');
    const version = typeof node.version === 'string' ? node.version : '';
    const major = getCodamaVersionMajor(version);
    if (major === null || major < 1) {
        throw new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version });
    }

    // `CODAMA_VERSION` is generated from the spec, so its major always parses.
    const latestMajor = getCodamaVersionMajor(CODAMA_VERSION) as number;
    if (major > latestMajor) {
        throw new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: version });
    }

    let current: unknown = node;
    // One line per major, each running a pure, hand-written function that
    // upgrades exactly one major to the next. For example, once v2 ships:
    // if (major <= 1) current = upgradeV1ToV2(current as v1.RootNode);

    // Every block above upgraded one major, so `current` now has the
    // latest shape.
    return Object.freeze({ ...(current as RootNode), version: CODAMA_VERSION });
}
