import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { hashFileBytes, hashProgramSource, PROGRAMS } from '../../../../scripts/anchor/anchor-build-sync-module.mjs';

const anchorDir = path.resolve(__dirname, '..');
const dumpsDir = path.resolve(anchorDir, '..', 'dumps');
const committedHashes = JSON.parse(
    readFileSync(path.join(anchorDir, 'artifacts', 'anchor-build-sync-hashes.json'), 'utf8'),
) as Record<string, { binary: string; source: string }>;

// This guard proves the committed program source and the committed `.so` binary are mutually consistent with the recorded artifact.
// It does NOT rebuild — a genuine refresh still requires `pnpm anchor:sync:build` with the pinned toolchain (see the anchor README).
// Pure filesystem/crypto guard — nothing platform-specific. Run it once under the Node.
describe.runIf(__NODEJS__)('should keep anchor build dumps in sync with their source', () => {
    test('the artifact records exactly the known PROGRAMS', () => {
        expect(Object.keys(committedHashes).sort()).toStrictEqual([...PROGRAMS].sort());
    });

    test.each(PROGRAMS)('%s source hash matches the committed artifact', program => {
        const actual = hashProgramSource(path.join(anchorDir, 'programs', program));
        expect(
            actual,
            `\`${program}\` source changed but \`dumps/${program}.so\` wasn't rebuilt — run \`pnpm anchor:sync:build\` and commit the refreshed artifacts.`,
        ).toBe(committedHashes[program].source);
    });

    test.each(PROGRAMS)('%s binary hash matches the committed artifact', program => {
        const actual = hashFileBytes(path.join(dumpsDir, `${program}.so`));
        expect(
            actual,
            `\`dumps/${program}.so\` differs from the committed artifact — run \`pnpm anchor:sync:build\` and commit the refreshed \`.so\`.`,
        ).toBe(committedHashes[program].binary);
    });
});
