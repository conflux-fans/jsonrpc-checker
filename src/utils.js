// require('dotenv').config();
const _ = require('lodash');
const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || process.env.ETH_RPC);
// load ERC20 contract abi and address
const GLD = require('../GLD.json');
const gld = new web3.eth.Contract(GLD.abi, GLD.address);

function buildRawTx(tx, privateKey) {
  return web3.eth.accounts.signTransaction(tx, privateKey);
}

function buildERC20Tx(target, value, privateKey) {
  const txData = gld.methods.transfer(target, value).encodeABI();
  const txMeta = {
    to: GLD.address,
    value: 0,
    gas: 500000,
    data: txData,
  };
  return buildRawTx(txMeta, privateKey);
}

function loadEthRPCschema() {
  const ETH_OPEN_RPC = require('../eth-openrpc.json');
  const ETH_METHODS = _.groupBy(ETH_OPEN_RPC.methods, 'name');
  for(let key in ETH_METHODS) {
    ETH_METHODS[key] = ETH_METHODS[key][0];
  }
  return ETH_METHODS;
}

async function waitTx(txHash) {
  let tryTime = 3000;
  while(tryTime > 0) {
    let tx = await web3.eth.getTransactionReceipt(txHash);
    if (tx) {
      return tx;
    }
    await waitNS();
    tryTime -= 1;
  }
}

function waitNS(n = 1) {
  return new Promise(resolve => setTimeout(resolve, n * 1000));
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports = {
  buildRawTx,
  buildERC20Tx,
  waitTx,
  loadEthRPCschema,
  ZERO_ADDRESS,
  ZERO_HASH,
}