import { Provider, web3 } from "@project-serum/anchor";
import { MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const createMint = async (
  provider: Provider
): Promise<web3.PublicKey> => {
  const tokenMint = new web3.Keypair();
  const lamportsForMint =
    await provider.connection.getMinimumBalanceForRentExemption(
      MintLayout.span
    );

  // Allocate mint and wallet account
  await provider.send(
    new web3.Transaction()
      .add(
        web3.SystemProgram.createAccount({
          programId: TOKEN_PROGRAM_ID,
          space: MintLayout.span,
          fromPubkey: provider.wallet.publicKey,
          newAccountPubkey: tokenMint.publicKey,
          lamports: lamportsForMint,
        })
      )
      .add(
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          tokenMint.publicKey,
          6,
          provider.wallet.publicKey,
          provider.wallet.publicKey
        )
      ),
    [tokenMint]
  );
  return tokenMint.publicKey;
};
