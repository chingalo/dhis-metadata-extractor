import { flattenDeep } from 'lodash';
import { AppUtil, HttpUtil, LogsUtil } from '.';
import { sourceConfig } from '../configs';
import { Dhis2OptionSet } from '../models';

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

  async discoverDhis2OptionSetsMetadata() {
    let optionSetsMetadata: Dhis2OptionSet[] = [];
    try {
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
}
