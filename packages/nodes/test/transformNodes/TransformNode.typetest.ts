import type { TransformNode } from '@codama/node-types';

import { TRANSFORM_NODE_KINDS } from '../../src';

// [DESCRIBE] Transform node kinds.
{
    // It matches exactly with TransformNode['kind'].
    {
        TRANSFORM_NODE_KINDS satisfies readonly TransformNode['kind'][];
        null as unknown as TransformNode['kind'] satisfies (typeof TRANSFORM_NODE_KINDS)[number];
    }
}
