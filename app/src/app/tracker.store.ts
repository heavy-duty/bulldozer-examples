import { Injectable } from '@angular/core';
import { ProgramStore } from '@heavy-duty/ng-anchor';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { utils } from '@project-serum/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  defer,
  EMPTY,
  from,
  map,
  merge,
  Observable,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { environment } from '../environments/environment';
import { ConnectionStore } from './connection-store';
import { isNotNullOrUndefined } from './operators';

export interface Todo {
  id: string;
  body: string;
  checked: boolean;
  authority: string;
  todoListId: string;
}

export interface TodoList {
  id: string;
  name: string;
  authority: string;
}

interface ViewModel {
  todoListPublicKey: PublicKey | null;
  todoListBump: number | null;
  todoList: TodoList | null;
  todos: Todo[];
}

const initialState: ViewModel = {
  todoList: null,
  todos: [],
  todoListBump: null,
  todoListPublicKey: null,
};

@Injectable()
export class TrackerStore extends ComponentStore<ViewModel> {
  private readonly _reload = new BehaviorSubject(null);
  readonly reload$ = this._reload.asObservable();
  private readonly _reader$ = this._programStore.getReader('tracker');
  private readonly _writer$ = this._programStore.getWriter('tracker');
  readonly todoList$ = this.select(({ todoList }) => todoList);
  readonly todoListPublicKey$ = this.select(
    ({ todoListPublicKey }) => todoListPublicKey
  );
  readonly todoListBump$ = this.select(({ todoListBump }) => todoListBump);
  readonly todos$ = this.select(({ todos }) => todos);

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _programStore: ProgramStore,
    private readonly _connectionStore: ConnectionStore
  ) {
    super(initialState);
  }

  readonly setTodoList = this.updater((state, todoList: TodoList | null) => ({
    ...state,
    todoList,
  }));

  readonly setTodos = this.updater((state, todos: Todo[]) => ({
    ...state,
    todos,
  }));

  readonly setTodo = this.updater((state, newTodo: Todo) => ({
    ...state,
    todos: state.todos.map((todo) => (todo.id === newTodo.id ? newTodo : todo)),
  }));

  readonly addTodo = this.updater((state, newTodo: Todo) => ({
    ...state,
    todos: [...state.todos, newTodo],
  }));

  readonly removeTodo = this.updater((state, todoId: string) => ({
    ...state,
    todos: state.todos.filter(({ id }) => id !== todoId),
  }));

  readonly watchTodoList = this.effect(() =>
    combineLatest([this.todoListPublicKey$, this._reader$]).pipe(
      switchMap(([todoListPublicKey, reader]) => {
        if (!reader || !todoListPublicKey) {
          return of(null);
        }

        return this._connectionStore.onAccountChanges(todoListPublicKey).pipe(
          isNotNullOrUndefined,
          map(({ accountInfo }) => {
            if (accountInfo.lamports === 0) {
              return null;
            } else {
              const decodedAccount = reader.coder.accounts.decode(
                'TodoList',
                accountInfo.data
              );

              return {
                id: todoListPublicKey.toBase58(),
                name: decodedAccount['name'],
                authority: decodedAccount['authority'].toBase58(),
              };
            }
          })
        );
      }),
      tap((todoList: TodoList | null) => this.setTodoList(todoList))
    )
  );

  readonly watchTodos = this.effect(() =>
    combineLatest([this.todos$, this._reader$]).pipe(
      switchMap(([todos, reader]) => {
        if (!reader) {
          return of(null);
        }

        return merge(
          ...todos.map((todo) =>
            this._connectionStore.onAccountChanges(new PublicKey(todo.id)).pipe(
              isNotNullOrUndefined,
              tapResponse(
                ({ accountInfo }) => {
                  if (accountInfo.lamports === 0) {
                    this.removeTodo(todo.id);
                  } else {
                    const decodedAccount = reader.coder.accounts.decode(
                      'Todo',
                      accountInfo.data
                    );

                    this.setTodo({
                      id: todo.id,
                      body: decodedAccount['body'],
                      authority: decodedAccount['authority'].toBase58(),
                      checked: decodedAccount['checked'],
                      todoListId: decodedAccount['todoList'].toBase58(),
                    });
                  }
                },
                (error) => console.error(error)
              )
            )
          )
        );
      })
    )
  );

  onTodoCreated = this.effect(() =>
    combineLatest([this._reader$, this.todoListPublicKey$]).pipe(
      switchMap(([reader, todoListPublicKey]) => {
        if (!reader || !todoListPublicKey) {
          return of(null);
        }

        return this._connectionStore
          .onProgramAccountChanges(
            new PublicKey(environment.trackerId),
            undefined,
            [{ memcmp: { offset: 40, bytes: todoListPublicKey.toBase58() } }]
          )
          .pipe(
            tapResponse(
              ({ accountInfo, publicKey }) => {
                if (accountInfo.lamports === 0) {
                  this.removeTodo(publicKey.toBase58());
                } else {
                  const decodedAccount = reader.coder.accounts.decode(
                    'Todo',
                    accountInfo.data
                  );

                  if (decodedAccount.createdAt.eq(decodedAccount.updatedAt)) {
                    this.addTodo({
                      id: publicKey.toBase58(),
                      body: decodedAccount['body'],
                      authority: decodedAccount['authority'].toBase58(),
                      checked: decodedAccount['checked'],
                      todoListId: decodedAccount['todoList'].toBase58(),
                    });
                  }
                }
              },
              (error) => console.log(error)
            )
          );
      })
    )
  );

  readonly loadTodoListAddress = this.effect(() =>
    combineLatest([this._walletStore.publicKey$, this._reader$]).pipe(
      switchMap(([walletPublicKey, reader]) => {
        if (!walletPublicKey || !reader) {
          return of([null, null]);
        }

        return defer(() =>
          from(
            PublicKey.findProgramAddress(
              [utils.bytes.utf8.encode('todoList'), walletPublicKey.toBuffer()],
              reader.programId
            )
          )
        );
      }),
      tapResponse(
        ([todoListPublicKey, todoListBump]) =>
          this.patchState({
            todoListPublicKey,
            todoListBump,
          }),
        (error) => console.error(error)
      )
    )
  );

  readonly loadTodoList = this.effect(() =>
    combineLatest([this._reader$, this.todoListPublicKey$, this.reload$]).pipe(
      switchMap(([reader, todoListPublicKey]) => {
        if (!reader || !todoListPublicKey) {
          return of(null);
        }

        return defer(() =>
          from(reader.account['todoList'].fetchNullable(todoListPublicKey))
        ).pipe(
          map((todoList) =>
            todoList
              ? {
                  id: todoListPublicKey.toBase58(),
                  name: todoList['name'],
                  authority: todoList['authority'].toBase58(),
                }
              : null
          )
        );
      }),
      tapResponse(
        (todoList) => this.patchState({ todoList }),
        (error) => console.error(error)
      )
    )
  );

  readonly loadTodos = this.effect(() =>
    combineLatest([this.todoListPublicKey$, this._reader$, this.reload$]).pipe(
      switchMap(([todoListPublicKey, reader]) => {
        if (!todoListPublicKey || !reader) {
          return of([]);
        }

        return from(
          reader.account['todo'].all([
            { memcmp: { offset: 40, bytes: todoListPublicKey.toBase58() } },
          ])
        ).pipe(
          tapResponse(
            (todos) =>
              this.setTodos(
                todos.map((todo) => ({
                  id: todo.publicKey.toBase58(),
                  body: todo.account['body'],
                  authority: todo.account['authority'].toBase58(),
                  checked: todo.account['checked'],
                  todoListId: todo.account['todoList'].toBase58(),
                }))
              ),
            (error) => console.log(error)
          )
        );
      })
    )
  );

  readonly createTodoList = this.effect((name$: Observable<string>) =>
    name$.pipe(
      concatMap((name) =>
        of(name).pipe(
          withLatestFrom(
            this._walletStore.publicKey$,
            this._writer$,
            this.todoListPublicKey$,
            this.todoListBump$
          )
        )
      ),
      concatMap(
        ([name, walletPublicKey, writer, todoListPublicKey, todoListBump]) => {
          if (
            !walletPublicKey ||
            !writer ||
            !todoListPublicKey ||
            !todoListBump
          ) {
            return of(null);
          }

          return defer(() =>
            from(
              writer.rpc['createTodoList'](
                { name, bump: todoListBump },
                {
                  accounts: {
                    todoList: todoListPublicKey,
                    authority: walletPublicKey,
                    systemProgram: SystemProgram.programId,
                  },
                }
              )
            )
          ).pipe(
            catchError((error) => {
              console.error(error);
              return EMPTY;
            })
          );
        }
      )
    )
  );

  readonly deleteTodoList = this.effect(($) =>
    $.pipe(
      concatMap(() =>
        of(null).pipe(
          withLatestFrom(
            this._walletStore.publicKey$,
            this._writer$,
            this.todoListPublicKey$
          )
        )
      ),
      concatMap(([, walletPublicKey, writer, todoListPublicKey]) => {
        if (!walletPublicKey || !writer || !todoListPublicKey) {
          return of(null);
        }

        return defer(() =>
          from(
            writer.rpc['deleteTodoList']({
              accounts: {
                todoList: todoListPublicKey,
                authority: walletPublicKey,
              },
            })
          )
        ).pipe(
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        );
      })
    )
  );

  readonly createTodo = this.effect(
    (todo$: Observable<{ todoList: string; body: string }>) =>
      todo$.pipe(
        concatMap((todo) =>
          of(todo).pipe(
            withLatestFrom(this._walletStore.publicKey$, this._writer$)
          )
        ),
        concatMap(([{ todoList, body }, walletPublicKey, writer]) => {
          if (!walletPublicKey || !writer) {
            return of(null);
          }

          const todo = Keypair.generate();

          return defer(() =>
            from(
              writer.rpc['createTodo'](
                { body },
                {
                  accounts: {
                    todo: todo.publicKey,
                    todoList: new PublicKey(todoList),
                    authority: walletPublicKey,
                    systemProgram: SystemProgram.programId,
                    clock: SYSVAR_CLOCK_PUBKEY,
                  },
                  signers: [todo],
                }
              )
            )
          ).pipe(
            catchError((error) => {
              console.error(error);
              return EMPTY;
            })
          );
        })
      )
  );

  readonly toggleTodo = this.effect((todoId$: Observable<string>) =>
    todoId$.pipe(
      concatMap((todoId) =>
        of(todoId).pipe(
          withLatestFrom(this._walletStore.publicKey$, this._writer$)
        )
      ),
      concatMap(([todoId, walletPublicKey, writer]) => {
        if (!walletPublicKey || !writer) {
          return of(null);
        }

        return defer(() =>
          from(
            writer.rpc['toggleTodo']({
              accounts: {
                todo: new PublicKey(todoId),
                authority: walletPublicKey,
                clock: SYSVAR_CLOCK_PUBKEY,
              },
            })
          )
        ).pipe(
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        );
      })
    )
  );

  readonly deleteTodo = this.effect((todo$: Observable<Todo>) =>
    todo$.pipe(
      concatMap((todo) =>
        of(todo).pipe(
          withLatestFrom(this._walletStore.publicKey$, this._writer$)
        )
      ),
      concatMap(([todo, walletPublicKey, writer]) => {
        if (!walletPublicKey || !writer) {
          return of(null);
        }

        return defer(() =>
          from(
            writer.rpc['deleteTodo']({
              accounts: {
                todoList: new PublicKey(todo.todoListId),
                todo: new PublicKey(todo.id),
                authority: walletPublicKey,
              },
            })
          )
        ).pipe(
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        );
      })
    )
  );

  reload() {
    this._reload.next(null);
  }
}
