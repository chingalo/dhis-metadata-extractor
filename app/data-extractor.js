const { sourceConfig } = require('../config');
const dhis2Utils = require('../helpers/dhis2-util.helper');
const logsHelper = require('../helpers/logs.helper');
const programHelper = require('../helpers/program.helper');
const optionSetHelper = require('../helpers/option-set.helper');

const serverUrl = sourceConfig.url;

async function startMetadataExtraction() {
  const headers = await dhis2Utils.getHttpAuthorizationHeader(
    sourceConfig.username,
    sourceConfig.password
  );

  await logsHelper.addLogs('INFO', `Discovering program metadata`, 'App');
  const programsMetadata = await programHelper.getProgramMetadataFromServer(
    headers,
    serverUrl
  );
  await logsHelper.addLogs('INFO', `Discovering option set metadata`, 'App');
  const optionSetsMetadata = await optionSetHelper.getOptionSetMetadataFromServer(
    headers,
    serverUrl
  );

  return {
    programsMetadata: programsMetadata || [],
    optionSetsMetadata: optionSetsMetadata || [],
  };
}

module.exports = {
  startMetadataExtraction,
};
