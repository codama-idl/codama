import type { RegisteredLinkNode } from '@kinobi-so/node-types';

import { REGISTERED_LINK_NODE_KINDS } from '../../src';

// [DESCRIBE] Registered link node kinds.
{
    // It matches exactly with RegisteredLinkNode['kind'].
    {
        REGISTERED_LINK_NODE_KINDS satisfies readonly RegisteredLinkNode['kind'][];
        null as unknown as RegisteredLinkNode['kind'] satisfies (typeof REGISTERED_LINK_NODE_KINDS)[number];
    }
}
