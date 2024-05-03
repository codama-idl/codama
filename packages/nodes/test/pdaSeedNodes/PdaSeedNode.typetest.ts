import type { RegisteredPdaSeedNode } from '@kinobi-so/node-types';

import { REGISTERED_PDA_SEED_NODE_KINDS } from '../../src';

// [DESCRIBE] Registered pda seed node kinds.
{
    // It matches exactly with RegisteredPdaSeedNode['kind'].
    {
        REGISTERED_PDA_SEED_NODE_KINDS satisfies readonly RegisteredPdaSeedNode['kind'][];
        null as unknown as RegisteredPdaSeedNode['kind'] satisfies (typeof REGISTERED_PDA_SEED_NODE_KINDS)[number];
    }
}
