import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  AccountInfo,
  Commitment,
  Connection,
  ConnectionConfig,
  DataSizeFilter,
  GetProgramAccountsFilter,
  MemcmpFilter,
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

const hashGetProgramAccountsRequest = (
  programId: string,
  filters: GetProgramAccountsFilter[] = []
) => {
  const dataSizeFilters = filters
    .filter((filter): filter is DataSizeFilter => 'dataSize' in filter)
    .sort((a, b) => a.dataSize - b.dataSize)
    .map((filter) => `dataSize:${filter.dataSize}`);
  const memcmpFilters = filters
    .filter((filter): filter is MemcmpFilter => 'memcmp' in filter)
    .sort((a, b) => {
      if (a.memcmp.bytes < b.memcmp.bytes) {
        return -1;
      } else if (a.memcmp.bytes > b.memcmp.bytes) {
        return 1;
      } else {
        return 0;
      }
    })
    .sort((a, b) => a.memcmp.offset - b.memcmp.offset)
    .map((filter) => `memcmp:${filter.memcmp.offset}:${filter.memcmp.bytes}`);
  return [...dataSizeFilters, ...memcmpFilters].reduce(
    (hash, filter) => `${hash}+${filter}`,
    `programId:${programId}`
  );
};

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
  private readonly _programAcountSubscriptions = new Map<
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

    const getProgramAccountsRequestHash = hashGetProgramAccountsRequest(
      programId.toBase58(),
      filters
    );
    const subscription = this._programAcountSubscriptions.get(
      getProgramAccountsRequestHash
    );

    if (subscription) {
      return subscription;
    }

    const programAccountChange$ = fromProgramAccountChange(
      connection,
      programId,
      commitment,
      filters
    ).pipe(
      shareWhileSubscribed(() =>
        this._programAcountSubscriptions.delete(getProgramAccountsRequestHash)
      ),
      map(({ keyedAccountInfo }) => ({
        publicKey: keyedAccountInfo.accountId,
        accountInfo: keyedAccountInfo.accountInfo,
      }))
    );

    this._programAcountSubscriptions.set(
      getProgramAccountsRequestHash,
      programAccountChange$
    );

    return programAccountChange$;
  }
}
