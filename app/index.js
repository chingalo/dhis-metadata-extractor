const { sourceConfig, programs } = require('../config');
const dhis2Utils = require('../helpers/dhis2-util.helper');

const serverUrl = sourceConfig.url;

async function startApp() {
    const headers = await dhis2Utils.getHttpAuthorizationHeader(
        sourceConfig.username,
        sourceConfig.password
    );
    console.log({ programs, serverUrl, headers });
}

module.exports = { startApp };