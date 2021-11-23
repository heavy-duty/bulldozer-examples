import {
  BN,
  Provider,
  setProvider,
  utils,
  web3,
  workspace,
} from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

import {
  createMint,
  createUserAndAssociatedWallet,
  readAccount,
} from "./utils";

describe("SplitDaCheck", () => {
  const splitDaCheck = workspace.Splitdacheck;
  const provider = Provider.env();

  let checkPublicKey: web3.PublicKey, checkBump: number;
  let escrowPublicKey: web3.PublicKey, escrowBump: number;
  let mintAddress: web3.PublicKey;
  let alice: web3.Keypair, aliceWallet: web3.PublicKey;
  let bob: web3.Keypair, bobWallet: web3.PublicKey;

  before(() => setProvider(provider));

  describe("Alice and Bob split a check equally", () => {
    const checkId = new BN(1);
    const aliceInitialBalance = 100;
    const alicePart = 5;
    const bobInitialBalance = 50;
    const bobPart = 5;

    before(async () => {
      [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
        splitDaCheck.programId
      );
      [escrowPublicKey, escrowBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("escrow"), checkPublicKey.toBuffer()],
        splitDaCheck.programId
      );
      mintAddress = await createMint(provider);
      [alice, aliceWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        aliceInitialBalance
      );
      [bob, bobWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        bobInitialBalance
      );
    });

    it("should create a check", async () => {
      // arrange
      const checkTotal = new BN(10);
      // act
      await splitDaCheck.rpc.createCheck(
        checkId,
        checkBump,
        escrowBump,
        checkTotal,
        {
          accounts: {
            check: checkPublicKey,
            escrow: escrowPublicKey,
            authority: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mintAddress,
          },
        }
      );
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(checkId.eq(account.id));
      assert.ok(checkTotal.eq(account.total));
      assert.ok(new BN(0).eq(account.payed));
    });

    it("should submit Alice payment", async () => {
      // arrange
      const paymentAmount = new BN(alicePart);
      // act
      await splitDaCheck.rpc.submitPartialPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          payer: aliceWallet,
          authority: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
        signers: [alice],
      });
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(paymentAmount.eq(account.payed));
      const [, aliceBalancePost] = await readAccount(aliceWallet, provider);
      assert.equal(
        aliceBalancePost,
        (aliceInitialBalance - alicePart).toString()
      );
      const [, escrowBalancePost] = await readAccount(
        escrowPublicKey,
        provider
      );
      assert.equal(escrowBalancePost, alicePart.toString());
    });

    it("should submit Bob payment", async () => {
      // arrange
      const paymentAmount = new BN(bobPart);
      // act
      await splitDaCheck.rpc.submitPartialPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          payer: bobWallet,
          authority: bob.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
        signers: [bob],
      });
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(account.total.eq(account.payed));
      const [, bobBalancePost] = await readAccount(bobWallet, provider);
      assert.equal(bobBalancePost, (bobInitialBalance - bobPart).toString());
      const [, escrowBalancePost] = await readAccount(
        escrowPublicKey,
        provider
      );
      assert.equal(escrowBalancePost, (alicePart + bobPart).toString());
    });
  });

  describe("Alice and Bob each pay what they asked", () => {
    const checkId = new BN(2);
    const aliceInitialBalance = 100;
    const alicePart = 7;
    const bobInitialBalance = 50;
    const bobPart = 3;

    before(async () => {
      [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
        splitDaCheck.programId
      );
      [escrowPublicKey, escrowBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("escrow"), checkPublicKey.toBuffer()],
        splitDaCheck.programId
      );
      mintAddress = await createMint(provider);
      [alice, aliceWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        aliceInitialBalance
      );
      [bob, bobWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        bobInitialBalance
      );
    });

    it("should create a check", async () => {
      // arrange
      const checkTotal = new BN(10);
      // act
      await splitDaCheck.rpc.createCheck(
        checkId,
        checkBump,
        escrowBump,
        checkTotal,
        {
          accounts: {
            check: checkPublicKey,
            escrow: escrowPublicKey,
            authority: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mintAddress,
          },
        }
      );
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(checkId.eq(account.id));
      assert.ok(checkTotal.eq(account.total));
      assert.ok(new BN(0).eq(account.payed));
    });

    it("should submit Alice payment", async () => {
      // arrange
      const paymentAmount = new BN(alicePart);
      // act
      await splitDaCheck.rpc.submitPartialPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          payer: aliceWallet,
          authority: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
        signers: [alice],
      });
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(paymentAmount.eq(account.payed));
      const [, aliceBalancePost] = await readAccount(aliceWallet, provider);
      assert.equal(
        aliceBalancePost,
        (aliceInitialBalance - alicePart).toString()
      );
      const [, escrowBalancePost] = await readAccount(
        escrowPublicKey,
        provider
      );
      assert.equal(escrowBalancePost, alicePart.toString());
    });

    it("should submit Bob payment", async () => {
      // arrange
      const paymentAmount = new BN(bobPart);
      // act
      await splitDaCheck.rpc.submitPartialPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          payer: bobWallet,
          authority: bob.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
        signers: [bob],
      });
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(account.total.eq(account.payed));
      const [, bobBalancePost] = await readAccount(bobWallet, provider);
      assert.equal(bobBalancePost, (bobInitialBalance - bobPart).toString());
      const [, escrowBalancePost] = await readAccount(
        escrowPublicKey,
        provider
      );
      assert.equal(escrowBalancePost, (alicePart + bobPart).toString());
    });
  });

  describe("Alice pays the whole check", () => {
    const checkId = new BN(3);
    const aliceInitialBalance = 100;
    const alicePart = 10;

    before(async () => {
      [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
        splitDaCheck.programId
      );
      [escrowPublicKey, escrowBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("escrow"), checkPublicKey.toBuffer()],
        splitDaCheck.programId
      );
      mintAddress = await createMint(provider);
      [alice, aliceWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        aliceInitialBalance
      );
    });

    it("should create a check", async () => {
      // arrange
      const checkTotal = new BN(10);
      // act
      await splitDaCheck.rpc.createCheck(
        checkId,
        checkBump,
        escrowBump,
        checkTotal,
        {
          accounts: {
            check: checkPublicKey,
            escrow: escrowPublicKey,
            authority: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mintAddress,
          },
        }
      );
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(checkId.eq(account.id));
      assert.ok(checkTotal.eq(account.total));
      assert.ok(new BN(0).eq(account.payed));
    });

    it("should submit Alice payment", async () => {
      // arrange
      const paymentAmount = new BN(alicePart);
      // act
      await splitDaCheck.rpc.submitPartialPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          escrow: escrowPublicKey,
          payer: aliceWallet,
          authority: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
        },
        signers: [alice],
      });
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(account.total.eq(account.payed));
      const [, aliceBalancePost] = await readAccount(aliceWallet, provider);
      assert.equal(
        aliceBalancePost,
        (aliceInitialBalance - alicePart).toString()
      );
      const [, escrowBalancePost] = await readAccount(
        escrowPublicKey,
        provider
      );
      assert.equal(escrowBalancePost, alicePart.toString());
    });
  });
});
