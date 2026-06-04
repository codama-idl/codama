import { syncAnchorBuilds } from './anchor-build-sync-module.mjs';

try {
    const { hashes, artifactPath } = syncAnchorBuilds();
    console.log(`Wrote ${artifactPath}`);
    for (const [program, hash] of Object.entries(hashes)) {
        console.log(`  ${program}: ${hash}`);
    }
} catch (error) {
    console.error('[sync-anchor-builds] Failed to sync anchor builds!');
    console.error(error);
    process.exitCode = 1;
}
