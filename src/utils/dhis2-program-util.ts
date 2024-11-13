import {
  find,
  flatMapDeep,
  flattenDeep,
  indexOf,
  keys,
  map,
  uniq
} from 'lodash';
import { AppUtil, ExcelUtil, HttpUtil, LogsUtil } from '.';
import { PROGRAM_REFERENCE, sourceConfig } from '../configs';
import {
  Dhis2DataElement,
  Dhis2Program,
  Dhis2TrackedEntityAttribute
} from '../models';

export class Dhis2ProgramUtil {
  private _headers: {
    Authorization: string;
    'Content-Type': string;
  };
  private _baseUrl: string;
  constructor() {
    this._baseUrl = sourceConfig.baseUrl;
    this._headers = AppUtil.getHttpAuthorizationHeader(
      sourceConfig.username,
      sourceConfig.password
    );
  }

  async discoverProgramsMetadata(): Promise<Dhis2Program[]> {
    const programsMetadata: Dhis2Program[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering programs metadata from the server`
      );
      for (const programId of PROGRAM_REFERENCE) {
        const programMetadata: any = await this.discoverProgramById(programId);
        programsMetadata.push(programMetadata);
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramUtil'
      );
    }
    return map(flattenDeep(programsMetadata), (program: Dhis2Program) => {
      const programStages = [];
      for (const programStage of program.programStages || []) {
        if (
          programStage &&
          programStage.name &&
          (`${programStage.name}`.trim() !== '.' ||
            programStage.publicAccess !== '--------')
        ) {
          programStages.push(programStage);
        }
      }
      return {
        ...program,
        programStages: programStages
      };
    });
  }

  async discoverProgramById(programId: string): Promise<Dhis2Program> {
    await new LogsUtil().addLogs(
      'info',
      `Discovering program metadata with id : ${programId}`,
      'Dhis2ProgramUtil'
    );
    const fields = `id,programType,name,trackedEntityType[name,id],programSections[name,id,sortOrder,trackedEntityAttributes[name,id,code,shortName,aggregationType,displayInListNoProgram,pattern,valueType,formName,optionSet[name,id,code]]],programTrackedEntityAttributes[trackedEntityAttribute[name,id,code,shortName,aggregationType,displayInListNoProgram,pattern,valueType,formName,optionSet[name,id]]],programStages[id,name,publicAccess,programStageDataElements[dataElement[id,name,code,shortName,formName,description,valueType,aggregationType,domainType,zeroIsSignificant,optionSet[name,id]]],programStageSections[id,name,dataElements[id,name,code,shortName,formName,description,valueType,aggregationType,domainType,zeroIsSignificant,optionSet[name,id]]]]`;
    const url = `${this._baseUrl}/api/programs/${programId}.json?fields=${fields}`;
    return HttpUtil.getHttp(this._headers, url);
  }

  async generateExcelFile(programs: Dhis2Program[]) {
    try {
      for (const program of programs) {
        await new LogsUtil().addLogs(
          'info',
          `Generate excel file for dictionary for program : ${program.name}`,
          'Dhis2ProgramUtil'
        );
        let jsonObject: any = {
          'Summary Information': this._getProgramInfoSummary(program)
        };
        if (
          (program.programSections || []).length > 0 ||
          (program.programTrackedEntityAttributes || []).length > 0
        ) {
          jsonObject = {
            ...jsonObject,
            'Profile Information': this._getProgramProfileInformation(program)
          };
        }
        jsonObject = {
          ...jsonObject,
          ...this._getProgramStageInformation(program)
        };

        await new ExcelUtil(
          AppUtil.getFormattedExcelName(program.name)
        ).writeToMultipleSheetExcelFile(jsonObject, true);
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2OrganisationUnitUtil'
      );
    }
  }

  _getProgramStageInformation(program: Dhis2Program) {
    const jsonObject: any = {};
    for (const programStage of program.programStages) {
      const sheetName = AppUtil.getFormattedExcelName(
        programStage.name
      ).substring(0, 30);
      let json: any = [
        {
          item1: 'ID',
          item2: 'Name'
        },
        { item1: programStage.id, item2: programStage.name },
        { item1: '' }
      ];
      if (
        programStage.programStageSections &&
        programStage.programStageSections.length > 0
      ) {
        for (const programStageSection of programStage.programStageSections) {
          json = [
            ...json,
            { item1: 'Section Information' },
            { item1: 'ID', item2: 'Name' },
            { item1: programStageSection.id, item2: programStageSection.name },
            { item1: 'List of Data Elements' },
            ...this._getProgramTrackedEntityAttributeDataElementjson(
              programStageSection.dataElements
            ),
            { item1: '' }
          ];
        }
      } else {
        const dataElements = flattenDeep(
          map(
            programStage.programStageDataElements,
            (programStageDataElement) => programStageDataElement.dataElement
          )
        );
        json = [
          ...json,
          { item1: 'List of Data Elements' },
          ...this._getProgramTrackedEntityAttributeDataElementjson(
            dataElements
          ),
          { item1: '' }
        ];
      }

      jsonObject[sheetName] = flattenDeep([...json]);
    }

    return jsonObject;
  }

  _getProgramProfileInformation(program: Dhis2Program) {
    let json: any = [];
    if ((program.programSections || []).length > 0) {
      for (const programSection of program.programSections || []) {
        json = [
          ...json,
          {
            item1: programSection.name
          }
        ];
        const trackedEntityAttributes =
          programSection.trackedEntityAttributes || [];
        json = [
          ...json,
          ...this._getProgramTrackedEntityAttributeDataElementjson(
            trackedEntityAttributes
          )
        ];
      }
    } else if ((program.programTrackedEntityAttributes || []).length > 0) {
      const trackedEntityAttributes = flattenDeep(
        map(
          program.programTrackedEntityAttributes,
          (data) => data.trackedEntityAttribute
        )
      );
      json = [
        ...json,
        ...this._getProgramTrackedEntityAttributeDataElementjson(
          trackedEntityAttributes
        )
      ];
    }
    return flatMapDeep([...json, { item1: '' }]);
  }

  _getProgramTrackedEntityAttributeDataElementjson(
    trackedEntityAttributes: any[]
  ) {
    let jsonObjects: any = [];
    const headers = this._getColumnHeaders(trackedEntityAttributes);
    const headerJson: any = {};
    for (const header of headers) {
      const index = indexOf(headers, header) + 1;
      const key = `item${index}`;
      headerJson[key] = header;
    }
    jsonObjects = [...jsonObjects, headerJson];
    for (const trackedEntityAttribute of trackedEntityAttributes) {
      const values = this._getColumnHeaderValue(trackedEntityAttribute);
      const attributejson: any = {};
      for (const header of headers) {
        const index = indexOf(headers, header) + 1;
        const key = `item${index}`;
        const valueObj = find(values, (value) => value.id === header);
        attributejson[key] = valueObj ? valueObj.value ?? '' : '';
      }
      jsonObjects = [...jsonObjects, attributejson];
    }

    return flattenDeep(jsonObjects);
  }

  _getProgramInfoSummary(program: Dhis2Program) {
    return [
      {
        item1: 'ID',
        item2: 'Name',
        item3: 'Program Type',
        item4: 'Tracked Entity Type ID',
        item5: 'Tracked Entity Type Name'
      },
      {
        item1: program.id,
        item2: program.name,
        item3: program.programType,
        item4: program?.trackedEntityType?.id ?? '',
        item5: program?.trackedEntityType?.name ?? ''
      }
    ];
  }

  _getColumnHeaderValue(
    attributeDataElement: Dhis2TrackedEntityAttribute | Dhis2DataElement
  ) {
    const values: any = [];
    const dataObjet: any = { ...attributeDataElement };
    for (const key of keys(dataObjet)) {
      if (typeof dataObjet[key] === 'object') {
        const newDataObject = dataObjet[key];
        for (const newKey of keys(newDataObject)) {
          values.push({ id: `${key}_${newKey}`, value: newDataObject[newKey] });
        }
      } else {
        values.push({ id: key, value: dataObjet[key] });
      }
    }

    return values;
  }

  _getColumnHeaders(data: Dhis2TrackedEntityAttribute[] | Dhis2DataElement[]) {
    return uniq(
      flattenDeep(
        map(data, (dataObject: any) => {
          return map(keys(dataObject), (key) => {
            return typeof dataObject[key] === 'object'
              ? map(keys(dataObject[key]), (newKey) => {
                  return `${key}_${newKey}`;
                })
              : key;
          });
        })
      )
    );
  }
}
