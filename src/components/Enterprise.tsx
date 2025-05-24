import { useComputed, useSignal } from '@preact/signals';
import { bech32 } from '@scure/base';
import classNames from 'classnames';

const LION_DAO_ADDRESS = 'terra17c6ts8grcfrgquhj3haclg44le8s7qkx6l2yx33acguxhpf000xqhnl3je';
const PIXELIONS_DAO_ADDRESS = 'terra1exj6fxvrg6xuukgx4l90ujg3vh6420540mdr6scrj62u2shk33sqnp0stl';

export default function Enterprise() {
  const treasuryAddress = useSignal('');
  const recoveryType = useSignal<'token' | 'nft'>('token');
  const validAddress = useComputed(() => {
    try {
      bech32.decode(treasuryAddress.value as `${string}1${string}`);
      return true;
    } catch {
      return false;
    }
  });

  return (
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Recover Enterprise Tokens</h2>
        <p class="text-gray-600 mb-6">
          Token & NFT recovery from Enterprise staking contracts.
        </p>

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
              class={classNames(
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

      {validAddress.value && (
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
      <h4 class="text-lg font-semibold mb-2">TL;DR:</h4>
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
