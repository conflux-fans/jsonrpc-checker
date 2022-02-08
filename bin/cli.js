require('dotenv').config();
const debug = require('debug')('OPENRPC-CHECKER');
const Provider = require('eth-provider');
const checkSchema = require('../src/checkers');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
// const utils = require('../src/utils');

// load web3
const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || process.env.ETH_RPC);

// load ERC20 contract
const GLD = require('../GLD.json');
const gld = new web3.eth.Contract(GLD.abi, GLD.address);

// load the eth openrpc file
// Method schema
const ETH_OPEN_RPC = require('../eth-openrpc.json');
const ETH_METHODS = _.groupBy(ETH_OPEN_RPC.methods, 'name');
for(let key in ETH_METHODS) {
  ETH_METHODS[key] = ETH_METHODS[key][0];
}

const { program } = require('commander');
program.version('0.0.1');

program
  .option('-d, --debug', 'output extra debugging')

program
  .command('buildRawTx')
  .argument('[to]', 'Transaction receiver', 'to')
  .argument('[value]', 'Transaction value', 'value')
  .action(async (to, value) => {
    const txMeta = {
      to,
      value,
      gas: 200000,
    };

    const tx = await web3.eth.accounts.signTransaction(txMeta, process.env.PRIVATE_KEY);
    console.log(tx);
  });

program
  .command('buildTransferTx')
  .argument('[to]', 'Transaction receiver', 'to')
  .argument('[value]', 'Transaction value', 'value')
  .action(async (to, value) => {
    const txData = gld.methods.transfer(to, value).encodeABI();
    const txMeta = {
      to: GLD.address,
      value: 0,
      gas: 500000,
      data: txData,
    };
    const tx = await web3.eth.accounts.signTransaction(txMeta, process.env.PRIVATE_KEY);
    console.log(tx);
  });

program
  .command('check <file>')
  .description('check rpc methods according the config file')
  .action(async (file) => {
    const fileName = path.join(__dirname, '../', file);
    if (!fs.existsSync(fileName)) {
      console.log(`Config file "${file}" not found`);
      return;
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(fileName, 'utf8'));
      const { checkTasks, endpoint } = config;
      const provider = Provider(endpoint);
      for(let task of checkTasks) {
        console.log(`\n======== Checking ${task.method} ========`);
        const taskSchema = ETH_METHODS[task.method];
        if (!taskSchema) {
          console.log(`Can't find schema for ${task.method}`);
          continue;
        }

        if (task.preRequests) {
          // TODO support multiple preRequest
          let result;
          for(let i = 0; i < task.preRequests.length; i++) {
            result = await provider.request(task.preRequests[i]);
          }
        
          task.params[0] = result;
        }
        
        const result = await provider.request(task);
        const reports = checkSchema(task.method, result, taskSchema.result.schema);
        if (options.debug) {
          console.log(`${task.method} return: `, result);
        }
        if (reports.length === 0) {
          console.log(`Check for ${task.method} is passed`);
          continue;
        }
        console.log(`Check for ${task.method} is failed`);
        console.log(JSON.stringify(reports, null, 2));
        console.log('\n');
      }
    } catch (e) {
      console.log("check error: ", e);
    }
  });

program.parse(process.argv);

const options = program.opts();
// if (options.debug) console.log(options);