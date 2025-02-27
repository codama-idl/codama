import {
  type Address,
  type Commitment,
  type CompilableTransactionMessage,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionMessageWithBlockhashLifetime,
  type TransactionSigner,
  airdropFactory,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/kit';
import {
  TOKEN_PROGRAM_ADDRESS,
  getCreateAccountInstruction,
  getInitializeAccountInstruction,
  getInitializeMintInstruction,
  getMintSize,
  getMintToInstruction,
  getTokenSize,
} from '../src/index.js';

type Client = {
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

export const createDefaultSolanaClient = (): Client => {
  const rpc = createSolanaRpc('http://127.0.0.1:8899');
  const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');
  return { rpc, rpcSubscriptions };
};

export const generateKeyPairSignerWithSol = async (
  client: Client,
  putativeLamports: bigint = 1_000_000_000n
) => {
  const signer = await generateKeyPairSigner();
  await airdropFactory(client)({
    recipientAddress: signer.address,
    lamports: lamports(putativeLamports),
    commitment: 'confirmed',
  });
  return signer;
};

export const createDefaultTransaction = async (
  client: Client,
  feePayer: TransactionSigner
) => {
  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();
  return pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
  );
};

export const signAndSendTransaction = async (
  client: Client,
  transactionMessage: CompilableTransactionMessage &
    TransactionMessageWithBlockhashLifetime,
  commitment: Commitment = 'confirmed'
) => {
  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
  const signature = getSignatureFromTransaction(signedTransaction);
  await sendAndConfirmTransactionFactory(client)(signedTransaction, {
    commitment,
  });
  return signature;
};

export const getBalance = async (client: Client, address: Address) =>
  (await client.rpc.getBalance(address, { commitment: 'confirmed' }).send())
    .value;

export const createMint = async (
  client: Client,
  payer: TransactionSigner,
  mintAuthority: Address,
  decimals: number = 0
): Promise<Address> => {
  const space = BigInt(getMintSize());
  const [transactionMessage, rent, mint] = await Promise.all([
    createDefaultTransaction(client, payer),
    client.rpc.getMinimumBalanceForRentExemption(space).send(),
    generateKeyPairSigner(),
  ]);
  const instructions = [
    getCreateAccountInstruction({
      payer,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction({
      mint: mint.address,
      decimals,
      mintAuthority,
    }),
  ];
  await pipe(
    transactionMessage,
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  return mint.address;
};

export const createToken = async (
  client: Client,
  payer: TransactionSigner,
  mint: Address,
  owner: Address
): Promise<Address> => {
  const space = BigInt(getTokenSize());
  const [transactionMessage, rent, token] = await Promise.all([
    createDefaultTransaction(client, payer),
    client.rpc.getMinimumBalanceForRentExemption(space).send(),
    generateKeyPairSigner(),
  ]);
  const instructions = [
    getCreateAccountInstruction({
      payer,
      newAccount: token,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeAccountInstruction({ account: token.address, mint, owner }),
  ];
  await pipe(
    transactionMessage,
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  return token.address;
};

export const createTokenWithAmount = async (
  client: Client,
  payer: TransactionSigner,
  mintAuthority: TransactionSigner,
  mint: Address,
  owner: Address,
  amount: bigint
): Promise<Address> => {
  const space = BigInt(getTokenSize());
  const [transactionMessage, rent, token] = await Promise.all([
    createDefaultTransaction(client, payer),
    client.rpc.getMinimumBalanceForRentExemption(space).send(),
    generateKeyPairSigner(),
  ]);
  const instructions = [
    getCreateAccountInstruction({
      payer,
      newAccount: token,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeAccountInstruction({ account: token.address, mint, owner }),
    getMintToInstruction({ mint, token: token.address, mintAuthority, amount }),
  ];
  await pipe(
    transactionMessage,
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  return token.address;
};
