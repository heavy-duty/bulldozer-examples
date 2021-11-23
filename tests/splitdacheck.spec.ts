import {
  Provider,
  setProvider,
  web3,
  workspace,
  utils,
  BN,
} from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID, MintLayout, Token } from "@solana/spl-token";
import { assert } from "chai";

describe("SplitDaCheck", () => {
  setProvider(Provider.env());
  const splitDaCheck = workspace.Splitdacheck;
  const checkId = new BN(5);
  let checkPublicKey: web3.PublicKey, checkBump: number;
  let escrowPublicKey: web3.PublicKey, escrowBump: number;
  let mintAddress: web3.PublicKey;

  const createMint = async (provider: Provider): Promise<web3.PublicKey> => {
    const tokenMint = new web3.Keypair();
    const lamportsForMint =
      await provider.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      );
    let tx = new web3.Transaction();

    // Allocate mint
    tx.add(
      web3.SystemProgram.createAccount({
        programId: TOKEN_PROGRAM_ID,
        space: MintLayout.span,
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: tokenMint.publicKey,
        lamports: lamportsForMint,
      })
    );
    // Allocate wallet account
    tx.add(
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        tokenMint.publicKey,
        6,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      )
    );
    const signature = await provider.send(tx, [tokenMint]);

    console.log(
      `[${tokenMint.publicKey}] Created new mint account at ${signature}`
    );
    return tokenMint.publicKey;
  };

  before(async () => {
    [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
      [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
      splitDaCheck.programId
    );
    [escrowPublicKey, escrowBump] = await web3.PublicKey.findProgramAddress(
      [utils.bytes.utf8.encode("escrow"), checkPublicKey.toBuffer()],
      splitDaCheck.programId
    );
    mintAddress = await createMint(splitDaCheck.provider);
  });

  it("should create a new check", async () => {
    // arrange
    const checkAmount = new BN(5);
    // act
    await splitDaCheck.rpc.createCheck(
      checkId,
      checkBump,
      escrowBump,
      checkAmount,
      {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          authority: splitDaCheck.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
      }
    );
    // assert
    const account = await splitDaCheck.account.check.fetch(checkPublicKey);
    assert.ok(checkAmount.eq(account.amount));
  });
});
