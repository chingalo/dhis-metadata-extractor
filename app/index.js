const dataExtractor = require('./data-extractor');
const dataExcelGenerator = require('./data-excel-generator');

async function startApp() {
    const {
        programsMetadata,
        optionSetsMetadata
    } = await dataExtractor.startMetadataExtraction();
    await dataExcelGenerator.startExcelGenerator(
        programsMetadata,
        optionSetsMetadata
    );
}

module.exports = { startApp };