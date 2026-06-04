import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const PROGRAMS = ['example', 'blog'];

/**
 * Copies the freshly built `.so` files into the committed `dumps/` directory, ensuring the `dumps/`
 * and `artifacts/` directories exist, and writes the artifact file mapping each program to its
 * `{ source, binary }` hashes.
 *
 * @param {string} [packageRoot] Defaults to `process.cwd()` (the package root when invoked via a pnpm script).
 * @returns {{ hashes: Record<ProgramName, { source: string, binary: string }>, artifactPath: string }}
 */
export function syncAnchorBuilds(packageRoot = process.cwd()) {
    const anchorPath = path.join(packageRoot, 'test', 'programs', 'anchor');
    const binariesPath = path.join(anchorPath, 'target', 'deploy');
    const dumpsPath = path.join(packageRoot, 'test', 'programs', 'dumps');
    const artifactsPath = path.join(anchorPath, 'artifacts');
    const outArtifactPath = path.join(artifactsPath, 'anchor-build-sync-hashes.json');

    const missing = PROGRAMS.map(program => path.join(binariesPath, `${program}.so`)).filter(
        soPath => !existsSync(soPath),
    );
    if (missing.length > 0) {
        throw new Error(
            `Missing build artifact(s):\n  ${missing.join('\n  ')}\n` + 'Run `pnpm anchor:build` before syncing.',
        );
    }

    mkdirSync(dumpsPath, { recursive: true });
    mkdirSync(artifactsPath, { recursive: true });

    const hashes = {};
    for (const program of PROGRAMS) {
        const builtSoPath = path.join(binariesPath, `${program}.so`);
        copyFileSync(builtSoPath, path.join(dumpsPath, `${program}.so`));
        hashes[program] = {
            binary: hashFileBytes(builtSoPath),
            source: hashProgramSource(path.join(anchorPath, 'programs', program)),
        };
    }

    // Sort program names for consistency.
    const sorted = Object.fromEntries(
        Object.keys(hashes)
            .sort()
            .map(key => [key, hashes[key]]),
    );
    writeFileSync(outArtifactPath, JSON.stringify(sorted, null, 4) + '\n');
    return { hashes: sorted, artifactPath: outArtifactPath };
}

/**
 * Deterministic SHA-256 of a program's build-affecting source inputs.
 *
 * The digest is taken over sorted `(relativePath, content)` entries:
 *   - `relativePath` is taken relative to the anchor root and normalized to forward
 *     slashes, so the digest is identical across OSes but still sensitive to a file's
 *     *name and location*. Renaming `.rs` or moving a module changes the
 *     digest even when the bytes are unchanged.
 *   - `content` is CRLF -> LF normalized so line endings don't affect the digest.
 *   - sorting by `relativePath` makes the digest independent of filesystem read order.
 *
 * @param {string} programDir Absolute path to `programs/<name>`.
 * @returns {string} lowercase hex SHA-256.
 */
export function hashProgramSource(programDir) {
    const srcPath = path.join(programDir, 'src');
    if (!existsSync(srcPath) || !statSync(srcPath).isDirectory()) {
        throw new Error(`[hashProgramSource] source directory not found: ${srcPath}`);
    }

    const anchorRoot = path.resolve(programDir, '..', '..'); // .../test/programs/anchor
    const srcFiles = readdirSync(srcPath, { recursive: true })
        .map(entry => path.join(srcPath, entry.toString()))
        .filter(file => file.endsWith('.rs'));

    const inputs = [
        ...srcFiles,
        path.join(programDir, 'Cargo.toml'),
        path.join(anchorRoot, 'Cargo.toml'),
        path.join(anchorRoot, 'Anchor.toml'),
        path.join(anchorRoot, 'Cargo.lock'),
    ];
    for (const file of inputs) {
        if (!existsSync(file)) {
            throw new Error(`[hashProgramSource] required input is missing: ${file}`);
        }
    }

    const entries = inputs
        .map(file => ({
            content: readFileSync(file, 'utf8').replace(/\r\n/g, '\n'),
            relPath: path.relative(anchorRoot, file).split(path.sep).join('/'),
        }))
        .sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));

    const hash = createHash('sha256');
    for (const { relPath, content } of entries) {
        hash.update(relPath);
        hash.update('\0');
        hash.update(content);
        hash.update('\0');
    }
    return hash.digest('hex');
}

export function hashFileBytes(filePath) {
    return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}
