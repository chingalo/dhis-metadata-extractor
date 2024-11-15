import {
  Dhis2OptionSetUtil,
  Dhis2ProgramRuleVariableUtil,
  Dhis2ProgramRuleUtil,
  Dhis2ProgramUtil,
  LogsUtil,
  Dhis2ProgramRuleActionUtil,
  Dhis2IndicatorUtil,
  Dhis2ProgramIndicatorUtil
} from '../utils';

export class AppProcess {
  private _dhis2OptionSetUtil: Dhis2OptionSetUtil;
  private _dhis2ProgramUtil: Dhis2ProgramUtil;
  private _dhis2ProgramRuleVariableUtil: Dhis2ProgramRuleVariableUtil;
  private _dhis2ProgramRuleUtil: Dhis2ProgramRuleUtil;
  private _dhis2ProgramRuleActionUtil: Dhis2ProgramRuleActionUtil;
  private _dhis2IndicatorUtil: Dhis2IndicatorUtil;
  private _dhis2programIndicatorUtil: Dhis2ProgramIndicatorUtil;

  constructor() {
    this._dhis2OptionSetUtil = new Dhis2OptionSetUtil();
    this._dhis2ProgramUtil = new Dhis2ProgramUtil();
    this._dhis2ProgramRuleVariableUtil = new Dhis2ProgramRuleVariableUtil();
    this._dhis2ProgramRuleUtil = new Dhis2ProgramRuleUtil();
    this._dhis2ProgramRuleActionUtil = new Dhis2ProgramRuleActionUtil();
    this._dhis2IndicatorUtil = new Dhis2IndicatorUtil();
    this._dhis2programIndicatorUtil = new Dhis2ProgramIndicatorUtil();
  }

  async startProcess() {
    try {
      await new LogsUtil().addLogs('info', `Starting up the process`, 'app');
      const optionSetsMetadata =
        await this._dhis2OptionSetUtil.discoverDhis2OptionSetsMetadata();
      await this._dhis2OptionSetUtil.generateExcelFile(optionSetsMetadata);
      const programsMetadata =
        await this._dhis2ProgramUtil.discoverProgramsMetadata();
      await this._dhis2ProgramUtil.generateExcelFile(programsMetadata);
      const programRuleVariables =
        await this._dhis2ProgramRuleVariableUtil.discoverProgramRuleVariables();
      const programRuleActions =
        await this._dhis2ProgramRuleActionUtil.discoverProgramRuleActions();
      const programRules =
        await this._dhis2ProgramRuleUtil.discoverProgramRuleVariables();
      await this._dhis2ProgramRuleUtil.generateExcelFile(
        programRules,
        programRuleVariables,
        programRuleActions
      );
      const programIndicators =
        await this._dhis2programIndicatorUtil.discoverProgramIndicators();
      await this._dhis2programIndicatorUtil.generateExcelFile(
        programIndicators,
        programsMetadata
      );
      const indicators = await this._dhis2IndicatorUtil.discoverIndicators();
      await this._dhis2IndicatorUtil.generateExcelFile(
        indicators,
        programIndicators
      );
    } catch (error: any) {
      await new LogsUtil().addLogs('error', error.message || error, 'app');
    }
  }
}
