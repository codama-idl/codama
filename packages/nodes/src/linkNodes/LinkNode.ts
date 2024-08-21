// Link Node Registration.
export const REGISTERED_LINK_NODE_KINDS = [
    'accountLinkNode' as const,
    'definedTypeLinkNode' as const,
    'instructionAccountLinkNode' as const,
    'instructionArgumentLinkNode' as const,
    'instructionLinkNode' as const,
    'pdaLinkNode' as const,
    'programLinkNode' as const,
];

// Link Node Helpers.
export const LINK_NODES = REGISTERED_LINK_NODE_KINDS;
