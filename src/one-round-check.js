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
  const rawTx = await utils.buildERC20Tx(process.env.ETH_ADDRESS, 100, process.env.PRIVATE_KEY);
  
  // send tx
  const txHash = await provider.request({
    method: 'eth_sendRawTransaction',
    params: [rawTx.rawTransaction]
  });

  // wait tx
  await utils.waitTx(txHash);
  // query tx
  const tx = await provider.request({
    method: 'eth_getTransactionByHash',
    params: [txHash]
  });
  reports = checkSchema('tx', tx, RPCschema['eth_getTransactionByHash'].result.schema);
  if (reports.length > 0) {
    console.log('Checking TX', reports);
  }
  // console.log('TX', tx);

  // query receipt
  const receipt = await provider.request({
    method: 'eth_getTransactionReceipt',
    params: [txHash]
  });
  reports = checkSchema('Receipt', receipt, RPCschema['eth_getTransactionReceipt'].result.schema);
  if (reports.length > 0) {
    console.log('Checking receipt', reports);
  }

  // query block
  const block = await provider.request({
    method: 'eth_getBlockByNumber',
    params: [receipt.blockNumber, false]
  });
  reports = checkSchema('Block', block, RPCschema['eth_getBlockByNumber'].result.schema);
  if (reports.length > 0) {
    console.log('Checking block', reports);
  }

  // query log
  const logs = await provider.request({
    method: 'eth_getLogs',
    params: [{
      fromBlock: block.number,
      toBlock: block.number,
    }]
  });
  reports = checkSchema('Logs', logs, RPCschema['eth_getLogs'].result.schema);
  if (reports.length > 0) {
    console.log('Checking logs', reports);
  }

  console.log('\nOne round(send, tx, receipt, block, log) checking finished.\n');
}

main().catch(console.log);