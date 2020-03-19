const { sourceConfig, programs } = require('../config');
const dhis2Utils = require('../helpers/dhis2-util.helper');
const logsHelper = require('../helpers/logs.helper');
const programHelper = require('../helpers/program.helper');

const serverUrl = sourceConfig.url;

async function startApp() {
    const headers = await dhis2Utils.getHttpAuthorizationHeader(
        sourceConfig.username,
        sourceConfig.password
    );
    await logsHelper.addLogs('INFO', `Discovering program metadata`, 'App');
    const programsMetadata = await programHelper.getProgramMetadataFromServer(
        headers,
        serverUrl
    );
    await logsHelper.addLogs(
        'INFO',
        `Creating program metadata's excel files for ${programsMetadata.length} programs`,
        'App'
    );
    await programHelper.createProgramMetadataExcelFiles(programsMetadata);
}

module.exports = { startApp };