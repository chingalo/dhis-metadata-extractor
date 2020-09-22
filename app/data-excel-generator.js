const logsHelper = require('../helpers/logs.helper');
const programHelper = require('../helpers/program.helper');
const optionSetHelper = require('../helpers/option-set.helper');

async function startExcelGenerator(programsMetadata, optionSetsMetadata) {
  await logsHelper.addLogs(
    'INFO',
    `Creating program metadata's excel files for ${programsMetadata.length} programs`,
    'App'
  );
  await programHelper.createProgramMetadataExcelFiles(programsMetadata);

  await logsHelper.addLogs(
    'INFO',
    `Creating option set metadata's excel files`,
    'App'
  );
  await optionSetHelper.createProgramMetadataExcelFiles(optionSetsMetadata);
}

module.exports = { startExcelGenerator };
