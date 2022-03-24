# jsonrpc-checker

A tool used to check whether a JSON-RPC service is valid according the OPEN-RPC documentation.

## Target

* Support Open-RPC standard
* Provide command line tool
* Configable
* Clear report

## Generate Cfx Request and Response examples

1. Setup configs in .env
2. Generate RawTX: `node bin/cfx.js genRawTxs`
3. Send TX: `node bin/cfx.js sendTxs`
4. Generate Requests: `node scripts/cfx-rpc-request-generator.js`
5. Generate Request & Result: `node scripts/rpc-req2res-generator.js`

## Tools

* [ajv](https://ajv.js.org/)