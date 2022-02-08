/**
 * 1. hex
 * 2. hash
 * 3. boolean
 * 4. number
 * 5. string
 */
function checkSchema(fieldName, data, schema) {
  let reports = [];
  const { type, oneOf } = schema;

  if (oneOf) {
    let atLeatOnePass = false;
    for(let subSchema of schema.oneOf) {
      let subReports = checkSchema(fieldName, data, subSchema);
      if (subReports.length === 0) {
        atLeatOnePass = true;
        break;
      }
      // console.log(`OneOf Checking: ${subSchema.title}`, subReports);
    }
    if(!atLeatOnePass) {
      reports.push(`${fieldName} not match any of these types: ${schema.oneOf.map(a => a.title).join(', ')}`);
    }
  }

  // object check
  if (type === 'object') {
    const { required = [], properties } = schema;
    for(let key in properties) {
      if (required.indexOf(key) > -1 && !data[key]) {
        reports.push(`${key} is missed`);
        continue;
      }
      if (data[key]) {
        reports = reports.concat(checkSchema(key, data[key], properties[key]));
      }
    }
  }

  if (type === 'array') {
    if (!Array.isArray(data)) {
      reports.push(`${fieldName} is not array`);
    } else {
      for(let i in data) {
        reports = reports.concat(checkSchema(`${fieldName}-${i}`, data[i], schema.items));
      }
    }
  }

  if (type === 'string') {
    if (typeof data !== 'string') {
      reports.push(`${fieldName} is not a string`);
    } else if(schema.pattern) {
      const pattern = new RegExp(schema.pattern);
      if (!pattern.test(data)) {
        reports.push(`${fieldName} is not match pattern: ${schema.pattern}`);
      }
    }
  }

  return reports;
}

module.exports = checkSchema;