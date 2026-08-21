import type { RootNode } from '@codama/nodes';

import { upgrade, UpgradableRootNode } from './upgrade';

/**
 * Parses a JSON-encoded Codama document and upgrades it to the latest
 * major via {@link upgrade}.
 */
export function upgradeFromJson(json: string): RootNode {
    return upgrade(JSON.parse(json) as UpgradableRootNode);
}
