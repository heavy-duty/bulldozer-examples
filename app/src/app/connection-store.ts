import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  AccountInfo,
  Commitment,
  Connection,
  ConnectionConfig,
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js';
import { combineLatest, map, Observable, tap } from 'rxjs';
import {
  fromAccountChange,
  fromProgramAccountChange,
  shareWhileSubscribed,
} from './operators';

const CONNECTION_DEFAULT_URL = 'http://localhost:8899';
const CONNECTION_DEFAULT_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
};

interface ConnectionState {
  connection: Connection | null;
  endpoint: string | null;
  config: ConnectionConfig;
}

@Injectable()
export class ConnectionStore extends ComponentStore<ConnectionState> {
  readonly connection$ = this.select(({ connection }) => connection);
  readonly endpoint$ = this.select(({ endpoint }) => endpoint);
  readonly config$ = this.select(({ config }) => config);
  private readonly _accountSubscriptions = new Map<
    string,
    Observable<{
      publicKey: PublicKey;
      accountInfo: AccountInfo<Buffer>;
    }>
  >();

  constructor() {
    super({
      connection: new Connection(
        CONNECTION_DEFAULT_URL,
        CONNECTION_DEFAULT_CONFIG
      ),
      endpoint: CONNECTION_DEFAULT_URL,
      config: CONNECTION_DEFAULT_CONFIG,
    });
  }

  readonly setEndpoint = this.updater((state, endpoint: string) => ({
    ...state,
    endpoint,
  }));

  readonly setConfig = this.updater((state, config: ConnectionConfig) => ({
    ...state,
    config,
  }));

  readonly setConnection = this.updater(
    (state, connection: Connection | null) => ({
      ...state,
      connection,
    })
  );

  readonly loadConnection = this.effect(() =>
    combineLatest([this.endpoint$, this.config$]).pipe(
      tap(([endpoint, config]) =>
        this.setConnection(endpoint ? new Connection(endpoint, config) : null)
      )
    )
  );

  onAccountChanges(publicKey: PublicKey) {
    const { connection } = this.get();

    if (!connection) {
      throw Error('Connection not established.');
    }

    const subscription = this._accountSubscriptions.get(publicKey.toBase58());

    if (subscription) {
      return subscription;
    }

    const accountChange$ = fromAccountChange(connection, publicKey).pipe(
      shareWhileSubscribed(() =>
        this._accountSubscriptions.delete(publicKey.toBase58())
      ),
      map(({ accountInfo }) => ({
        publicKey,
        accountInfo,
      }))
    );

    this._accountSubscriptions.set(publicKey.toBase58(), accountChange$);

    return accountChange$;
  }

  onProgramAccountChanges(
    programId: PublicKey,
    commitment?: Commitment,
    filters?: GetProgramAccountsFilter[]
  ) {
    const { connection } = this.get();

    if (!connection) {
      throw Error('Connection not established.');
    }

    const programAccountChange$ = fromProgramAccountChange(
      connection,
      programId,
      commitment,
      filters
    ).pipe(
      map(({ keyedAccountInfo }) => ({
        publicKey: keyedAccountInfo.accountId,
        accountInfo: keyedAccountInfo.accountInfo,
      }))
    );

    return programAccountChange$;
  }
}
