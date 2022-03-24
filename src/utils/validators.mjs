import Ajv from 'ajv';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const ajv = new Ajv();

export function buildOpenRPCSchema(openRpcDoc) {
  const validators = {};
  for(let method of openRpcDoc.methods) {
    const schema = method.result.schema;
    validators[method.name] = ajv.compile(schema);
  }
  return validators;
}

const ethOpenRpc = require("../../eth-openrpc.json");
export const ETHValidators = buildOpenRPCSchema(ethOpenRpc);