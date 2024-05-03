import type { RegisteredDiscriminatorNode } from '@kinobi-so/node-types';

import { REGISTERED_DISCRIMINATOR_NODE_KINDS } from '../../src';

// [DESCRIBE] Registered discriminator node kinds.
{
    // It matches exactly with RegisteredDiscriminatorNode['kind'].
    {
        REGISTERED_DISCRIMINATOR_NODE_KINDS satisfies readonly RegisteredDiscriminatorNode['kind'][];
        null as unknown as RegisteredDiscriminatorNode['kind'] satisfies (typeof REGISTERED_DISCRIMINATOR_NODE_KINDS)[number];
    }
}
