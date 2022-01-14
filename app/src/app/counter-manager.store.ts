import { Injectable } from '@angular/core';
import { ProgramStore } from '@heavy-duty/ng-anchor';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { utils } from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  defer,
  EMPTY,
  filter,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ConnectionStore } from './connection-store';
import { isNotNullOrUndefined } from './operators';

export interface Counter {
  id: string;
  data: number;
  authority: string;
}

interface ViewModel {
  counterPublicKey: PublicKey | null;
  counter: Counter | null;
  counterBump: number | null;
}

const initialState: ViewModel = {
  counterPublicKey: null,
  counter: null,
  counterBump: null,
};

@Injectable()
export class CounterManagerStore extends ComponentStore<ViewModel> {
  private readonly _reload = new BehaviorSubject(null);
  readonly reload$ = this._reload.asObservable();
  private readonly _reader$ = this._programStore.getReader('counterManager');
  private readonly _writer$ = this._programStore.getWriter('counterManager');
  readonly counter$ = this.select(({ counter }) => counter);
  readonly counterPublicKey$ = this.select(
    ({ counterPublicKey }) => counterPublicKey
  );
  readonly counterBump$ = this.select(({ counterBump }) => counterBump);

  constructor(
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore,
    private readonly _programStore: ProgramStore
  ) {
    super(initialState);
  }

  readonly loadCounterAddress = this.effect(() =>
    combineLatest([this._walletStore.publicKey$, this._reader$]).pipe(
      switchMap(([walletPublicKey, reader]) => {
        if (!walletPublicKey || !reader) {
          return of([null, null]);
        }

        return defer(() =>
          from(
            PublicKey.findProgramAddress(
              [utils.bytes.utf8.encode('counter'), walletPublicKey.toBuffer()],
              reader.programId
            )
          )
        );
      }),
      tapResponse(
        ([counterPublicKey, counterBump]) =>
          this.patchState({
            counterPublicKey,
            counterBump,
          }),
        (error) => console.error(error)
      )
    )
  );

  readonly loadCounter = this.effect(() =>
    combineLatest([this._reader$, this.counterPublicKey$, this.reload$]).pipe(
      switchMap(([reader, counterPublicKey]) => {
        if (!reader || !counterPublicKey) {
          return of(null);
        }

        return defer(() =>
          from(reader.account['counter'].fetchNullable(counterPublicKey))
        ).pipe(
          map((counter) =>
            counter
              ? {
                  id: counterPublicKey.toBase58(),
                  data: counter['data'],
                  authority: counter['authority'].toBase58(),
                }
              : null
          )
        );
      }),
      tapResponse(
        (counter) => this.patchState({ counter }),
        (error) => console.error(error)
      )
    )
  );

  readonly watchCounter = this.effect(() =>
    combineLatest([this.counterPublicKey$, this._reader$]).pipe(
      switchMap(([counterPublicKey, reader]) => {
        if (!counterPublicKey || !reader) {
          return of(null);
        }

        return this._connectionStore.onAccountChanges(counterPublicKey).pipe(
          isNotNullOrUndefined,
          filter(({ publicKey }) => publicKey.equals(counterPublicKey)),
          map(({ accountInfo }) => {
            if (accountInfo.lamports === 0) {
              return null;
            }

            const decodedAccount = reader.coder.accounts.decode(
              'Counter',
              accountInfo.data
            );

            return {
              id: counterPublicKey.toBase58(),
              data: decodedAccount.data,
              authority: decodedAccount.authority.toBase58(),
            };
          })
        );
      }),
      tap((counter) => this.patchState({ counter }))
    )
  );

  readonly initCounter = this.effect(($) =>
    $.pipe(
      concatMap(() =>
        of(null).pipe(
          withLatestFrom(
            this._walletStore.publicKey$,
            this._writer$,
            this.counterPublicKey$,
            this.counterBump$
          )
        )
      ),
      concatMap(
        ([, walletPublicKey, writer, counterPublicKey, counterBump]) => {
          if (
            !walletPublicKey ||
            !writer ||
            !counterPublicKey ||
            !counterBump
          ) {
            return of(null);
          }

          return defer(() =>
            from(
              writer.rpc['init'](counterBump, {
                accounts: {
                  counter: counterPublicKey,
                  authority: walletPublicKey,
                  systemProgram: SystemProgram.programId,
                },
              })
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

  readonly incrementCounter = this.effect((counterId$: Observable<string>) =>
    counterId$.pipe(
      concatMap((counterId) =>
        of(counterId).pipe(
          withLatestFrom(this._walletStore.publicKey$, this._writer$)
        )
      ),
      concatMap(([counterId, walletPublicKey, writer]) => {
        if (!walletPublicKey || !writer || !counterId) {
          return of(null);
        }

        return defer(() =>
          from(
            writer.rpc['increment']({
              accounts: {
                counter: new PublicKey(counterId),
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

  readonly deleteCounter = this.effect((counterId$: Observable<string>) =>
    counterId$.pipe(
      concatMap((counterId) =>
        of(counterId).pipe(
          withLatestFrom(this._walletStore.publicKey$, this._writer$)
        )
      ),
      concatMap(([counterId, walletPublicKey, writer]) => {
        if (!walletPublicKey || !writer || !counterId) {
          return of(null);
        }

        return defer(() =>
          from(
            writer.rpc['delete']({
              accounts: {
                counter: new PublicKey(counterId),
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
