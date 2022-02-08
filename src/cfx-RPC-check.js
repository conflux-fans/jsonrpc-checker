require('dotenv').config();
const assert = require('assert');
const Provider = require('eth-provider');
const provider = Provider(process.env.ETH_RPC);
let cfxProvider = Provider(process.env.CFX_RPC);
const { Conflux } = require('js-conflux-sdk');
const conflux = new Conflux({
  url: process.env.CFX_RPC,
  networkId: 8888
});
cfxProvider = conflux.provider;

/*
此脚本用于检查 EVM space 的增加，不对 cfx RPC 产生影响，保证现有 RPC 方法的兼容性。

To check methods:
1. cfx_getBlock
2. cfx_getLogs

To check logic:
1. ETH tx and log data is filtered out.
2. Tx index in block is correct.
*/
const ETH_TX_HASH = '0x75c0d37bf1bbc8e7ff78f3103d0d88ef664248f13575becf51cf3a9f37909451';
const ETH_TX_WITH_LOGS_HASH = '0x0eb80e299ce6fa8fdcf79582d5b12e947477b1d2d64d8661eae9ab13f10cfc05';
const BLOCK_HAVE_BOTH_TX_HASH = '0xdfce1d0d16c5bd3993931f6e2e4b4f984fb69a6ee98efcb672c19458d89f1108';

async function main() {
  // checkBlockTx();
  checkLogs();
  console.log('Finished');
}

main().catch(console.log);

async function checkBlockTx() {
  const tx = await provider.request({
    method: 'eth_getTransactionByHash',
    params: [ETH_TX_HASH]
  });

  let cfxBlock = await cfxProvider.call('cfx_getBlockByEpochNumber', tx.blockNumber, false);
  assert(cfxBlock.transactions.indexOf(ETH_TX_HASH) === -1, 'tx should not found in cfx block');

  cfxBlock = await cfxProvider.call('cfx_getBlockByHash', tx.blockHash, false);
  assert(cfxBlock.transactions.indexOf(ETH_TX_HASH) === -1, 'tx should not found in cfx block');
}

async function checkLogs() {
  const tx = await provider.request({
    method: 'eth_getTransactionByHash',
    params: [ETH_TX_WITH_LOGS_HASH]
  });

  /* const receipts = await provider.request({
    method: 'eth_getTransactionReceipt',
    params: [ETH_TX_WITH_LOGS_HASH],
  }); */

  const logs = await provider.request({
    method: 'eth_getLogs',
    params: [{
      blockHash: tx.blockHash,
    }]
  });

  assert(logs.length > 0, 'block should have logs');

  const cfxLogs = await cfxProvider.call('cfx_getLogs', {
    blockHashes: [tx.blockHash],
  });
  // TODO use a better way to check cfx block does not have eth logs
  assert(cfxLogs.length === 0, 'cfx block should not contain eth logs');
}

// Check whether the tx index in cfx block is correct.
async function checkCfxBlockTxIndex() {

}