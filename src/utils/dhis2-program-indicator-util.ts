import { first, flattenDeep, join, map, sortBy, split, trim } from 'lodash';
import { AppUtil, ExcelUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2Program, Dhis2ProgramIndicator } from '../models';
import { IN_BUILT_VARIABLES_REFERENCE } from '../constants';

export class Dhis2ProgramIndicatorUtil {
  private _headers: {
    Authorization: string;
    'Content-Type': string;
  };
  private _baseUrl: string;
  private pageSize = 200;

  constructor() {
    this._baseUrl = sourceConfig.baseUrl;
    this._headers = AppUtil.getHttpAuthorizationHeader(
      sourceConfig.username,
      sourceConfig.password
    );
  }
  async discoverProgramIndicators(): Promise<Dhis2ProgramIndicator[]> {
    let programIndicators: Dhis2ProgramIndicator[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program indicators from the server`,
        'Dhis2ProgramIndicatorUtil'
      );
      const fields = `id,name,shortname,description,expression,filter,analyticsType,programIndicatorGroups[name],program[id]`;
      const pageFilters = await this.getProgramIndicatorsFilters();
      for (const pageFilter of pageFilters) {
        await new LogsUtil().addLogs(
          'info',
          `Discovering program indicators from the server : ${pageFilter}`,
          'Dhis2ProgramIndicatorUtil'
        );
        const url = `${this._baseUrl}/api/programIndicators?fields=${fields}&${pageFilter}`;
        const respose: any = await HttpUtil.getHttp(this._headers, url);
        programIndicators = [
          ...programIndicators,
          ...(respose.programIndicators ?? [])
        ];
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramIndicatorUtil'
      );
    }
    return flattenDeep(programIndicators);
  }

  async getProgramIndicatorsFilters(): Promise<string[]> {
    let programIndicatorPageFilters: any[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rule action filters`,
        'Dhis2ProgramIndicatorUtil'
      );
      const url = `${this._baseUrl}/api/programIndicators?fields=none&pageSize=1&paging=true`;
      const responsePaginations: any = await HttpUtil.getHttp(
        this._headers,
        url
      );
      const pageFilters = AppUtil.getPaginationsFilters(
        responsePaginations,
        this.pageSize
      );
      programIndicatorPageFilters = map(
        pageFilters,
        (pageFilter) => `${pageFilter}`
      );
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramIndicatorUtil'
      );
    }
    return flattenDeep(programIndicatorPageFilters);
  }

  async generateExcelFile(
    programIndicators: Dhis2ProgramIndicator[],
    programs: Dhis2Program[]
  ) {
    try {
      await new ExcelUtil(
        'program-indicator-dictionary'
      ).writeToSingleSheetExcelFile(
        sortBy(
          flattenDeep(
            map(programIndicators, (programIndicator) => {
              const { expression, filter, programIndicatorGroups, program } =
                programIndicator;
              return {
                ...programIndicator,
                expression: this._getFoprmatExpression(
                  expression,
                  programs,
                  program.id
                ),
                filter: this._getFoprmatExpression(
                  filter,
                  programs,
                  program.id
                ),
                programIndicatorGroups: join(
                  flattenDeep(
                    map(
                      sortBy(programIndicatorGroups, ['name']),
                      (programIndicatorGroup) =>
                        trim(programIndicatorGroup.name)
                    )
                  ),
                  ', '
                )
              };
            })
          ),
          ['name', 'programIndicatorGroups']
        )
      );
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramIndicatorUtil'
      );
    }
  }

  _getFoprmatExpression(
    expression: string,
    programs: Dhis2Program[],
    programId: string
  ) {
    const mappingObj: any = {};
    const program = programs.find((program) => program.id === programId);
    const programStages = program?.programStages;
    const programTrackedEntityAttributes =
      program?.programTrackedEntityAttributes;
    for (const programStage of programStages ?? []) {
      for (const programDataElement of programStage.programStageDataElements ??
        []) {
        const dataElement = programDataElement.dataElement;
        const id = `${programStage.id}.${dataElement.id}`;
        mappingObj[id] = dataElement.formName ?? dataElement.name;
      }
    }
    for (const programTrackedEntityAttribute of programTrackedEntityAttributes ??
      []) {
      const id = programTrackedEntityAttribute.trackedEntityAttribute.id;
      mappingObj[id] =
        programTrackedEntityAttribute.trackedEntityAttribute.formName ??
        programTrackedEntityAttribute.trackedEntityAttribute.name;
    }
    for (const programRuleVariable of IN_BUILT_VARIABLES_REFERENCE) {
      mappingObj[programRuleVariable.name] =
        programRuleVariable.dataElement?.displayFormName ??
        programRuleVariable.dataElement?.displayName ??
        programRuleVariable.trackedEntityAttribute?.displayFormName ??
        programRuleVariable.trackedEntityAttribute?.displayName;
    }
    for (const key in mappingObj) {
      expression = split(
        split(
          split(expression, `#{${key}}`).join(mappingObj[key]),
          `A{${key}}`
        ).join(mappingObj[key]),
        `V{${key}}`
      ).join(mappingObj[key]);
    }

    return expression;
  }
}
