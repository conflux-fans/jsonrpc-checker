import "dotenv/config";
import utils from './utils/index.js';
import { ETHValidators } from './utils/validators.mjs';

const validateBlock = ETHValidators['eth_getBlockByNumber'];
const validateTx = ETHValidators['eth_getTransactionByHash'];
const validateReceipt = ETHValidators['eth_getTransactionReceipt'];
const validateLogs = ETHValidators['eth_getLogs'];

/*
* Check RPCS
* 1. getBlockByNumber
* 2. getTransactionByHash
* 3. getTransactionReceipt
* 4. getLogs
*/ 
let startBlockNumber = 55095000;
startBlockNumber = 68688210;

async function main() {
  let currentBlock = startBlockNumber;
  while(true) {
    // get block
    let { result: block}  = await utils.request(process.env.ETH_RPC, {
      method: 'eth_getBlockByNumber',
      params: [utils.formatHex(currentBlock), false]
    });

    if (!block) break;

    console.log(block.number, block.transactions.length);

    // validate block
    let blockValid = validateBlock(block);
    if (!blockValid && validateBlock.errors.length > 0 && validateBlock.errors[0].instancePath !== '/transactions') {
      console.log(`Block ${currentBlock} validate failed: `, validateBlock.errors);
    }

    if (block && block.transactions.length > 0) {
      for (let hash of block.transactions) {
        // get transaction
        let { result: transaction }  = await utils.request(process.env.ETH_RPC, {
          method: 'eth_getTransactionByHash',
          params: [hash]
        });
        let txValid = validateTx(transaction);
        if (!txValid && validateTx.errors.length > 0) {
          console.log(`Transaction ${hash} validate failed: `, validateTx.errors, transaction);
        }

        // get receipt
        let { result: receipt } = await utils.request(process.env.ETH_RPC, {
          method: 'eth_getTransactionReceipt',
          params: [hash]
        });
        let receiptValid = validateReceipt(receipt);
        if (!receiptValid && validateReceipt.errors.length > 0) {
          console.log(`Receipt ${hash} validate failed: `, validateReceipt.errors, receipt);
        }
        // console.log(receipt);
        if (receipt.logs.length > 0) {
          let logs = await utils.request(process.env.ETH_RPC, {
            method: 'eth_getLogs',
            params: [{
              blockHash: receipt.blockHash,
            }]
          });
          // check logs
          let logsValid = validateLogs(logs.result);
          if (!logsValid && validateLogs.errors.length > 0) {
            console.log(`Logs ${receipt.blockHash} validate failed: `, validateLogs.errors, logs.result);
          }
        }
      }
      // TODO add logs RPCs
    }
    currentBlock += 1;
    await utils.waitNS(0.1);
  }
}

main().catch(console.log);