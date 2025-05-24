import { Apophis } from '@apophis-sdk/core';
import { DefaultCosmWasmMiddlewares } from '@apophis-sdk/cosmwasm';
import { CosmosComponents, reconnectSigner } from '@kiruse/cosmos-components';
import '@kiruse/cosmos-components/preact.js';
import { render } from 'preact';
import App from './App';
import { getNetwork } from './config';
import './styles/main.sass';

async function initialize() {
  try {
    Apophis.use(...DefaultCosmWasmMiddlewares);
    CosmosComponents.register();

    const network = await getNetwork();
    reconnectSigner([network]);

    render(<App />, document.getElementById('app')!);
  } catch (error) {
    console.error(error);
    render(
      <div class="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div class="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <h2 class="text-xl font-semibold text-red-600 mb-2">Initialization Failed</h2>
          <p class="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <button
            onClick={() => initialize()}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>,
      document.getElementById('app')!
    );
  }
}

render(
  <div class="fixed inset-0 flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <cosmos-spinner size="xxs" />
      <div class="mt-4 text-gray-600">Initializing...</div>
    </div>
  </div>,
  document.getElementById('app')!
);
initialize();
