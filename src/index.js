require('dotenv').config();
const Provider = require('eth-provider');
const provider = Provider(process.env.ETH_RPC);
const ETH_OPEN_RPC = require('../eth-openrpc.json');
const _ = require('lodash');
const methods = _.groupBy(ETH_OPEN_RPC.methods, 'name');
const checkSchema = require('./checkers');
const debug = require('debug')('OPENRPC-CHECKER');

/*
1. Check method in a specify sequence
2. Check method's all parameter
3. Check different response case
*/

const sampleAddress = '0x0D2418c13e6d48bEEE26f2CF42d67Dfe0b0613DE';

async function main() {
  // await basicCheck();
  // await checkBlockByNumberAndHash();
  await checkTransactionByHash();
  // await checkTransactionReceipt();
}

main().catch(console.log);

async function basicCheck() {
  const toTestMethods = [
    // {
    //   name: 'eth_getBlockTransactionCountByHash'
    // }, 
    // {
    //   name: 'eth_getBlockTransactionCountByNumber'
    // }, 
    // {
    //   name: 'eth_getUncleCountByBlockHash',
    // }, 
    // {
    //   name: 'eth_getUncleCountByBlockNumber'
    // }, 
    {
      name: 'eth_protocolVersion'
    }, 
    {
      name: 'eth_coinbase'
    }, 
    {
      name: 'eth_gasPrice',
    }, 
    {
      name: 'eth_mining'
    }, 
    {
      name: 'eth_hashrate'
    }, 
    {
      name: 'eth_getBalance',
      params: [sampleAddress]
    }, 
    {
      name: 'eth_getTransactionCount',
      params: [sampleAddress]
    }
  ];

  for(let method of toTestMethods) {
    const result = await provider.request({method: method.name, params: method.params || []});
    const reports = checkSchema(method.name, result, methods[method.name][0].result.schema);
    if (reports.length > 0) {
      console.log(method.name, reports);
    }
  }

}

async function checkBlockByNumberAndHash() {
  const blockNumber = await provider.request({
    method: 'eth_blockNumber',
  });
  // console.log(blockNumber);
  const block = await provider.request({
    method: 'eth_getBlockByNumber',
    params: [blockNumber, false],
  });
  const methodMeta = methods.eth_getBlockByNumber;
  const resultSchema = methodMeta[0].result.schema;
  const reports = checkSchema('block', block, resultSchema);
  console.log(reports);
}

async function checkTransactionByHash() {
  const txHash = '0x36eaaa41253b05a039d75c28197ad819750f12fe7f28567decbec0d584db6c81';
  const req = {
    method: 'eth_getTransactionByHash',
    params: [txHash]
  }
  const tx = await provider.request(req);
  debug("Transaction: ", tx);
  const reports = checkSchema('tx', tx, methods.eth_getTransactionByHash[0].result.schema);
  console.log(reports);
}

async function checkTransactionReceipt() {
  const txHash = '0x36eaaa41253b05a039d75c28197ad819750f12fe7f28567decbec0d584db6c81';
  const req = {
    method: 'eth_getTransactionReceipt',
    params: [txHash]
  }
  const receipt = await provider.request(req);
  debug("Transaction: ", receipt);
  const reports = checkSchema('receipt', receipt, methods.eth_getTransactionReceipt[0].result.schema);
  console.log(reports);
}

async function checkGetLogs() {
  // TODO
}