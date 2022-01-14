import {
  Commitment,
  Connection,
  Context,
  GetProgramAccountsFilter,
  KeyedAccountInfo,
  PublicKey,
} from '@solana/web3.js';
import { fromEventPattern, Observable } from 'rxjs';

export const fromProgramAccountChange = (
  connection: Connection,
  programId: PublicKey,
  commitment?: Commitment,
  filters?: GetProgramAccountsFilter[]
): Observable<{ keyedAccountInfo: KeyedAccountInfo; context: Context }> =>
  fromEventPattern<{ keyedAccountInfo: KeyedAccountInfo; context: Context }>(
    (addHandler) => {
      const id = connection.onProgramAccountChange(
        programId,
        (keyedAccountInfo, context) =>
          addHandler({ keyedAccountInfo, context }),
        commitment,
        filters
      );
      console.log('adding ->', id);
      return id;
    },
    (removeHandler, id) => {
      console.log('removing ->', id);
      return connection
        .removeProgramAccountChangeListener(id)
        .then(removeHandler);
    }
  );
