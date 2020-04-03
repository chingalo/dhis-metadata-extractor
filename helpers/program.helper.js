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
        for (const program of programs) {
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
    const url = `${serverUrl}/api/programs/${program}.json?fields=id,programType,name,trackedEntityType[name,id],programTrackedEntityAttributes[trackedEntityAttribute[name,valueType,id,optionSet[name,id]]],programStages[id,name,programStageDataElements[dataElement[name,id,valueType,optionSet[name,id]]],programStageSections[id,name,dataElements[name,id,valueType,optionSet[name,id]]]]`;
    return await http.getHttp(headers, url);
}

async function createProgramMetadataExcelFiles(programsMetadata) {
    try {
        await fileManipulationHelper.intiateFilesDirectories(excelFileDir);
        for (const program of programsMetadata) {
            try {
                const workbook = new excel4node.Workbook();
                const headerStyles = workbook.createStyle({
                    font: {
                        bold: true
                    }
                });
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
                const sheetName = dhis2Utils.getSanitizedNameForExcelFiles('Info');
                const worksheet = workbook.addWorksheet(`${sheetName}`);
                worksheet.cell(1, 1).string('id');
                worksheet.cell(1, 2).string('name');
                worksheet.cell(1, 3).string('programType');
                worksheet.cell(1, 4).string('trackedEntityType_id');
                worksheet.cell(1, 5).string('trackedEntityType_name');
                worksheet.cell(2, 1).string(id);
                worksheet.cell(2, 2).string(name);
                worksheet.cell(2, 2).string(programType);
                worksheet.cell(2, 3).string(trackedEntityType.id || '');
                worksheet.cell(2, 4).string(trackedEntityType.name || '');
                const sheetNameAttribute = dhis2Utils.getSanitizedNameForExcelFiles(
                    'Attributes'
                );
                const worksheetAttribute = workbook.addWorksheet(
                    `${sheetNameAttribute}`
                );
                let attributeRowIndex = 1;
                const attributesHeaders = getColumnHeaders(
                    _.flattenDeep(
                        _.map(
                            programTrackedEntityAttributes,
                            programTrackedEntityAttribute =>
                            programTrackedEntityAttribute.trackedEntityAttribute || []
                        )
                    )
                );
                let attributeColumnIndex = 1;
                for (const header of attributesHeaders) {
                    worksheetAttribute
                        .cell(attributeRowIndex, attributeColumnIndex)
                        .string(header);
                    attributeColumnIndex++;
                }
                attributeRowIndex++;
                for (const programTrackedEntityAttribute of programTrackedEntityAttributes) {
                    const { trackedEntityAttribute } = programTrackedEntityAttribute;
                    let attributeColumnIndex = 1;
                    for (const key of _.keys(trackedEntityAttribute)) {
                        if (typeof trackedEntityAttribute[key] === 'object') {
                            for (const newKey of _.keys(trackedEntityAttribute[key])) {
                                const dataObj = trackedEntityAttribute[key];
                                worksheetAttribute
                                    .cell(attributeRowIndex, attributeColumnIndex)
                                    .string(dataObj[newKey] || '');
                                attributeColumnIndex++;
                            }
                        } else {
                            worksheetAttribute
                                .cell(attributeRowIndex, attributeColumnIndex)
                                .string(trackedEntityAttribute[key]);
                        }
                        attributeColumnIndex++;
                    }
                    attributeRowIndex++;
                }
                for (const programStage of programStages) {
                    const {
                        name,
                        id,
                        programStageSections,
                        programStageDataElements
                    } = programStage;
                    const sheetName = dhis2Utils.getSanitizedNameForExcelFiles(name);
                    const worksheet = workbook.addWorksheet(`${sheetName}`);
                    let programstageRowIndex = 1;
                    worksheet.cell(programstageRowIndex, 1).string('id');
                    worksheet.cell(programstageRowIndex, 2).string('name');
                    programstageRowIndex++;
                    worksheet.cell(programstageRowIndex, 1).string(id);
                    worksheet.cell(programstageRowIndex, 2).string(name);
                    if (
                        programStageSections &&
                        programStageSections.length === 0 &&
                        programStageDataElements &&
                        programStageDataElements.length > 0
                    ) {
                        programstageRowIndex += 2;
                        worksheet
                            .cell(programstageRowIndex, 1)
                            .string(`Data element info for : ${name}`)
                            .style(headerStyles);
                        programstageRowIndex++;
                        const dataElements = _.flattenDeep(
                            _.map(
                                programStageDataElements || [],
                                programStageDataElement =>
                                programStageDataElement.dataElement || []
                            )
                        );
                        let programStageColumnIndex = 1;
                        const programStageHeaders = getColumnHeaders(dataElements);
                        for (const header of programStageHeaders) {
                            worksheet
                                .cell(programstageRowIndex, programStageColumnIndex)
                                .string(header);
                            programStageColumnIndex++;
                        }
                        programstageRowIndex++;
                        for (const dataElement of dataElements) {
                            let programStageColumnIndex = 1;
                            for (const key of _.keys(dataElement)) {
                                if (typeof dataElement[key] === 'object') {
                                    for (const newKey of _.keys(dataElement[key])) {
                                        const dataObj = dataElement[key];
                                        worksheet
                                            .cell(programstageRowIndex, programStageColumnIndex)
                                            .string(dataObj[newKey] || '');
                                        programStageColumnIndex++;
                                    }
                                } else {
                                    worksheet
                                        .cell(programstageRowIndex, programStageColumnIndex)
                                        .string(dataElement[key] || '');
                                }
                                programStageColumnIndex++;
                            }
                            programstageRowIndex++;
                        }
                    } else {
                        for (const programStageSection of programStageSections) {
                            programstageRowIndex += 2;
                            const { id, name, dataElements } = programStageSection;
                            worksheet
                                .cell(programstageRowIndex, 1)
                                .string(`Section info for : ${name}`)
                                .style(headerStyles);
                            programstageRowIndex++;

                            worksheet.cell(programstageRowIndex, 1).string('id');
                            worksheet.cell(programstageRowIndex, 2).string('name');
                            programstageRowIndex++;
                            worksheet.cell(programstageRowIndex, 1).string(id || '');
                            worksheet.cell(programstageRowIndex, 2).string(name || '');
                            programstageRowIndex += 2;
                            worksheet
                                .cell(programstageRowIndex, 1)
                                .string(`Data element info for section : ${name}`)
                                .style(headerStyles);
                            programstageRowIndex++;
                            let programStageColumnIndex = 1;
                            const programStageHeaders = getColumnHeaders(dataElements);
                            for (const header of programStageHeaders) {
                                worksheet
                                    .cell(programstageRowIndex, programStageColumnIndex)
                                    .string(header);
                                programStageColumnIndex++;
                            }
                            programstageRowIndex++;
                            for (const dataElement of dataElements) {
                                let programStageColumnIndex = 1;
                                for (const key of _.keys(dataElement)) {
                                    if (typeof dataElement[key] === 'object') {
                                        for (const newKey of _.keys(dataElement[key])) {
                                            const dataObj = dataElement[key];
                                            worksheet
                                                .cell(programstageRowIndex, programStageColumnIndex)
                                                .string(dataObj[newKey] || '');
                                            programStageColumnIndex++;
                                        }
                                    } else {
                                        worksheet
                                            .cell(programstageRowIndex, programStageColumnIndex)
                                            .string(dataElement[key] || '');
                                    }
                                    programStageColumnIndex++;
                                }
                                programstageRowIndex++;
                            }
                        }
                    }
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

function getColumnHeaders(data) {
    return _.uniq(
        _.flattenDeep(
            _.map(data, dataObject => {
                return _.map(_.keys(dataObject), key => {
                    return typeof dataObject[key] === 'object' ?
                        _.map(_.keys(dataObject[key]), newKey => {
                            return `${key}_${newKey}`;
                        }) :
                        key;
                });
            })
        )
    );
}

module.exports = {
    getProgramMetadataFromServer,
    createProgramMetadataExcelFiles
};