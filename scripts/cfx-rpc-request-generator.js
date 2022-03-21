require('dotenv').config();
const { 
  Conflux, 
  CONST,
  format,
} = require('js-conflux-sdk');
const axios = require('axios').default;
const { ZERO_HASH, ERC20_TRANSFER_TOPIC } = require('../src/utils')
const fs = require('fs');
const txs = require('../txs.json');

const conflux = new Conflux({
  url: process.env.CFX_RPC,
  networkId: Number(process.env.CFX_NETWORK_ID),
});

const testAccount = conflux.wallet.addPrivateKey(process.env.TEST_KEY);

const CRC20_META = require('../GLD.json');

/**
 * Things to prepare:
 * 1. Which network to use: mainnet or test
 * 2. Which account to use: one new account; one used account
 * 3. Prepare serveral transactions: CFX transfer, deploy contract, interact with contract
 * 4. Prepare serveral events: CFX transfer, deploy contract, interact with contract
 * 5. Prepare block hash
 * 6. Prepare transaction hash
 */

async function addEpochTagsToParam(param, epochNumber) {
  const params = [
    param
  ];
  for(let key in CONST.EPOCH_NUMBER) {
    params.push(param.concat([CONST.EPOCH_NUMBER[key]]));
  }
  if (epochNumber) {
    params.push(param.concat([format.bigUIntHex(epochNumber)]));
  }
  return params;
}

async function epochNumberAndTags() {
  const status = await conflux.cfx.getStatus();
  const paramsArray = [
    [format.bigUIntHex(status.latestConfirmed)],
  ];
  for(let key in CONST.EPOCH_NUMBER) {
    paramsArray.push([CONST.EPOCH_NUMBER[key]]);
  }
  return paramsArray;
}

// The methods to generate example data
// The value is either a params array or a function that can generate a params array
const CORE_METHODS = {
  'cfx_getBlockByEpochNumber': [
    ['latest_state', false],
    ['latest_state', true],
    ['0x0', false],
    ['0x0', true],
    ['0x10000', false],
    ['0x10000', true],
  ],
  'cfx_getBlockByBlockNumber': [
    ['0x0', false],
    ['0x100', false],
    ['0x100', true]
  ],
  'cfx_getBlockByHash': async function() {
    const paramsArray = [];
    // null block hash
    paramsArray.push([
      ZERO_HASH,
      false,
    ]);

    // block hash
    const status = await conflux.cfx.getStatus();
    paramsArray.push([status.bestHash, false]);
    paramsArray.push([status.bestHash, true]);
    return paramsArray;
  },
  'cfx_getLogs': async function() {
    const paramsArray = [];
    // Empty object
    paramsArray.push([{}]);
    // Simple logger
    paramsArray.push([{
      "fromEpoch": "0x0", 
      "toEpoch": "0x99", 
      "limit": "0x100"
    }]);
    const fromEpoch = txs.erc20DeployReceipt.epochNumber;
    const toEpoch = fromEpoch + 999;
    // Logger with contract address
    paramsArray.push([{
      fromEpoch: format.bigUIntHex(fromEpoch),
      toEpoch: format.bigUIntHex(toEpoch),
      address: [format.address(CRC20_META.address, conflux.networkId)],
    }]);

    // Logger with contract address and topics
    paramsArray.push([{
      fromEpoch: format.bigUIntHex(fromEpoch),
      toEpoch: format.bigUIntHex(toEpoch),
      address: [format.address(CRC20_META.address, conflux.networkId)],
      topics: [ERC20_TRANSFER_TOPIC]
    }]);
    // Mix filter
    paramsArray.push([{
      fromEpoch: format.bigUIntHex(fromEpoch),
      toEpoch: format.bigUIntHex(toEpoch),
      address: [format.address(CRC20_META.address, conflux.networkId)],
      topics: [ERC20_TRANSFER_TOPIC],
      blockHashes: [
        txs.erc20DeployReceipt.blockHash, 
        txs.erc20TransferReceipt.blockHash
      ],
    }]);
    paramsArray.push([{
      address: [format.address(CRC20_META.address, conflux.networkId)],
      topics: [ERC20_TRANSFER_TOPIC],
      blockHashes: [
        txs.erc20DeployReceipt.blockHash, 
        txs.erc20TransferReceipt.blockHash
      ],
    }]);
    return paramsArray;
  },
  'cfx_getTransactionByHash': [
    [ZERO_HASH],
    [txs.cfxTransfer.hash],
    [txs.erc20Transfer.hash],
    [txs.erc20Deploy.hash],
  ],
  'cfx_getTransactionReceipt': [
    [ZERO_HASH],
    [txs.cfxTransfer.hash],
    [txs.erc20Transfer.hash],
    [txs.erc20Deploy.hash],
  ],
};

const NO_PARAM_METHODS = [
  'cfx_getStatus',
  'cfx_gasPrice',
  'cfx_clientVersion',
  'cfx_getSupplyInfo',
  'cfx_getPoSEconomics',
  'cfx_getBestBlockHash',
];

const ADDRESS_PARAM_METHODS = [
  'cfx_getAccountPendingInfo',
  'cfx_getAccountPendingTransactions'
];

const ADDRESS_AND_EPOCH_PARAM_METHODS = [
  'cfx_getBalance',
  'cfx_getStakingBalance',
  'cfx_getCollateralForStorage',
  'cfx_getAdmin',
  'cfx_getCode',
  'cfx_getStorageRoot',
  'cfx_getSponsorInfo',
  'cfx_getNextNonce',
  'cfx_getAccount',
  'cfx_getDepositList',
  'cfx_getVoteList',
];

const NUMBER_PARAM_METHODS = [
  'cfx_epochNumber',
  'cfx_getBlocksByEpoch',
  'cfx_getSkippedBlocksByEpoch',
  'cfx_getBlockRewardInfo',
  'cfx_getPoSRewardByEpoch',
  'cfx_getInterestRate',
  'cfx_getAccumulateInterestRate'
];

/* const HASH_PARAM_METHODS = [
  'cfx_getTransactionByHash',
  'cfx_getTransactionReceipt',
  'cfx_getBlockByHash',
  'cfx_getConfirmationRiskByHash',
]; */

async function generateRequests() {
  let requests = [];
  // Core methods
  for(let method in CORE_METHODS) {
    let params;
    if (Array.isArray(CORE_METHODS[method])) {
      params = CORE_METHODS[method];
    } else {
      params = await CORE_METHODS[method]();
    }
    requests.push({
      method,
      params,
    })
  }

  // No params methods
  requests = requests.concat(NO_PARAM_METHODS.map(method => ({
    method,
    params: [[]],
  })));

  // Address param methods
  requests = requests.concat(ADDRESS_PARAM_METHODS.map(method => ({
    method,
    params: [[testAccount.address]],
  })));

  const basicParams = [testAccount.address];
  const paramsWithTag = await addEpochTagsToParam(basicParams);
  requests = requests.concat(ADDRESS_AND_EPOCH_PARAM_METHODS.map(method => {
    return {
      method,
      params: paramsWithTag,
    };
  }));

  let tagParams = await epochNumberAndTags();
  requests = requests.concat(NUMBER_PARAM_METHODS.map(method => {
    return {
      method,
      params: tagParams,
    };
  }));

  // Address and epoch param methods
  fs.writeFileSync('./requests.json', JSON.stringify(requests, null, 2));
  return requests;
}

async function main() {
  console.log('Start generating')
  await generateRequests()
  console.log('Generate finished');
}

main().catch(console.log);