import { flattenDeep, map, sortBy } from 'lodash';
import { AppUtil, ExcelUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2Option, Dhis2OptionSet } from '../models';

export class Dhis2OptionSetUtil {
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

  async discoverDhis2OptionSetsMetadata(): Promise<Dhis2OptionSet[]> {
    let optionSetsMetadata: Dhis2OptionSet[] = [];
    try {
      await new LogsUtil().addLogs(
        'info',
        `Discovering option set from the server`
      );
      const fields = `id,name,code,valueType,options[id,name,code]`;
      const url = `${this._baseUrl}/api/optionSets.json?fields=${fields}&paging=false`;
      const respose: any = await HttpUtil.getHttp(this._headers, url);
      optionSetsMetadata = respose.optionSets || optionSetsMetadata;
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2OptionSetUtil'
      );
    }
    return flattenDeep(optionSetsMetadata);
  }

  async generateExcelFile(optionSets: Dhis2OptionSet[]) {
    try {
      if (optionSets.length > 0) {
        await new LogsUtil().addLogs(
          'info',
          `Generating excel file for option sets`
        );
        await new ExcelUtil(
          'option-set-dictionary'
        ).writeToSingleSheetExcelFile(
          sortBy(
            flattenDeep([
              {
                item1: 'ID',
                item2: 'Name',
                item3: 'Code',
                item4: 'value Type',
                item5: 'Option Id',
                item6: 'Option Name',
                item7: 'Option Code'
              },
              ...map(optionSets, (optionSet: Dhis2OptionSet) => {
                return map(optionSet.options || [], (option: Dhis2Option) => {
                  return {
                    item1: optionSet.id,
                    item2: optionSet.name,
                    item3: optionSet.code,
                    item4: optionSet.valueType,
                    item5: option.id,
                    item6: option.name,
                    item7: option.code
                  };
                });
              })
            ]),
            ['item2', 'item6']
          ),
          true,
          'optionSet list'
        );
      }
    } catch (error: any) {
      await new LogsUtil().addLogs(
        'error',
        error.message || error,
        'Dhis2OptionSetUtil'
      );
    }
  }
}
