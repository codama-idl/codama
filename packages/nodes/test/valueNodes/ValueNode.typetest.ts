import type { RegisteredValueNode } from '@codama/node-types';

import { REGISTERED_VALUE_NODE_KINDS } from '../../src';

// [DESCRIBE] Registered value node kinds.
{
    // It matches exactly with RegisteredValueNode['kind'].
    {
        REGISTERED_VALUE_NODE_KINDS satisfies readonly RegisteredValueNode['kind'][];
        null as unknown as RegisteredValueNode['kind'] satisfies (typeof REGISTERED_VALUE_NODE_KINDS)[number];
    }
}
