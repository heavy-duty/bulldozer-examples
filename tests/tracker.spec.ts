import {
  Provider,
  setProvider,
  web3,
  workspace,
} from '@project-serum/anchor';
import { assert } from 'chai';

describe('Tracker', () => {
  setProvider(Provider.env());
  const application = workspace.Tracker;
});
