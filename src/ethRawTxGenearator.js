// require('dotenv').config();
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