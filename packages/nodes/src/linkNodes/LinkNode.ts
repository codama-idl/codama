// Link Node Registration.
export const REGISTERED_LINK_NODE_KINDS = [
    'programLinkNode' as const,
    'pdaLinkNode' as const,
    'accountLinkNode' as const,
    'definedTypeLinkNode' as const,
    'instructionLinkNode' as const,
    'instructionAccountLinkNode' as const,
    'instructionArgumentLinkNode' as const,
];

// Link Node Helpers.
export const LINK_NODES = REGISTERED_LINK_NODE_KINDS;
