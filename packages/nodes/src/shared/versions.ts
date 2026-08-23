/**
 * Extracts the major version from a Codama version string, e.g. `1` from
 * `'1.9.1'` or `2` from `'2.0.0-rc.4'`.
 *
 * Defensive against arbitrary input — IDLs usually arrive as untrusted
 * JSON — and returns `null` when no major version can be parsed, so callers
 * decide how to fail. Useful for cross-major compatibility checks: two Codama
 * versions are compatible if and only if their majors match.
 */
export function getCodamaVersionMajor(version: string): number | null {
    const match = /^(\d+)\./.exec(version);
    return match ? Number(match[1]) : null;
}
