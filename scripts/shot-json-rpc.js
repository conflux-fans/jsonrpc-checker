require('dotenv').config();
const { 
  Conflux, 
  CONST,
  format,
} = require('js-conflux-sdk');
const txGenerator = require('../src/cfxRawTxGenerator');
const axios = require('axios').default;
const { ZERO_ADDRESS, ZERO_HASH } = require('../src/utils')
const txs = require('../txs.json');

const conflux = new Conflux({
  url: process.env.CFX_RPC,
  networkId: Number(process.env.CFX_NETWORK_ID),
});

const testAccount = conflux.wallet.addPrivateKey(process.env.TEST_KEY);

/**
 * Things to prepare:
 * 1. Which network to use: mainnet or test
 * 2. Which account to use: one new account; one used account
 * 3. Prepare serveral transactions: CFX transfer, deploy contract, interact with contract
 * 4. Prepare serveral events: CFX transfer, deploy contract, interact with contract
 * 5. Prepare block hash
 * 6. Prepare transaction hash
 */

async function request(req) {
  const { data } = await axios.post(process.env.CFX_RPC, req);
  return data;
}

async function addEpochTagsToParam(param, epochNumber) {
  const params = [
    param
  ];
  for(let key in CONST.EPOCH_NUMBER) {
    params.push(param.concat([CONST.EPOCH_NUMBER[key]]));
  }
  if (epochNumber) {
    params.push(param.concat([format.hex(epochNumber)]));
  }
  return params;
}

// The methods to generate example data
// The value is either a params array or a function that can generate a params array
const CFX_METHODS = {
  'cfx_getStatus': [
    [], // no params
  ],
  'cfx_epochNumber': function() {
    return addEpochTagsToParam([]);
  },
  'cfx_getBalance': function () {
    const param = [testAccount.address];
    return addEpochTagsToParam(param);
  },
  'cfx_getNextNonce': function() {
    const param = [testAccount.address];
    return addEpochTagsToParam(param);
  },
  'cfx_getAccount': function() {
    const param = [testAccount.address];
    return addEpochTagsToParam(param);
  },
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
  'cfx_getBlocksByEpoch': [
    ['latest_state', false],
    ['latest_state', true],
    ['0x0', false],
    ['0x0', true],
    ['0x10000', false],
    ['0x10000', true],
  ],
  'cfx_getLogs': [],  // TODO
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

async function generateRequests() {
  const requests = [];
  for(let method in CFX_METHODS) {
    let params;
    if (Array.isArray(CFX_METHODS[method])) {
      params = CFX_METHODS[method];
    } else {
      params = await CFX_METHODS[method]();
    }
    requests.push({
      method,
      params,
    })
  }

  return requests;
}

async function main() {
  console.log('Start generating')
  console.log(await generateRequests());
}

main().catch(console.log);