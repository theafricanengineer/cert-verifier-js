import sinon from 'sinon';
import domain from '../../../../../../src/domain/index';
import { CERTIFICATE_VERSIONS } from '../../../../../../src/constants/index';
import { TExplorerAPIs } from '../../../../../../src/verifier';
import { SupportedChains } from '../../../../../../src/constants/blockchains';
import { TransactionData } from '../../../../../../src/models/TransactionData';

describe('Verifier domain lookForTx use case test suite', function () {
  const MOCK_TRANSACTION_ID = 'mock-transaction-id';
  const fixtureCustomTxData: TransactionData = {
    revokedAddresses: [],
    time: '2020-04-20T00:00:00Z',
    remoteHash: 'a-remote-hash',
    issuingAddress: 'from-custom-explorer'
  };

  const fixtureDefaultTxData: TransactionData = {
    revokedAddresses: [],
    time: '2020-04-20T00:00:00Z',
    remoteHash: 'a-remote-hash',
    issuingAddress: 'from-default-explorer'
  };

  describe('given it is invoked with custom explorers with priority 0', function () {
    let stubbedCustomExplorer: sinon.SinonStub;
    let stubbedDefaultExplorer: sinon.SinonStub;
    let mockExplorers: TExplorerAPIs;

    beforeEach(function () {
      stubbedCustomExplorer = sinon.stub().resolves(fixtureCustomTxData);
      stubbedDefaultExplorer = sinon.stub().resolves(fixtureDefaultTxData);
      mockExplorers = {
        bitcoin: [{
          parsingFunction: stubbedDefaultExplorer,
          priority: -1
        }],
        ethereum: [],
        v1: [],
        custom: [{
          parsingFunction: stubbedCustomExplorer,
          priority: 0
        }]
      };
    });

    afterEach(function () {
      stubbedCustomExplorer.resetHistory();
      stubbedDefaultExplorer.resetHistory();
    });

    describe('given the custom explorers return the transaction', function () {
      let response: TransactionData;

      beforeEach(async function () {
        response = await domain.verifier.lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: SupportedChains.Bitcoin,
          certificateVersion: CERTIFICATE_VERSIONS.V2_0,
          explorerAPIs: mockExplorers
        });
      });

      it('should retrieve the response from the custom explorers', function () {
        expect(response).toBe(fixtureCustomTxData);
      });

      it('should have called the custom explorers', function () {
        expect(stubbedCustomExplorer.calledOnce).toBe(true);
      });

      it('should not have called the default explorers', function () {
        expect(stubbedDefaultExplorer.calledOnce).toBe(false);
      });
    });

    describe('given the custom explorers fail to return the transaction', function () {
      let response: TransactionData;

      beforeEach(async function () {
        stubbedCustomExplorer.rejects();
        response = await domain.verifier.lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: SupportedChains.Bitcoin,
          certificateVersion: CERTIFICATE_VERSIONS.V2_0,
          explorerAPIs: mockExplorers
        });
      });

      it('should retrieve the response from the default explorers', function () {
        expect(response).toBe(fixtureDefaultTxData);
      });

      it('should have called the custom explorers', function () {
        expect(stubbedCustomExplorer.calledOnce).toBe(true);
      });

      it('should have called the default explorers', function () {
        expect(stubbedDefaultExplorer.calledOnce).toBe(true);
      });
    });
  });
});
