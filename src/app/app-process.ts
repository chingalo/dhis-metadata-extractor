import { Dhis2OptionSet, Dhis2Program } from '../models';
import { Dhis2OptionSetUtil, Dhis2ProgramUtil, LogsUtil } from '../utils';

export class AppProcess {
  private _dhis2OptionSetUtil: Dhis2OptionSetUtil;
  private _dhis2ProgramUtil: Dhis2ProgramUtil;

  constructor() {
    this._dhis2OptionSetUtil = new Dhis2OptionSetUtil();
    this._dhis2ProgramUtil = new Dhis2ProgramUtil();
  }

  async startProcess() {
    try {
      await new LogsUtil().addLogs('info', `Starting up the process`, 'app');
      const optionSetsMetadata: Dhis2OptionSet[] =
        await this._dhis2OptionSetUtil.discoverDhis2OptionSetsMetadata();
      const programsMetadata: Dhis2Program[] =
        await this._dhis2ProgramUtil.discoverProgramsMetadata();
      console.log({
        red: { optionSetsMetadata, programsMetadata }
      });
    } catch (error: any) {
      await new LogsUtil().addLogs('error', error.message || error, 'app');
    }
  }
}
