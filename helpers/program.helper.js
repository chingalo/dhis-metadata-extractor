const { programs } = require('../config');
const _ = require('lodash');
const excel4node = require('excel4node');
const http = require('./http.helper');
const logsHelper = require('./logs.helper');
const dhis2Utils = require('./dhis2-util.helper');
const fileManipulationHelper = require('./file-manipulation.helper');

const outputDir = `outputs`;
const excelFileDir = `${fileManipulationHelper.fileDir}/${outputDir}/excel-files`;

async function getProgramMetadataFromServer(headers, serverUrl) {
    const programsMetadata = [];
    try {
        for (const program of _.chunk(programs, 1)[1]) {
            await logsHelper.addLogs(
                'INFO',
                `Discovering program metadata for ${program}`,
                'Program helper'
            );
            const response = await getProgramMetadata(headers, serverUrl, program);
            programsMetadata.push(response);
        }
    } catch (error) {
        await logsHelper.addLogs('ERROR', JSON.stringify(error), 'Program helper');
    } finally {
        return _.flattenDeep(programsMetadata);
    }
}

async function getProgramMetadata(headers, serverUrl, program) {
    const url = `${serverUrl}/api/programs/${program}.json?fields=id,programType,name,trackedEntityType[name,id],programTrackedEntityAttributes[trackedEntityAttribute[name,valueType,id,optionSet[name,id]]],programStages[id,name,programStageSections[name,dataElements[name,id,valueType,optionSet[name,id]]]]`;
    return await http.getHttp(headers, url);
}

async function createProgramMetadataExcelFiles(programsMetadata) {
    try {
        await fileManipulationHelper.intiateFilesDirectories(excelFileDir);
        for (const program of programsMetadata) {
            try {
                const workbook = new excel4node.Workbook();
                const {
                    id,
                    name,
                    programType,
                    trackedEntityType,
                    programStages,
                    programTrackedEntityAttributes
                } = program;
                const fileName = dhis2Utils.getSanitizedNameForExcelFiles(name);
                await logsHelper.addLogs(
                    'INFO',
                    `Create excel file for ${name}`,
                    'Program helper'
                );
                // infor
                const sheetName = dhis2Utils.getSanitizedNameForExcelFiles('Info');
                const worksheet = workbook.addWorksheet(`${sheetName}`);

                // attributes
                const sheetNameAttribute = dhis2Utils.getSanitizedNameForExcelFiles(
                    'Attributes'
                );
                const worksheetAttribute = workbook.addWorksheet(
                    `${sheetNameAttribute}`
                );

                // program stages
                for (const programStage of programStages) {
                    const { name, id, programStageSections } = programStage;
                    const sheetName = dhis2Utils.getSanitizedNameForExcelFiles(name);
                    const worksheet = workbook.addWorksheet(`${sheetName}`);
                    worksheet.cell(1, 1).string(name);
                }
                workbook.write(`${excelFileDir}/${fileName}.xlsx`);
            } catch (error) {
                console.log(error);
            }
        }
    } catch (error) {
        await logsHelper.addLogs('ERROR', JSON.stringify(error), 'Program helper');
    }
}

module.exports = {
    getProgramMetadataFromServer,
    createProgramMetadataExcelFiles
};