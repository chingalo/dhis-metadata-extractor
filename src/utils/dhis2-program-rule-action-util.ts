import { flattenDeep, map } from 'lodash';
import { AppUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2ProgramRuleAction } from '../models';

export class Dhis2ProgramRuleActionUtil {
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
  async discoverProgramRuleActions(): Promise<Dhis2ProgramRuleAction[]> {
    let programRuleActions: Dhis2ProgramRuleAction[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rules actions from the server`,
        'Dhis2ProgramRuleActionUtil'
      );
      const fields = `id,programRuleActionType,programRule[name],data,content,location,dataElement[displayName,displayFormName],trackedEntityAttribute[displayName,displayFormName],programStageSection[name],programStage[name],optionGroup[name]`;
      const pageFilters = await this.getProgramRuleActionFilters();
      for (const pageFilter of pageFilters) {
        await new LogsUtil().addLogs(
          'info',
          `Discovering program rules actions from the server : ${pageFilter}`,
          'Dhis2ProgramRuleActionUtil'
        );
        const url = `${this._baseUrl}/api/programRuleActions?fields=${fields}&${pageFilter}`;
        const respose: any = await HttpUtil.getHttp(this._headers, url);
        programRuleActions = [
          ...programRuleActions,
          ...(respose.programRuleActions ?? [])
        ];
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleActionUtil'
      );
    }
    return flattenDeep(programRuleActions);
  }

  async getProgramRuleActionFilters(): Promise<string[]> {
    let programRuleActionPageFilters: any[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rule action filters`,
        'Dhis2ProgramRuleActionUtil'
      );
      const url = `${this._baseUrl}/api/programRuleActions?fields=none&pageSize=1&paging=true`;
      const responsePaginations: any = await HttpUtil.getHttp(
        this._headers,
        url
      );
      const pageFilters = AppUtil.getPaginationsFilters(
        responsePaginations,
        this.pageSize
      );
      programRuleActionPageFilters = map(
        pageFilters,
        (pageFilter) => `${pageFilter}`
      );
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramRuleActionUtil'
      );
    }
    return flattenDeep(programRuleActionPageFilters);
  }
}
