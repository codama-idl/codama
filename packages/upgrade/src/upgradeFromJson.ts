import type { RootNode } from '@codama/nodes';

import { UpgradableRootNode, upgrade } from './upgrade';

/**
 * Parses a JSON-encoded Codama IDL and upgrades it to the latest
 * major via {@link upgrade}.
 */
export function upgradeFromJson(json: string): RootNode {
    return upgrade(JSON.parse(json) as UpgradableRootNode);
}
