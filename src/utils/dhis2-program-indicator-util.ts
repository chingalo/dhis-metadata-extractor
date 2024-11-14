import { flattenDeep, join, map, sortBy, trim } from 'lodash';
import { AppUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2ProgramIndicator } from '../models';

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
      const fields = `id,name,shortname,description,expression,filter,analyticsType,programIndicatorGroups[name]`;
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

  async generateExcelFile(programIndicators: Dhis2ProgramIndicator[]) {
    try {
      const data = sortBy(
        flattenDeep(
          map(programIndicators, (programIndicator) => {
            const { expression, filter, programIndicatorGroups } =
              programIndicator;
            return {
              ...programIndicator,
              programIndicatorGroups: join(
                flattenDeep(
                  map(
                    sortBy(programIndicatorGroups, ['name']),
                    (programIndicatorGroup) => trim(programIndicatorGroup.name)
                  )
                ),
                ', '
              )
            };
          })
        ),
        ['name', 'programIndicatorGroups']
      );
      console.log(data);
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2ProgramIndicatorUtil'
      );
    }
  }
}
