import type { RegisteredCountNode } from '@kinobi-so/node-types';

import { REGISTERED_COUNT_NODE_KINDS } from '../../src/index.js';

// [DESCRIBE] Registered count node kinds.
{
    // It matches exactly with RegisteredCountNode['kind'].
    {
        REGISTERED_COUNT_NODE_KINDS satisfies readonly RegisteredCountNode['kind'][];
        null as unknown as RegisteredCountNode['kind'] satisfies (typeof REGISTERED_COUNT_NODE_KINDS)[number];
    }
}
