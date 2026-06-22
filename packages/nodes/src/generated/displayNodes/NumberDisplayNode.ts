/** The presentation forms a number may take. Raw rendering is expressed by the absence of a display attribute. */
export const NUMBER_DISPLAY_NODE_KINDS = [
    'amountNumberDisplayNode' as const,
    'dateTimeNumberDisplayNode' as const,
    'durationNumberDisplayNode' as const,
];
