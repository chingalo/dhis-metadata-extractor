import { filter, flattenDeep, map, sortBy, split } from 'lodash';
import { AppUtil, ExcelUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import {
  Dhis2ProgramRule,
  Dhis2ProgramRuleAction,
  Dhis2ProgramRuleVariable
} from '../models';
import { PROGRAM_RULE_VARIABLES_REFERENCE } from '../constants';

export class Dhis2ProgramRuleUtil {
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
  async discoverProgramRuleVariables(): Promise<Dhis2ProgramRule[]> {
    let programRules: Dhis2ProgramRule[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rules from the server`,
        'Dhis2ProgramRuleUtil'
      );
      const fields = `name,id,program[id,name],description,condition`;
      const pageFilters = await this.getProgramRuleFilters();
      for (const pageFilter of pageFilters) {
        await new LogsUtil().addLogs(
          'info',
          `Discovering program rules from the server : ${pageFilter}`,
          'Dhis2ProgramRuleUtil'
        );
        const url = `${this._baseUrl}/api/programRules?fields=${fields}&${pageFilter}`;
        const respose: any = await HttpUtil.getHttp(this._headers, url);
        programRules = [...programRules, ...(respose.programRules ?? [])];
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleUtil'
      );
    }
    return flattenDeep(programRules);
  }

  async getProgramRuleFilters(): Promise<string[]> {
    let programRulePageFilters: any[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rule filters`,
        'Dhis2ProgramRuleUtil'
      );
      const url = `${this._baseUrl}/api/programRules?fields=none&pageSize=1&paging=true`;
      const responsePaginations: any = await HttpUtil.getHttp(
        this._headers,
        url
      );
      const pageFilters = AppUtil.getPaginationsFilters(
        responsePaginations,
        this.pageSize
      );
      programRulePageFilters = map(
        pageFilters,
        (pageFilter) => `${pageFilter}`
      );
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleUtil'
      );
    }
    return flattenDeep(programRulePageFilters);
  }

  async generateExcelFile(
    programRules: Dhis2ProgramRule[],
    programRuleVariables: Dhis2ProgramRuleVariable[],
    programRuleActions: Dhis2ProgramRuleAction[]
  ) {
    try {
      await new ExcelUtil(
        'program-rule-dictionary'
      ).writeToMultipleSheetExcelFile({
        'Program Rules': sortBy(
          flattenDeep(programRules).map((programRule: Dhis2ProgramRule) => {
            const programRuleVariablesData = filter(
              programRuleVariables,
              (programRuleVariable: Dhis2ProgramRuleVariable) => {
                return (
                  programRuleVariable.program.id === programRule.program.id
                );
              }
            );
            return {
              program: programRule.program?.name,
              'Program Rule ID': programRule.id,
              'Program Rule': programRule.name,
              description: programRule.description ?? '',
              condition: this._getFormattedCondition(
                programRule,
                programRuleVariablesData
              )
            };
          }),
          ['program', 'Program Rule']
        ),
        'ProgramRules Actions': sortBy(
          flattenDeep(
            map(programRuleActions, (programRuleAction) => {
              return {
                'Program Rule Action ID': programRuleAction.id,
                'Program Rule': programRuleAction.programRule?.name,
                'Program Rule Action Type':
                  programRuleAction.programRuleActionType,
                'Form Fields':
                  programRuleAction.dataElement?.displayFormName ??
                  programRuleAction.dataElement?.displayName ??
                  programRuleAction.trackedEntityAttribute?.displayFormName ??
                  programRuleAction.trackedEntityAttribute?.displayName,
                'Option Group': programRuleAction.optionGroup?.name,
                'Program Stage': programRuleAction.programStage?.name,
                'Program Stage Section':
                  programRuleAction.programStageSection?.name,
                Data: programRuleAction.data,
                Content: programRuleAction.content,
                Location: programRuleAction.location
              };
            })
          ),
          ['Program Rule', 'Program Rule Action Type', 'Form Fields']
        )
      });
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleUtil'
      );
    }
  }

  _getFormattedCondition(
    programRule: Dhis2ProgramRule,
    programRuleVariablesData: Dhis2ProgramRuleVariable[]
  ) {
    let condition = programRule.condition;
    for (const programRuleVariable of [
      ...programRuleVariablesData,
      ...PROGRAM_RULE_VARIABLES_REFERENCE
    ]) {
      const label =
        programRuleVariable.dataElement?.displayFormName ??
        programRuleVariable.dataElement?.displayName ??
        programRuleVariable.trackedEntityAttribute?.displayFormName ??
        programRuleVariable.trackedEntityAttribute?.displayName;
      const { name } = programRuleVariable;
      condition = split(
        split(split(condition, `#{${name}}`).join(label), `A{${name}}`).join(
          label
        ),
        `V{${name}}`
      ).join(label);
    }
    return condition;
  }
}
