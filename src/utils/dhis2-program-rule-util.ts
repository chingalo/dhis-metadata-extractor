import { flattenDeep, map } from 'lodash';
import { AppUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2ProgramRule } from '../models';

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
}
