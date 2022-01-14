import { Wallet, web3 } from '@project-serum/anchor';

export const createAirdroppedWallet = async (
  connection: web3.Connection,
  solanaAmount = 5
) => {
  const wallet = web3.Keypair.generate();
  const signature = await connection.requestAirdrop(
    wallet.publicKey,
    solanaAmount * web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
  return new Wallet(wallet);
};
