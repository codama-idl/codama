import type { RegisteredTypeNode } from '@codama/node-types';

import { REGISTERED_TYPE_NODE_KINDS } from '../../src';

// [DESCRIBE] Registered value node kinds.
{
    // It matches exactly with RegisteredTypeNode['kind'].
    {
        REGISTERED_TYPE_NODE_KINDS satisfies readonly RegisteredTypeNode['kind'][];
        null as unknown as RegisteredTypeNode['kind'] satisfies (typeof REGISTERED_TYPE_NODE_KINDS)[number];
    }
}
