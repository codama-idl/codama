import { snakeCase } from '@codama/fragments/javascript';

/** `StandaloneTypeNode` → `STANDALONE_TYPE_NODE_KINDS`. */
export function kindsArrayConstantName(unionName: string): string {
    return `${snakeCase(unionName).toUpperCase()}_KINDS`;
}
