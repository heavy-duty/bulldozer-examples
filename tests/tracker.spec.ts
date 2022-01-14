import {
  Provider,
  setProvider,
  web3,
  workspace,
  utils,
  ProgramError,
  Program,
  Wallet,
} from '@project-serum/anchor';
import { assert } from 'chai';
import { IDL, Tracker } from '../target/types/tracker';
import { createAirdroppedWallet } from './utils';

describe('Tracker', () => {
  setProvider(Provider.env());
  let application = workspace.Tracker;
  const todoListName = 'my-todo';
  const todo = web3.Keypair.generate();
  const todoBody = 'this is a todo!';
  let todoListPublicKey: web3.PublicKey, todoListBump: number;

  before(async () => {
    [todoListPublicKey, todoListBump] = await web3.PublicKey.findProgramAddress(
      [
        utils.bytes.utf8.encode('todoList'),
        application.provider.wallet.publicKey.toBuffer(),
      ],
      application.programId
    );
  });

  it('should create todo list', async () => {
    await application.rpc.createTodoList(
      { name: todoListName, bump: todoListBump },
      {
        accounts: {
          todoList: todoListPublicKey,
          authority: application.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
      }
    );
    const account = await application.account.todoList.fetch(todoListPublicKey);
    assert.equal(account.name, todoListName);
    assert.ok(account.authority.equals(application.provider.wallet.publicKey));
  });

  it('should create todo', async () => {
    await application.rpc.createTodo(
      { body: todoBody },
      {
        accounts: {
          todo: todo.publicKey,
          todoList: todoListPublicKey,
          authority: application.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          clock: web3.SYSVAR_CLOCK_PUBKEY,
        },
        signers: [todo],
      }
    );
    const account = await application.account.todo.fetch(todo.publicKey);
    const todoListAccount = await application.account.todoList.fetch(
      todoListPublicKey
    );
    assert.equal(account.body, todoBody);
    assert.equal(account.checked, false);
    assert.ok(account.todoList.equals(todoListPublicKey));
    assert.ok(account.authority.equals(application.provider.wallet.publicKey));
    assert.ok(account.createdAt.eq(account.updatedAt));
    assert.equal(todoListAccount.quantityOfTodos, 1);
  });

  it('should toggle todo', async () => {
    await application.rpc.toggleTodo({
      accounts: {
        todo: todo.publicKey,
        authority: application.provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
      },
    });
    const account = await application.account.todo.fetch(todo.publicKey);
    assert.equal(account.checked, true);
    assert.ok(account.createdAt.lte(account.updatedAt));
  });

  it('should delete todo', async () => {
    await application.rpc.deleteTodo({
      accounts: {
        todoList: todoListPublicKey,
        todo: todo.publicKey,
        authority: application.provider.wallet.publicKey,
      },
    });
    const account = await application.account.todo.fetchNullable(
      todo.publicKey
    );
    const todoListAccount = await application.account.todoList.fetch(
      todoListPublicKey
    );
    assert.equal(account, null);
    assert.equal(todoListAccount.quantityOfTodos, 0);
  });

  it('should delete todo list', async () => {
    await application.rpc.deleteTodoList({
      accounts: {
        todoList: todoListPublicKey,
        authority: application.provider.wallet.publicKey,
      },
    });
    const account = await application.account.todoList.fetchNullable(
      todoListPublicKey
    );
    assert.equal(account, null);
  });

  describe('Errors', () => {
    let anotherApplication: Program<Tracker>;

    before(async () => {
      anotherApplication = new Program<Tracker>(
        IDL,
        application.programId,
        new Provider(
          application.provider.connection,
          await createAirdroppedWallet(application.provider.connection),
          {
            commitment: application.provider.connection.commitment,
          }
        )
      );
    });

    it('should fail when deleting todo list with todos', async () => {
      let error: ProgramError;
      try {
        await application.rpc.createTodoList(
          { name: todoListName, bump: todoListBump },
          {
            accounts: {
              todoList: todoListPublicKey,
              authority: application.provider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            },
          }
        );
        await application.rpc.createTodo(
          { body: todoBody },
          {
            accounts: {
              todo: todo.publicKey,
              todoList: todoListPublicKey,
              authority: application.provider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
              clock: web3.SYSVAR_CLOCK_PUBKEY,
            },
            signers: [todo],
          }
        );
        await application.rpc.deleteTodoList({
          accounts: {
            todoList: todoListPublicKey,
            authority: application.provider.wallet.publicKey,
          },
        });
      } catch (err) {
        error = err;
      }

      assert.equal(error.code, 6000);
    });

    it('should fail deleting todo with wrong todo list', async () => {
      let error: ProgramError;
      try {
        const [newTodoListPublicKey, newTodoListBump] =
          await web3.PublicKey.findProgramAddress(
            [
              utils.bytes.utf8.encode('todoList'),
              anotherApplication.provider.wallet.publicKey.toBuffer(),
            ],
            anotherApplication.programId
          );
        await anotherApplication.rpc.createTodoList(
          { name: todoListName, bump: newTodoListBump },
          {
            accounts: {
              todoList: newTodoListPublicKey,
              authority: anotherApplication.provider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            },
          }
        );
        await application.rpc.deleteTodo({
          accounts: {
            todo: todo.publicKey,
            todoList: newTodoListPublicKey,
            authority: application.provider.wallet.publicKey,
          },
        });
      } catch (err) {
        error = err;
      }

      assert.equal(error.code, 6001);
    });

    it('should fail when creating todo unauthorized', async () => {
      const todo = web3.Keypair.generate();

      let error: ProgramError;
      try {
        await anotherApplication.rpc.createTodo(
          { body: '' },
          {
            accounts: {
              todo: todo.publicKey,
              todoList: todoListPublicKey,
              authority: anotherApplication.provider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
              clock: web3.SYSVAR_CLOCK_PUBKEY,
            },
            signers: [todo],
          }
        );
      } catch (err) {
        error = err;
      }

      assert.equal(error.code, 6002);
    });

    it('should fail when toggling todo unauthorized', async () => {
      let error: ProgramError;
      try {
        await anotherApplication.rpc.toggleTodo({
          accounts: {
            todo: todo.publicKey,
            authority: anotherApplication.provider.wallet.publicKey,
            clock: web3.SYSVAR_CLOCK_PUBKEY,
          },
        });
      } catch (err) {
        error = err;
      }

      assert.equal(error.code, 6003);
    });

    it('should fail when deleting todo unauthorized', async () => {
      let error: ProgramError;
      try {
        await anotherApplication.rpc.deleteTodo({
          accounts: {
            todoList: todoListPublicKey,
            todo: todo.publicKey,
            authority: anotherApplication.provider.wallet.publicKey,
          },
        });
      } catch (err) {
        error = err;
      }

      assert.equal(error.code, 6004);
    });

    it('should fail when deleting todo list unauthorized', async () => {
      let error: ProgramError;
      try {
        await anotherApplication.rpc.deleteTodoList({
          accounts: {
            todoList: todoListPublicKey,
            authority: anotherApplication.provider.wallet.publicKey,
          },
        });
      } catch (err) {
        error = err;
      }

      assert.equal(error.code, 6005);
    });
  });
});
