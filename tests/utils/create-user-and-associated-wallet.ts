import { Provider, web3 } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const createUserAndAssociatedWallet = async (
  provider: Provider,
  mint: web3.PublicKey,
  amount: number
): Promise<[web3.Keypair, web3.PublicKey | undefined]> => {
  const user = new web3.Keypair();

  // Fund user with some SOL
  let txFund = new web3.Transaction();
  txFund.add(
    web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: 5 * web3.LAMPORTS_PER_SOL,
    })
  );
  await provider.send(txFund);

  // Create a token account for the user and mint some tokens
  const userAssociatedTokenAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    user.publicKey
  );
  const txFundTokenAccount = new web3.Transaction();
  txFundTokenAccount.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      userAssociatedTokenAccount,
      user.publicKey,
      user.publicKey
    )
  );
  txFundTokenAccount.add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      userAssociatedTokenAccount,
      provider.wallet.publicKey,
      [],
      amount
    )
  );
  await provider.send(txFundTokenAccount, [user]);

  return [user, userAssociatedTokenAccount];
};
