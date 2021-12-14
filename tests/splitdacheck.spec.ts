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
  let vaultPublicKey: web3.PublicKey, vaultBump: number;
  let mintAddress: web3.PublicKey;
  let vendor: web3.Keypair, vendorWallet: web3.PublicKey;
  let alice: web3.Keypair, aliceWallet: web3.PublicKey;
  let bob: web3.Keypair, bobWallet: web3.PublicKey;

  before(() => setProvider(provider));

  describe("Alice and Bob split a check equally", () => {
    const checkId = new BN(1);
    const aliceInitialBalance = 100;
    const alicePart = 5;
    const bobInitialBalance = 50;
    const bobPart = 5;
    const vendorInitialBalance = 0;

    before(async () => {
      [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
        splitDaCheck.programId
      );
      [vaultPublicKey, vaultBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("vault"), checkPublicKey.toBuffer()],
        splitDaCheck.programId
      );
      mintAddress = await createMint(provider);
      [vendor, vendorWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        vendorInitialBalance
      );
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
        vaultBump,
        checkTotal,
        {
          accounts: {
            check: checkPublicKey,
            vault: vaultPublicKey,
            authority: vendor.publicKey,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mintAddress,
            receiver: vendorWallet,
          },
          signers: [vendor],
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
      const signature = await splitDaCheck.rpc.submitPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          checkAuthority: vendor.publicKey,
          vault: vaultPublicKey,
          payer: aliceWallet,
          authority: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
          receiver: vendorWallet,
        },
        signers: [alice],
      });
      await provider.connection.confirmTransaction(signature);
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(paymentAmount.eq(account.payed));
      const [, aliceBalancePost] = await readAccount(aliceWallet, provider);
      assert.equal(
        aliceBalancePost,
        (aliceInitialBalance - alicePart).toString()
      );
      const [, vaultBalancePost] = await readAccount(vaultPublicKey, provider);
      assert.equal(vaultBalancePost, alicePart.toString());
    });

    it("should submit Bob payment and close vault", async () => {
      // arrange
      const paymentAmount = new BN(bobPart);
      // act
      const signature = await splitDaCheck.rpc.submitPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          checkAuthority: vendor.publicKey,
          vault: vaultPublicKey,
          payer: bobWallet,
          authority: bob.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
          receiver: vendorWallet,
        },
        signers: [bob],
      });
      await provider.connection.confirmTransaction(signature);
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(account.total.eq(account.payed));
      const [, bobBalancePost] = await readAccount(bobWallet, provider);
      assert.equal(bobBalancePost, (bobInitialBalance - bobPart).toString());
      const [, vendorBalancePost] = await readAccount(vendorWallet, provider);
      assert.equal(vendorBalancePost, (alicePart + bobPart).toString());
      const vaultWalletAccount = await provider.connection.getAccountInfo(
        vaultPublicKey
      );
      assert.equal(vaultWalletAccount, null);
    });
  });

  describe("Alice and Bob each pay what they asked", () => {
    const checkId = new BN(2);
    const aliceInitialBalance = 100;
    const alicePart = 7;
    const bobInitialBalance = 50;
    const bobPart = 3;
    const vendorInitialBalance = 0;

    before(async () => {
      [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
        splitDaCheck.programId
      );
      [vaultPublicKey, vaultBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("vault"), checkPublicKey.toBuffer()],
        splitDaCheck.programId
      );
      mintAddress = await createMint(provider);
      [vendor, vendorWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        vendorInitialBalance
      );
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
        vaultBump,
        checkTotal,
        {
          accounts: {
            check: checkPublicKey,
            vault: vaultPublicKey,
            authority: vendor.publicKey,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mintAddress,
            receiver: vendorWallet,
          },
          signers: [vendor],
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
      await splitDaCheck.rpc.submitPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          checkAuthority: vendor.publicKey,
          vault: vaultPublicKey,
          payer: aliceWallet,
          authority: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
          receiver: vendorWallet,
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
      const [, vaultBalancePost] = await readAccount(vaultPublicKey, provider);
      assert.equal(vaultBalancePost, alicePart.toString());
    });

    it("should submit Bob payment", async () => {
      // arrange
      const paymentAmount = new BN(bobPart);
      // act
      await splitDaCheck.rpc.submitPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          checkAuthority: vendor.publicKey,
          vault: vaultPublicKey,
          payer: bobWallet,
          authority: bob.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
          receiver: vendorWallet,
        },
        signers: [bob],
      });
      // assert
      const account = await splitDaCheck.account.check.fetch(checkPublicKey);
      assert.ok(account.total.eq(account.payed));
      const [, bobBalancePost] = await readAccount(bobWallet, provider);
      assert.equal(bobBalancePost, (bobInitialBalance - bobPart).toString());
      const [, vendorBalancePost] = await readAccount(vendorWallet, provider);
      assert.equal(vendorBalancePost, (alicePart + bobPart).toString());
      const vaultWalletAccount = await provider.connection.getAccountInfo(
        vaultPublicKey
      );
      assert.equal(vaultWalletAccount, null);
    });
  });

  describe("Alice pays the whole check", () => {
    const checkId = new BN(3);
    const vendorInitialBalance = 0;
    const aliceInitialBalance = 100;
    const alicePart = 10;

    before(async () => {
      [checkPublicKey, checkBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("check"), checkId.toBuffer("le", 8)],
        splitDaCheck.programId
      );
      [vaultPublicKey, vaultBump] = await web3.PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("vault"), checkPublicKey.toBuffer()],
        splitDaCheck.programId
      );
      mintAddress = await createMint(provider);
      [vendor, vendorWallet] = await createUserAndAssociatedWallet(
        provider,
        mintAddress,
        vendorInitialBalance
      );
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
        vaultBump,
        checkTotal,
        {
          accounts: {
            check: checkPublicKey,
            vault: vaultPublicKey,
            authority: vendor.publicKey,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMint: mintAddress,
            receiver: vendorWallet,
          },
          signers: [vendor],
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
      await splitDaCheck.rpc.submitPayment(paymentAmount, {
        accounts: {
          check: checkPublicKey,
          checkAuthority: vendor.publicKey,
          vault: vaultPublicKey,
          payer: aliceWallet,
          authority: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMint: mintAddress,
          receiver: vendorWallet,
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
      const [, vendorBalancePost] = await readAccount(vendorWallet, provider);
      assert.equal(vendorBalancePost, alicePart.toString());
      const vaultWalletAccount = await provider.connection.getAccountInfo(
        vaultPublicKey
      );
      assert.equal(vaultWalletAccount, null);
    });
  });
});
