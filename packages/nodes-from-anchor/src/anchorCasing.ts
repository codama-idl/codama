/**
 * Casings reproducing Anchor's own name conversions when it derives
 * discriminators. Anchor hashes these names, so they must stay stable
 * whatever Codama's casing helpers do: a different spelling yields a
 * different hash.
 */

/** Split a name into words the way Anchor's TypeScript client (`change-case`) and `heck` do. */
function getAnchorWords(name: string): string[] {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .split(/[^a-zA-Z0-9]+/)
        .filter(word => word.length > 0);
}

/**
 * The snake_case name Anchor hashes to derive an instruction discriminator
 * (`global:<name>`), e.g. `addConfigLines` → `add_config_lines` and
 * `setHTTPConfig` → `set_http_config`.
 */
export function getAnchorInstructionName(name: string): string {
    return getAnchorWords(name)
        .map(word => word.toLowerCase())
        .join('_');
}

/**
 * The PascalCase struct name Anchor hashes to derive an account or event
 * discriminator (`account:<name>`, `event:<name>`). Anchor uses the Rust
 * struct name as written, so each word only has its first letter
 * capitalised and acronyms are preserved, e.g. `stakeEntry` → `StakeEntry`
 * and `HTTPConfig` → `HTTPConfig`. This mirrors Anchor's TypeScript client,
 * which computes it with `camelcase(name, { pascalCase: true,
 * preserveConsecutiveUppercase: true })`.
 */
export function getAnchorStructName(name: string): string {
    return name
        .split(/[^a-zA-Z0-9]+/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
