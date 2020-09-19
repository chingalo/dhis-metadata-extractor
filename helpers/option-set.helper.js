const _ = require('lodash');
const excel4node = require('excel4node');
const http = require('./http.helper');
const logsHelper = require('./logs.helper');
const dhis2Utils = require('./dhis2-util.helper');
const fileManipulationHelper = require('./file-manipulation.helper');

const outputDir = `outputs`;
const excelFileDir = `${fileManipulationHelper.fileDir}/${outputDir}/excel-files`;

async function getOptionSetMetadataFromServer(headers, serverUrl) {
    const optionSetMetadata = [];
    try {
        await logsHelper.addLogs(
            'INFO',
            `Discovering option set metadata`,
            'Option set helper'
        );
        const url = `${serverUrl}/api/optionSets.json?fields=id,name,code,valueType,options[id,name,code]&paging=falses`;
        const response = await http.getHttp(headers, url);
        const optionSets = response.optionSets || [];
        optionSetMetadata.push(optionSets);
    } catch (error) {
        await logsHelper.addLogs(
            'ERROR',
            JSON.stringify(error),
            'Option set helper'
        );
    } finally {
        return _.flattenDeep(optionSetMetadata);
    }
}

async function createProgramMetadataExcelFiles(optionSets) {
    try {
        await fileManipulationHelper.intiateFilesDirectories(excelFileDir);
        const workbook = new excel4node.Workbook();
        const headerStyles = workbook.createStyle({
            font: {
                bold: true
            }
        });
        const fileName = dhis2Utils.getSanitizedNameForExcelFiles('Option sets');
        await logsHelper.addLogs(
            'INFO',
            `Create excel file for optionset`,
            'Option Sets helper'
        );
        const sheetName = dhis2Utils.getSanitizedNameForExcelFiles('Info');
        const worksheet = workbook.addWorksheet(`${sheetName}`);
        worksheet
            .cell(1, 1)
            .string('id')
            .style(headerStyles);
        worksheet
            .cell(1, 2)
            .string('name')
            .style(headerStyles);worksheet
            .cell(1, 3)
            .string('code')
            .style(headerStyles);  
        worksheet
            .cell(1, 4)
            .string('valueType')
            .style(headerStyles);
        worksheet
            .cell(1, 5)
            .string('option id')
            .style(headerStyles);
        worksheet
            .cell(1, 6)
            .string('option name')
            .style(headerStyles);
        worksheet
            .cell(1, 7)
            .string('option code')
            .style(headerStyles);
        let rowIndex = 2;
        for (const optionSet of optionSets) {
            const { name, valueType, options,id,code } = optionSet;
            worksheet.cell(rowIndex, 1).string(`${id}`);
            worksheet.cell(rowIndex, 2).string(`${name}`);
            worksheet.cell(rowIndex, 3).string(`${code}`);
            worksheet.cell(rowIndex, 4).string(`${valueType}`);
            for (const option of options) {
                worksheet.cell(rowIndex, 5).string(`${option.id || ''}`);
                worksheet.cell(rowIndex, 6).string(`${option.name || ''}`);
                worksheet.cell(rowIndex, 7).string(`${option.code || ''}`);
                rowIndex++;
            }
            if (options && options.length === 0) rowIndex++;
        }
        worksheet.row(1).freeze();
        workbook.write(`${excelFileDir}/${fileName}.xlsx`);
    } catch (error) {
        await logsHelper.addLogs(
            'ERROR',
            JSON.stringify(error),
            'Option set helper'
        );
    }
}

module.exports = {
    getOptionSetMetadataFromServer,
    createProgramMetadataExcelFiles
};