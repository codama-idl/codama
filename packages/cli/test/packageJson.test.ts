import { beforeEach, expect, test, vi } from 'vitest';

import { canRead, resolveRelativePath } from '../src/utils/fs';

vi.mock('../src/utils/fs', () => ({
    canRead: vi.fn(),
    readJson: vi.fn(),
    resolveRelativePath: vi.fn(),
}));

beforeEach(() => {
    vi.resetModules();
    vi.mocked(canRead).mockReset();
    vi.mocked(resolveRelativePath).mockReturnValue('/tmp/codama-no-package-json/package.json');
});

test('returns undefined and no dependencies when package.json is missing', async () => {
    vi.mocked(canRead).mockResolvedValue(false);
    const { getPackageJsonDependencies, tryGetPackageJson } = await import('../src/utils/packageJson');

    await expect(tryGetPackageJson()).resolves.toBeUndefined();
    await expect(getPackageJsonDependencies()).resolves.toEqual([]);
});
