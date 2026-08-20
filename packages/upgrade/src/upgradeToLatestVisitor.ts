import type { RootNode } from '@codama/nodes';
import { rootNodeVisitor, Visitor } from '@codama/visitors-core';

import { upgrade, UpgradableRootNode } from './upgrade';

/**
 * A visitor that upgrades the visited document to the latest major via
 * {@link upgrade}.
 *
 * Designed as a preprocessing step at IDL-ingestion boundaries — e.g. as a
 * `before` visitor in a Codama CLI config. It is also the package's default
 * export, so the bare module name resolves to it:
 *
 * ```json
 * { "idl": "program/idl.json", "before": ["@codama/upgrade"] }
 * ```
 */
export function upgradeToLatestVisitor(): Visitor<RootNode, 'rootNode'> {
    return rootNodeVisitor(root => upgrade(root as UpgradableRootNode));
}
