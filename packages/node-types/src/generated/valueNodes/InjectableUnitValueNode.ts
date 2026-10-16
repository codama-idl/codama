import type { InjectedValueNode } from './InjectedValueNode';
import type { PublicKeyValueNode } from './PublicKeyValueNode';
import type { StringValueNode } from './StringValueNode';

/**
 * A unit of measure: a concrete string (e.g. `"USDC"`), a concrete address (e.g. a token mint), or a key resolved at presentation time from a surrounding provider to either — e.g. an instruction account's address provided as `providedNode('mint', accountValueNode('mint'))`, or any other contextual value resolving to an address.
 * Address units are presented under whatever name renderers know for the address (e.g. a token symbol or an alias), and as the address itself otherwise. The `identifier` of a `publicKeyValueNode` is a code symbol, not a display name.
 */
export type InjectableUnitValueNode = InjectedValueNode | PublicKeyValueNode | StringValueNode;
