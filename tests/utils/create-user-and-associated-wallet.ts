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
  const userAssociatedTokenAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    user.publicKey
  );

  // Fund user with some SOL
  await provider.send(
    new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: user.publicKey,
        lamports: 5 * web3.LAMPORTS_PER_SOL,
      })
    )
  );

  // Create a token account for the user and mint some tokens
  await provider.send(
    new web3.Transaction()
      .add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint,
          userAssociatedTokenAccount,
          user.publicKey,
          user.publicKey
        )
      )
      .add(
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mint,
          userAssociatedTokenAccount,
          provider.wallet.publicKey,
          [],
          amount
        )
      ),
    [user]
  );

  return [user, userAssociatedTokenAccount];
};
