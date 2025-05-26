import { signals as apophisSignals, CosmosNetworkConfig } from '@apophis-sdk/core';
import { Cosmos } from '@apophis-sdk/cosmos';
import { Contract, CosmWasm } from '@apophis-sdk/cosmwasm';
import { toast, modals, forgetSigner } from '@kiruse/cosmos-components';
import { Decimal } from '@kiruse/decimal';
import { useComputed, useSignal } from '@preact/signals';
import { bech32 } from '@scure/base';
import cx from 'classnames';
import { getNetwork } from '~/config';
import { useAsyncComputed } from '~/hooks/useAsyncComputed';
import { impersonateAddress, refreshCounter, useLedger } from '~/state';
import EnterpriseDev from './EnterpriseDev';

type RecoveryType = 'token' | 'nft' | 'unknown';
type MembershipContractDetails = {
  type: RecoveryType;
  address: string;
}

type ReleaseAt = ReleaseAtTimestamp | ReleaseAtHeight;
type ReleaseAtTimestamp = {
  timestamp: string;
}
type ReleaseAtHeight = {
  height: string;
}

const KNOWN_ADDRESSES = {
  'Lion DAO': 'terra17c6ts8grcfrgquhj3haclg44le8s7qkx6l2yx33acguxhpf000xqhnl3je',
  'pixeLions DAO': 'terra1exj6fxvrg6xuukgx4l90ujg3vh6420540mdr6scrj62u2shk33sqnp0stl',
  'pyROARmaniacs DAO': 'terra16vl35edwt5c2904l7zlezv5kr6fwzjk78mc6wmf9rzutxxc7nfksymzuce',
  'Orne DAO': 'terra1x8wyy2tmvwn5nm23maxry80mkpxn65x2ghs0q3ktnk5y62wj5x7s5vsg79',
  'Sailing the Seas DAO': 'terra1ydkvywwnl3j84tcntcwjmzgjc5u2vrqpcyjzn3slvwcpjke6nzhstm5a0g',
};

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

  const impersonateAddressValid = useComputed(() => {
    if (apophisSignals.signer.value && !impersonateAddress.value.trim()) return true;
    try {
      bech32.decode(impersonateAddress.value as `${string}1${string}`);
      return true;
    } catch {
      return false;
    }
  });

  const recoveryType = useAsyncComputed<MembershipContractDetails>({ type: 'unknown', address: '' }, async () => {
    try {
      const network = apophisSignals.network.value as CosmosNetworkConfig;
      if (!network) throw new Error('Network not found');
      if (!treasuryAddress.value) return { type: 'unknown', address: '' };

      const adminContract = await getAdminContract(network, treasuryAddress.value);
      const membershipContract = await getMembershipContract(network, adminContract);
      checkVersion(network, adminContract);

      const { contract: contractName } = await CosmWasm.query.contractInfo(network, membershipContract) ?? {};
      if (!contractName) return { type: 'unknown', address: '' };

      switch (contractName) {
        case 'crates.io:nft-staking-membership':
          return { type: 'nft', address: membershipContract };
        case 'crates.io:token-staking-membership':
          return { type: 'token', address: membershipContract };
        default:
          return { type: 'unknown', address: '' };
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

        {/* Check address input */}
        <div class="mb-6 space-y-4">
          <p class="text-sm text-gray-600 mb-2">
            You can check any arbitrary address, but if you wish to unstake or claim you must connect your wallet and keep this field empty.
          </p>
          <div>
            <label for="check-address" class="block text-sm font-medium text-gray-700 mb-1">
              Check address
            </label>
            <input
              type="text"
              id="check-address"
              value={impersonateAddress.value}
              onInput={(e) => impersonateAddress.value = e.currentTarget.value}
              class={cx(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                {
                  'border-gray-300 focus:ring-blue-500 focus:border-blue-500': impersonateAddressValid.value,
                  'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500': !impersonateAddressValid.value,
                }
              )}
              placeholder="Enter address to check"
            />
          </div>
          {!!apophisSignals.signer.value ? (
            <button
              onClick={() => {
                apophisSignals.signer.value = undefined;
                forgetSigner();
              }}
              class="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Disconnect wallet
            </button>
          ) : (
            <button
              onClick={() => getNetwork().then(network => modals.showWalletModal([network]))}
              class="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Connect wallet
            </button>
          )}
          {!impersonateAddressValid.value && impersonateAddress.value && (
            <p class="mt-2 text-sm text-red-600">
              Please enter a valid Terra address
            </p>
          )}
        </div>

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
            <div class="mt-2">
              <label for="known-addresses" class="block text-sm font-medium text-gray-700 mb-1">
                Known Addresses
              </label>
              <select
                id="known-addresses"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const selectedAddress = e.currentTarget.value;
                  if (selectedAddress) {
                    treasuryAddress.value = selectedAddress;
                  }
                }}
              >
                <option value="">Select a known address</option>
                {Object.entries(KNOWN_ADDRESSES).map(([name, address]) => (
                  <option key={address} value={address}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {recoveryType.value.type !== 'unknown' && (
        <div class="mt-6 bg-white rounded-lg shadow p-6">
          {recoveryType.value.type === 'token'
            ? <TokenRecovery address={recoveryType.value.address} />
            : <NftRecovery address={recoveryType.value.address} />
          }
        </div>
      )}

      {import.meta.env.VITE_NODE_ENV === 'development' && (
        <div class="mt-6 bg-white rounded-lg shadow p-6">
          <EnterpriseDev />
        </div>
      )}
    </div>
  );
}

function NftRecovery({ address }: { address: string }) {
  useAsyncComputed<string[]>([], async () => {
    try {
      const network = apophisSignals.network.value as CosmosNetworkConfig;
      if (!network) throw new Error('Network not found');
      if (!address || !apophisSignals.address.value) return [];

      const { total_user_stake, tokens } = await CosmWasm.query.smart<any>(network, address, CosmWasm.toBinary({
        user_stake: {
          user: apophisSignals.address.value,
        },
      }));
      console.log('Staked NFTs:', total_user_stake, tokens);
      return tokens;
    } catch (error) {
      toast.errorlink(error);
      throw error;
    }
  });

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

type TokenStake = {
  total: bigint;
  pending: TokenClaim[];
  claimable: TokenClaim[];
}

type TokenClaim = {
  id: string;
  user: string;
  amount: string;
  release_at: ReleaseAt;
}

const defaultTokenStake: TokenStake = { total: 0n, pending: [], claimable: [] };

function TokenRecovery({ address }: { address: string }) {
  const userAddress = useComputed(() => impersonateAddress.value || apophisSignals.address.value);

  const stake = useAsyncComputed<TokenStake>(defaultTokenStake, async () => {
    console.log('refresh counter:', refreshCounter.value);
    try {
      const network = apophisSignals.network.value as CosmosNetworkConfig;
      if (!network) throw new Error('Network not found');
      if (!address) throw new Error('Failed to get Membership Contract');
      if (!userAddress.value) throw new Error('Please provide an address');

      const { weight } = await CosmWasm.query.smart<any>(network, address, CosmWasm.toBinary({
        user_weight: {
          user: userAddress.value,
        },
      }));

      const { claims: pending } = await CosmWasm.query.smart<{ claims: TokenClaim[] }>(network, address, CosmWasm.toBinary({
        claims: {
          user: userAddress.value,
        },
      }));

      const { claims: claimable } = await CosmWasm.query.smart<{ claims: TokenClaim[] }>(network, address, CosmWasm.toBinary({
        releasable_claims: {
          user: userAddress.value,
        },
      }));

      return {
        total: BigInt(weight),
        pending,
        claimable,
      };
    } catch (error) {
      toast.errorlink(error);
      throw error;
    }
  });

  const stakedTokens = useComputed(() => new Decimal(stake.value.total, 6));
  const pendingTokens = useComputed(() => stake.value.pending.reduce((acc, claim) => acc.add(new Decimal(BigInt(claim.amount), 6)), new Decimal(0, 6)));
  const claimableTokens = useComputed(() => stake.value.claimable.reduce((acc, claim) => acc.add(new Decimal(BigInt(claim.amount), 6)), new Decimal(0, 6)));

  if (stake.error) {
    return (
      <div class="flex items-center justify-center h-full">
        <p class="text-red-500">
          Error: {stake.error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <h3 class="text-lg font-semibold mb-4">Token Recovery</h3>
      <div class="text-gray-600">
        {!!stake.value && (
          <>
            <p class="mb-2">
              You have <cosmos-balance value={stakedTokens} denom="tokens" /> tokens staked,{' '}
              <cosmos-balance value={pendingTokens} denom="tokens" /> pending, and{' '}
              <cosmos-balance value={claimableTokens} denom="tokens" /> claimable.
            </p>
            <div class="mb-2 flex space-x-2">
              <button
                onClick={async () => {
                  if (!apophisSignals.address.value)
                    return toast.error('Please connect your wallet');
                  if (userAddress.value !== apophisSignals.address.value)
                    return toast.error('You cannot unstake tokens for an impersonated address');

                  const network = apophisSignals.network.value as CosmosNetworkConfig;
                  if (!network) throw new Error('Network not found');

                  if (!apophisSignals.signer.value) throw new Error('Signer not found');

                  try {
                    const tx = Cosmos.tx([
                      new Contract.Execute({
                        sender: apophisSignals.address.value,
                        contract: address,
                        msg: CosmWasm.toBinary({
                          unstake: {
                            amount: stake.value.total.valueOf().toString(),
                          },
                        }),
                      }),
                    ]);

                    await tx.estimateGas(network, apophisSignals.signer.value, true);
                    await apophisSignals.signer.value.sign(network, tx);
                    await tx.broadcast();
                    await Cosmos.ws(network).expectTx(tx, 30000);

                    refreshCounter.value++;
                    toast.success('Unstaking request submitted.');
                  } catch (error) {
                    toast.errorlink(error);
                    console.error(error);
                  }
                }}
                disabled={stakedTokens.value.equals(new Decimal(0))}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Unstake
              </button>
              <button
                onClick={async () => {
                  if (!apophisSignals.address.value)
                    return toast.error('Please connect your wallet');
                  if (userAddress.value !== apophisSignals.address.value)
                    return toast.error('You cannot unstake tokens for an impersonated address');

                  const network = apophisSignals.network.value as CosmosNetworkConfig;
                  if (!network) throw new Error('Network not found');

                  if (!apophisSignals.signer.value) throw new Error('Signer not found');

                  try {
                    const tx = Cosmos.tx([
                      new Contract.Execute({
                        sender: apophisSignals.address.value,
                        contract: address,
                        msg: CosmWasm.toBinary({
                          claim: {},
                        }),
                      }),
                    ]);

                    await tx.estimateGas(network, apophisSignals.signer.value, true);
                    await apophisSignals.signer.value.sign(network, tx);
                    await tx.broadcast();
                    await Cosmos.ws(network).expectTx(tx, 30000);

                    refreshCounter.value++;
                    toast.success('Tokens claimed. Check your wallet!');
                  } catch (error) {
                    toast.errorlink(error);
                    console.error(error);
                  }
                }}
                disabled={claimableTokens.value.equals(new Decimal(0))}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Claim
              </button>
            </div>
            <div className="mt-4">
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
            <p className="text-gray-600">
              Note that the balance may be off if the token deviates from the standard 6 decimals.
            </p>
          </>
        )}
      </div>
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
