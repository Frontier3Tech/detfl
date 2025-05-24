import { signals as apophisSignals, CosmosNetworkConfig } from '@apophis-sdk/core';
import { CosmWasm } from '@apophis-sdk/cosmwasm';
import { toast } from '@kiruse/cosmos-components';
import { useComputed, useSignal } from '@preact/signals';
import { bech32 } from '@scure/base';
import cx from 'classnames';
import { useAsyncComputed } from '~/hooks/useAsyncComputed';

type RecoveryType = 'token' | 'nft' | 'unknown';

const LION_DAO_ADDRESS = 'terra17c6ts8grcfrgquhj3haclg44le8s7qkx6l2yx33acguxhpf000xqhnl3je';
const PIXELIONS_DAO_ADDRESS = 'terra1exj6fxvrg6xuukgx4l90ujg3vh6420540mdr6scrj62u2shk33sqnp0stl';

export default function Enterprise() {
  const treasuryAddress = useSignal('');
  const validAddress = useComputed(() => {
    try {
      bech32.decode(treasuryAddress.value as `${string}1${string}`);
      return true;
    } catch {
      return false;
    }
  });

  const recoveryType = useAsyncComputed<RecoveryType>('unknown', async () => {
    try {
      const network = apophisSignals.network.value as CosmosNetworkConfig;
      if (!network) throw new Error('Network not found');
      if (!treasuryAddress.value) return 'unknown';

      const adminContract = await getAdminContract(network, treasuryAddress.value);
      const membershipContract = await getMembershipContract(network, adminContract);
      checkVersion(network, adminContract);

      const { contract: contractName } = await CosmWasm.query.contractInfo(network, membershipContract) ?? {};
      if (!contractName) return 'unknown';

      switch (contractName) {
        case 'crates.io:nft-staking-membership':
          return 'nft';
        case 'crates.io:token-staking-membership':
          return 'token';
        default:
          return 'unknown';
      }
    } catch (error) {
      toast.errorlink(error);
      throw error;
    }
  }, false);

  return (
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Recover Assets from Enterprise</h2>
        <p class="text-gray-600 mb-6">
          Token & NFT recovery from Enterprise staking contracts.
        </p>

        {/* Address input */}
        <div class="space-y-4">
          <div>
            <label for="treasury-address" class="block text-sm font-medium text-gray-700 mb-1">
              Treasury Address
            </label>
            <input
              type="text"
              id="treasury-address"
              value={treasuryAddress.value}
              onInput={(e) => treasuryAddress.value = e.currentTarget.value}
              class={cx(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                {
                  'border-gray-300 focus:ring-blue-500 focus:border-blue-500': validAddress.value,
                  'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500': !validAddress.value,
                }
              )}
              placeholder="Enter treasury address"
            />
            {!validAddress.value && treasuryAddress.value && (
              <p class="mt-2 text-sm text-red-600">
                Please enter a valid Terra address
              </p>
            )}
          </div>

          {/* Address shortcut buttons */}
          <div class="flex space-x-4">
            <button
              onClick={() => treasuryAddress.value = LION_DAO_ADDRESS}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Lion DAO
            </button>
            <button
              onClick={() => treasuryAddress.value = PIXELIONS_DAO_ADDRESS}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              pixeLions DAO
            </button>
          </div>
        </div>
      </div>

      {recoveryType.value !== 'unknown' && (
        <div class="mt-6 bg-white rounded-lg shadow p-6">
          {recoveryType.value === 'token' ? <TokenRecovery /> : <NftRecovery />}
        </div>
      )}
    </div>
  );
}

function NftRecovery() {
  return (
    <>
      <h3 class="text-lg font-semibold mb-4">NFT Recovery</h3>
      <p class="mt-2">
        Unstaking NFTs from Enterprise has already been implemented by another project. You can find
        a short guide on how to do it <a href="https://x.com/rebel_defi/status/1881598145207181766" target="_blank" class="text-blue-500">here</a>.
      </p>
      <h4 class="text-lg font-semibold mb-2 mt-4">TL;DR:</h4>
      <p class="mt-2">
        Head over to <a href="https://www.boostdao.io/ignite/permissionless-terra" target="_blank" class="text-blue-500">boostdao.io</a>
        and start listing an NFT for sale. This should give you the option to unstake the NFT from Enterprise before listing it.
      </p>
      <p class="mt-2">
        As this should be fairly similar to unstaking fungible tokens, I will add this functionality here as well, eventually.
      </p>
    </>
  );
}

function TokenRecovery() {
  return (
    <>
      <h3 class="text-lg font-semibold mb-4">Token Recovery</h3>
      <p class="text-gray-600">
        Token recovery interface will be implemented here.
      </p>
    </>
  );
}

async function checkVersion(network: CosmosNetworkConfig, govctrlContract: string) {
  const { enterprise_contract: enterpriseContract } = await CosmWasm.query.smart<any>(network, govctrlContract, CosmWasm.toBinary({
    config: {},
  }));

  const { dao_version } = await CosmWasm.query.smart<any>(network, enterpriseContract, CosmWasm.toBinary({
    dao_info: {},
  }));

  const ver = `${dao_version.major}.${dao_version.minor}.${dao_version.patch}`;
  if (ver !== '1.2.1') toast.warn('This DAO is not on version 1.2.1. This tool might not work as expected.');
  else console.info(`DAO ${enterpriseContract} is on version 1.2.1`);
}

async function getAdminContract(network: CosmosNetworkConfig, treasuryAddress: string) {
  const { admin } = await CosmWasm.query.smart<any>(network, treasuryAddress, CosmWasm.toBinary({
    config: {},
  }));
  return admin;
}

async function getMembershipContract(network: CosmosNetworkConfig, adminContract: string) {
  const { dao_membership_contract } = await CosmWasm.query.smart<any>(network, adminContract, CosmWasm.toBinary({
    gov_config: {},
  }));
  return dao_membership_contract;
}
