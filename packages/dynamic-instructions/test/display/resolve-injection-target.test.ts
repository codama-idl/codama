import {
    accountFieldValueNode,
    accountValueNode,
    injectedValueNode,
    numberValueNode,
    type ProvidedNode,
    providedNode,
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveInjectionTarget } from '../../src/display/resolve-injection-target';

/** Builds a `provides` map from a list of `providedNode`s, keyed by the name each exposes. */
function providesMap(...entries: ProvidedNode[]): ReadonlyMap<string, ProvidedNode> {
    return new Map(entries.map(entry => [entry.name, entry]));
}

describe('resolveInjectionTarget', () => {
    test('it returns a non-injection node unchanged', () => {
        // Given a node that is already terminal.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });

        // When we resolve it against any providers.
        const target = resolveInjectionTarget(node, providesMap());

        // Then the same node comes back.
        expect(target).toBe(node);
    });

    test('it resolves an injection to its matching provider', () => {
        // Given `decimals` provided by an account field.
        const provider = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const provides = providesMap(providedNode('decimals', provider));

        // When we resolve the injection.
        const target = resolveInjectionTarget(injectedValueNode({ key: 'decimals' }), provides);

        // Then we reach the provider node.
        expect(target).toBe(provider);
    });

    test('it prefers the provider over the fallback', () => {
        // Given `decimals` has both a provider and a fallback.
        const provider = numberValueNode(6);
        const provides = providesMap(providedNode('decimals', provider));
        const node = injectedValueNode({ fallback: numberValueNode(9), key: 'decimals' });

        // When we resolve it.
        const target = resolveInjectionTarget(node, provides);

        // Then the provider wins and the fallback is ignored.
        expect(target).toBe(provider);
    });

    test('it uses the fallback when no provider supplies the key', () => {
        // Given `decimals` has no provider but a fallback.
        const fallback = numberValueNode(6);
        const node = injectedValueNode({ fallback, key: 'decimals' });

        // When we resolve it.
        const target = resolveInjectionTarget(node, providesMap());

        // Then the fallback is selected.
        expect(target).toBe(fallback);
    });

    test('it follows a fallback that injects another key', () => {
        // Given `decimals` falls back to injecting `mintDecimals`, itself an account field.
        const terminal = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const provides = providesMap(providedNode('mintDecimals', terminal));
        const node = injectedValueNode({ fallback: injectedValueNode({ key: 'mintDecimals' }), key: 'decimals' });

        // When we resolve it.
        const target = resolveInjectionTarget(node, provides);

        // Then we reach the account field through the fallback chain.
        expect(target).toBe(terminal);
    });

    test('it follows a provider chain to its terminal', () => {
        // Given `decimals` provided by re-injecting `mintDecimals`, itself an account field.
        const terminal = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const provides = providesMap(
            providedNode('decimals', injectedValueNode({ key: 'mintDecimals' })),
            providedNode('mintDecimals', terminal),
        );

        // When we resolve the head of the chain.
        const target = resolveInjectionTarget(injectedValueNode({ key: 'decimals' }), provides);

        // Then the chain collapses to the account field.
        expect(target).toBe(terminal);
    });

    test('it resolves to null when the injection has neither provider nor fallback', () => {
        // Given an unsatisfied injection.
        const node = injectedValueNode({ key: 'decimals' });

        // When we resolve it.
        const target = resolveInjectionTarget(node, providesMap());

        // Then it is unresolved.
        expect(target).toBeNull();
    });

    test('it terminates a self-referential provider cycle at null', () => {
        // Given `decimals` provided by re-injecting itself.
        const provides = providesMap(providedNode('decimals', injectedValueNode({ key: 'decimals' })));

        // When we resolve it.
        const target = resolveInjectionTarget(injectedValueNode({ key: 'decimals' }), provides);

        // Then the cycle guard stops the walk and yields null.
        expect(target).toBeNull();
    });

    test('it terminates a mutual provider cycle at null', () => {
        // Given `a` provides `b` and `b` provides `a`.
        const provides = providesMap(
            providedNode('a', injectedValueNode({ key: 'b' })),
            providedNode('b', injectedValueNode({ key: 'a' })),
        );

        // When we resolve one end.
        const target = resolveInjectionTarget(injectedValueNode({ key: 'a' }), provides);

        // Then the mutual cycle is broken and yields null.
        expect(target).toBeNull();
    });

    test('it resolves a provider that names an account directly', () => {
        // Given `owner` provided by an account reference (no fetch needed downstream).
        const provider = accountValueNode('owner');
        const provides = providesMap(providedNode('owner', provider));

        // When we resolve it.
        const target = resolveInjectionTarget(injectedValueNode({ key: 'owner' }), provides);

        // Then we reach the account reference.
        expect(target).toBe(provider);
    });

    test('it resolves a literal string provider', () => {
        // Given a `symbol` provided by a literal.
        const provider = stringValueNode('USDC');
        const provides = providesMap(providedNode('symbol', provider));

        // When we resolve it.
        const target = resolveInjectionTarget(injectedValueNode({ key: 'symbol' }), provides);

        // Then the literal is the terminal.
        expect(target).toBe(provider);
    });
});
