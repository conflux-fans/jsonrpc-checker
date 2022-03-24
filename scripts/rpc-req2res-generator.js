require('dotenv').config();
const requests = require('../build/requests.json');
const { request } = require('../src/utils');
const fs = require('fs');
const path = require('path');

const examples = {};
async function main() {
  for(let rpc of requests) {
    const method = rpc.method;
    examples[method] = [];
    for(let params of rpc.params) {
      let req = {
        method,
        params
      };
      let res = await request(process.env.CFX_RPC, req);
      let oneExample = {
        name: `${method}-${params.join('-')}`,
        description: '',
        params,
      };
      if (res.result) {
        oneExample.result = res.result;
      } else if(res.error) {
        oneExample.error = res.error;
      }
      examples[method].push(oneExample);
    }
  }

  fs.writeFileSync(path.join(__dirname, '../build/rpc-examples.json'), JSON.stringify(examples, null, 2));
}

main().catch(console.log);