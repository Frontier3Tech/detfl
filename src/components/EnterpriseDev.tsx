import { signals } from '@apophis-sdk/core';
import { Cosmos } from '@apophis-sdk/cosmos';
import { Contract, CosmWasm } from '@apophis-sdk/cosmwasm';
import { toast } from '@kiruse/cosmos-components';
import classNames from 'classnames';
import { getNetwork } from '~/config';
import { useLedger } from '~/state';

const LIONDAO_MEMBERSHIP_ADDRESS = 'terra1fv92cnlenl8am5vpcamsxpr6l7y9ytpvlhery9ncy95jjxh8pmlsass2rq';
const ROAR_TOKEN_ADDRESS = 'terra1lxx40s29qvkrcj8fsa3yzyehy7w50umdvvnls2r830rys6lu2zns63eelv';

export default function EnterpriseDev() {
  const handleStake = async () => {
    const address = signals.address.value;
    const signer = signals.signer.value;
    if (!signer || !address) return toast.error('Please connect your wallet');

    const network = await getNetwork();
    if (!network) throw new Error('Network not found');

    const tx = Cosmos.tx([
      new Contract.Execute({
        sender: address,
        contract: ROAR_TOKEN_ADDRESS,
        msg: CosmWasm.toBinary({
          send: {
            contract: LIONDAO_MEMBERSHIP_ADDRESS,
            amount: '1000000',
            msg: CosmWasm.toBinary({
              stake: {
                user: address,
              },
            }),
          },
        }),
      }),
    ], { encoding: useLedger.value ? 'amino' : 'protobuf' });

    try {
      await tx.estimateGas(network, signer, true);
      console.log('tx', tx.signDoc(network, signer));
      await signer.sign(network, tx);
      await tx.broadcast();
      await Cosmos.ws(network).expectTx(tx, 30000);
      toast.success('Staking successful');
    } catch (error) {
      toast.errorlink(error);
      console.error(error);
    }
  };

  return (
    <div>
      <h2>DevTools</h2>
      <div>
        <p className="mb-4 text-gray-700">
          Stake 1 ROAR in the LionDAO for testing & development purposes.
        </p>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useLedger.value}
              onChange={(e) => useLedger.value = e.currentTarget.checked}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Use Ledger</span>
          </label>
        </div>
        <button
          onClick={handleStake}
          className={classNames(
            'px-4 py-2',
            'bg-blue-500 hover:bg-blue-600',
            'text-white font-medium',
            'rounded-md',
            'transition-colors'
          )}
        >
          Stake
        </button>
      </div>
    </div>
  );
}
