import { flattenDeep, map, sortBy, trim } from 'lodash';
import { AppUtil, ExcelUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2Indicator, Dhis2ProgramIndicator } from '../models';

export class Dhis2IndicatorUtil {
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
  async discoverIndicators(): Promise<Dhis2Indicator[]> {
    let indicators: Dhis2Indicator[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering indicators from the server`,
        'Dhis2IndicatorUtil'
      );
      const fields = `id,name,shortName,displayDescription,indicatorType[name,factor],numerator,numeratorDescription,denominator,denominatorDescription`;
      const pageFilters = await this.getIndicatorsFilters();
      for (const pageFilter of pageFilters) {
        await new LogsUtil().addLogs(
          'info',
          `Discovering indicators from the server : ${pageFilter}`,
          'Dhis2IndicatorUtil'
        );
        const url = `${this._baseUrl}/api/indicators?fields=${fields}&${pageFilter}`;
        const respose: any = await HttpUtil.getHttp(this._headers, url);
        indicators = [...indicators, ...(respose.indicators ?? [])];
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2IndicatorUtil'
      );
    }
    return flattenDeep(indicators);
  }

  async getIndicatorsFilters(): Promise<string[]> {
    let indicatorPageFilters: any[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering program rule action filters`,
        'Dhis2IndicatorUtil'
      );
      const url = `${this._baseUrl}/api/indicators?fields=none&pageSize=1&paging=true`;
      const responsePaginations: any = await HttpUtil.getHttp(
        this._headers,
        url
      );
      const pageFilters = AppUtil.getPaginationsFilters(
        responsePaginations,
        this.pageSize
      );
      indicatorPageFilters = map(pageFilters, (pageFilter) => `${pageFilter}`);
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2IndicatorUtil'
      );
    }
    return flattenDeep(indicatorPageFilters);
  }

  async generateExcelFile(
    indicators: Dhis2Indicator[],
    programIndicators: Dhis2ProgramIndicator[]
  ) {
    try {
      await new ExcelUtil('Indicator-dictionary').writeToSingleSheetExcelFile(
        sortBy(
          flattenDeep(
            map(indicators, (indicator) => {
              const { denominator, numerator, indicatorType } = indicator;
              const indicatorTypeFactor = indicatorType?.factor;
              const indicatorTypeName = indicatorType?.name;
              //TODO: deduce numerator and denominator
              return {
                ...indicator,
                indicatorType:
                  trim(indicatorTypeName) == ''
                    ? `${indicatorTypeFactor}`
                    : `${indicatorTypeName} : ${indicatorTypeFactor}`,
                numerator: numerator,
                denominator: denominator
              };
            })
          ),
          ['name']
        )
      );
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2IndicatorUtil'
      );
    }
  }
}
