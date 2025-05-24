import { CosmosNetworkConfig, signals } from '@apophis-sdk/core';
import { Cosmos } from '@apophis-sdk/cosmos';

var _network: CosmosNetworkConfig | undefined;
export async function getNetwork(): Promise<CosmosNetworkConfig> {
  if (!_network) {
    _network = await Cosmos.getNetworkFromRegistry('terra2');
    _network.endpoints = {
      rest: ['https://terra-lcd.publicnode.com'],
      rpc: ['https://terra-rpc.publicnode.com:443'],
      ws: ['wss://terra-rpc.publicnode.com:443/websocket'],
    }
  }
  signals.network.value = _network;
  return _network;
}
