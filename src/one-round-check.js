// send ETH tx and check tx, block, receipt, log
require('dotenv').config();
const Provider = require('eth-provider');
const provider = Provider(process.env.ETH_RPC);
const utils = require('./utils');
const checkSchema = require('./checkers');
const RPCschema = utils.loadEthRPCschema();

async function main() {
  let reports = [];
  // build tx
  // const rawTx = await utils.buildERC20Tx(process.env.ETH_ADDRESS, 100, process.env.PRIVATE_KEY);
  const rawTx = await utils.buildRawTx({
    to: process.env.ETH_ADDRESS, 
    value: 100,
    gas: 21000,
  }, process.env.PRIVATE_KEY);
  
  // send tx
  const txHash = await provider.request({
    method: 'eth_sendRawTransaction',
    params: [rawTx.rawTransaction]
  });
  console.log('txHash', txHash);

  // wait tx
  await utils.waitTx(txHash);
  // query tx
  const tx = await provider.request({
    method: 'eth_getTransactionByHash',
    params: [txHash]
  });
  doTheCheck('tx', tx, 'eth_getTransactionByHash');

  // query receipt
  const receipt = await provider.request({
    method: 'eth_getTransactionReceipt',
    params: [txHash]
  });
  doTheCheck('Receipt', receipt, 'eth_getTransactionReceipt');

  // query block
  const block = await provider.request({
    method: 'eth_getBlockByNumber',
    params: [receipt.blockNumber, false]
  });
  doTheCheck('Block', block, 'eth_getBlockByNumber');

  // query log
  const logs = await provider.request({
    method: 'eth_getLogs',
    params: [{
      fromBlock: block.number,
      toBlock: block.number,
    }]
  });
  doTheCheck('logs', logs, 'eth_getLogs');

  console.log('\nOne round(send, tx, receipt, block, log) checking finished.\n');
}

function doTheCheck(field, data, schemaName) {
  let reports = checkSchema(field, data, RPCschema[schemaName].result.schema);
  if (reports.length > 0) {
    console.log('Checking logs', reports);
  }
};

main().catch(console.log);