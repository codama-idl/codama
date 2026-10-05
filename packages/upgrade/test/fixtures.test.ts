import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CODAMA_VERSION, getCodamaVersionMajor } from '@codama/nodes';
import { getValidationItemsVisitor } from '@codama/validators';
import { identityVisitor, visit } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import { upgrade, UpgradableRootNode, upgradeFromJson, upgradeV1ToV2 } from '../src';
import { V2_VERSION } from '../src/v2';

/**
 * Fixtures are small IDLs named `<name>-v<major>.json`, one file per major
 * they exist in, e.g. `types-v1.json` and `types-v2.json`. For each name,
 * every step upgrades a fixture into the fixture of the next major, and
 * `upgrade` brings every fixture to the one of the latest major.
 */
const FIXTURES_DIRECTORY = join(__dirname, 'fixtures');

/** The single-major upgrade steps, by the major they upgrade from, with the version they stamp. */
const STEPS: Record<number, { upgrade: (root: never) => object; version: string }> = {
    1: { upgrade: upgradeV1ToV2, version: V2_VERSION },
};

const LATEST_MAJOR = getCodamaVersionMajor(CODAMA_VERSION) as number;

/** The majors of each fixture name, e.g. `{ types: [1, 2] }`. */
const FIXTURES = readdirSync(FIXTURES_DIRECTORY).reduce<Record<string, number[]>>((fixtures, file) => {
    const match = /^(.+)-v(\d+)\.json$/.exec(file);
    if (!match) return fixtures;
    const [, name, major] = match;
    fixtures[name] = [...(fixtures[name] ?? []), Number(major)].sort((a, b) => a - b);
    return fixtures;
}, {});

function readFixture(name: string, major: number): string {
    return readFileSync(join(FIXTURES_DIRECTORY, `${name}-v${major}.json`), 'utf8');
}

function parseFixture(name: string, major: number): UpgradableRootNode {
    return JSON.parse(readFixture(name, major)) as UpgradableRootNode;
}

/** A fixture without its version, which upgrades stamp independently. */
function withoutVersion(root: object): object {
    return { ...root, version: undefined };
}

/**
 * The JSON text of an IDL without its version. Unlike `toStrictEqual`, this
 * also checks that attributes are serialised in spec order, as natively
 * written IDLs are.
 */
function toJson(root: object): string {
    return JSON.stringify(withoutVersion(root), null, 4);
}

test('it finds fixtures', () => {
    expect(Object.keys(FIXTURES)).not.toHaveLength(0);
});

test('it has an upgrade step for every major below the latest', () => {
    const majors = Array.from({ length: LATEST_MAJOR - 1 }, (_, index) => index + 1);
    expect(Object.keys(STEPS).map(Number)).toStrictEqual(majors);
});

describe.each(Object.keys(FIXTURES))('fixture "%s"', name => {
    const majors = FIXTURES[name];
    const pairs = majors.slice(0, -1).map((major, index) => [major, majors[index + 1]] as const);

    test('it exists in the latest major', () => {
        expect(majors.at(-1)).toBe(LATEST_MAJOR);
    });

    test.each(pairs)('it upgrades from v%i to v%i in one step', (from, to) => {
        expect(to).toBe(from + 1);
        const step = STEPS[from];
        const upgraded = step.upgrade(parseFixture(name, from) as never) as { version: string };
        expect(upgraded.version).toBe(step.version);
        expect(withoutVersion(upgraded)).toStrictEqual(withoutVersion(parseFixture(name, to)));
        expect(toJson(upgraded)).toBe(toJson(parseFixture(name, to)));
        expect(getUnfrozenPaths(upgraded)).toStrictEqual([]);
    });

    test.each(majors.slice(0, -1))('it upgrades from v%i to the latest major', from => {
        const upgraded = upgradeFromJson(readFixture(name, from));
        expect(upgraded.version).toBe(CODAMA_VERSION);
        expect(withoutVersion(upgraded)).toStrictEqual(withoutVersion(parseFixture(name, LATEST_MAJOR)));
        expect(toJson(upgraded)).toBe(toJson(parseFixture(name, LATEST_MAJOR)));
        expect(getUnfrozenPaths(upgraded)).toStrictEqual([]);
    });

    test('its latest major is a valid IDL', () => {
        const root = upgrade(parseFixture(name, LATEST_MAJOR));
        expect(() => visit(root, identityVisitor())).not.toThrow();
        const errors = visit(root, getValidationItemsVisitor()).filter(item => item.level === 'error');
        expect(errors.map(item => item.cause ?? item.message)).toStrictEqual([]);
    });
});

/** The paths of every object or array of the given value that is not frozen, without looking into plugin payloads. */
function getUnfrozenPaths(value: unknown, path = 'root'): string[] {
    if (typeof value !== 'object' || value === null) return [];
    const own = Object.isFrozen(value) ? [] : [path];
    const children = Object.entries(value)
        .filter(([key]) => key !== 'payload')
        .flatMap(([key, child]) => getUnfrozenPaths(child, `${path}.${key}`));
    return [...own, ...children];
}
