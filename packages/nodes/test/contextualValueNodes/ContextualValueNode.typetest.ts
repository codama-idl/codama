import type { RegisteredContextualValueNode } from '@kinobi-so/node-types';

import { REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS } from '../../src/index.js';

// [DESCRIBE] Registered contextual value node kinds.
{
    // It matches exactly with RegisteredContextualValueNode['kind'].
    {
        REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS satisfies readonly RegisteredContextualValueNode['kind'][];
        null as unknown as RegisteredContextualValueNode['kind'] satisfies (typeof REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS)[number];
    }
}
