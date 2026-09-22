import type { RegisteredDisplayNode } from '@codama/node-types';

import { REGISTERED_DISPLAY_NODE_KINDS } from '../../src';

// [DESCRIBE] Registered display node kinds.
{
    // It matches exactly with RegisteredDisplayNode['kind'].
    {
        REGISTERED_DISPLAY_NODE_KINDS satisfies readonly RegisteredDisplayNode['kind'][];
        null as unknown as RegisteredDisplayNode['kind'] satisfies (typeof REGISTERED_DISPLAY_NODE_KINDS)[number];
    }
}
