import { filter, flattenDeep, map } from 'lodash';
import { AppUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2Program } from '../models';
import { PROGRAM_REFERENCE } from '../constants';

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
        'Dhis2OrganisationUnitUtil'
      );
    }
    return map(flattenDeep(programsMetadata), (program: Dhis2Program) => {
      const programStages = [];
      for (const programStage of program.programStages || []) {
        if (
          programStage &&
          programStage.name &&
          `${programStage.name}`.trim() !== '.'
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
    const fields = `id,programType,name,trackedEntityType[name,id],programSections[name,id,sortOrder,trackedEntityAttributes[name,id,code,shortName,aggregationType,displayInListNoProgram,pattern,valueType,formName,optionSet[name,id,code]]],programTrackedEntityAttributes[trackedEntityAttribute[name,id,code,shortName,aggregationType,displayInListNoProgram,pattern,valueType,formName,optionSet[name,id]]],programStages[id,name,programStageDataElements[dataElement[id,name,code,shortName,formName,description,valueType,aggregationType,domainType,zeroIsSignificant,optionSet[name,id]]],programStageSections[id,name,dataElements[id,name,code,shortName,formName,description,valueType,aggregationType,domainType,zeroIsSignificant,optionSet[name,id]]]]`;
    const url = `${this._baseUrl}/api/programs/${programId}.json?fields=${fields}`;
    return HttpUtil.getHttp(this._headers, url);
  }
}
