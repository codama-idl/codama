import type { Address } from '@solana/addresses';
import { generateKeyPairSigner } from '@solana/kit';

export async function generateAddress(): Promise<Address> {
    const signer = await generateKeyPairSigner();
    return signer.address;
}
