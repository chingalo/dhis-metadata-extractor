import { flattenDeep, map } from 'lodash';
import { AppUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2ProgramRuleVariable } from '../models';

export class Dhis2ProgramRuleVariableUtil {
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
  async discoverProgramRuleVariables(): Promise<Dhis2ProgramRuleVariable[]> {
    let programRuleVariables: Dhis2ProgramRuleVariable[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rules from the server`,
        'Dhis2ProgramRuleVariableUtil'
      );
      const fields = `name,program[id],dataElement[displayName,displayFormName],trackedEntityAttribute[displayName,displayFormName]`;
      const pageFilters = await this.getProgramRuleVariableFilters();
      for (const pageFilter of pageFilters) {
        await new LogsUtil().addLogs(
          'info',
          `Discovering program rules from the server : ${pageFilter}`,
          'Dhis2ProgramRuleVariableUtil'
        );
        const url = `${this._baseUrl}/api/programRuleVariables.json?fields=${fields}&${pageFilter}`;
        const respose: any = await HttpUtil.getHttp(this._headers, url);
        programRuleVariables = [
          ...programRuleVariables,
          ...(respose.programRuleVariables ?? [])
        ];
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleVariableUtil'
      );
    }
    return flattenDeep(programRuleVariables);
  }

  async getProgramRuleVariableFilters(): Promise<string[]> {
    let programRuleVariablePageFilters: any[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rule variables filters`,
        'Dhis2ProgramRuleVariableUtil'
      );
      const url = `${this._baseUrl}/api/programRuleVariables.json?fields=none&pageSize=1&paging=true`;
      const responsePaginations: any = await HttpUtil.getHttp(
        this._headers,
        url
      );
      const pageFilters = AppUtil.getPaginationsFilters(
        responsePaginations,
        this.pageSize
      );
      programRuleVariablePageFilters = map(
        pageFilters,
        (pageFilter) => `${pageFilter}`
      );
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleVariableUtil'
      );
    }
    return flattenDeep(programRuleVariablePageFilters);
  }
}
