import { LogsUtil } from '../utils';

export class AppProcess {
  constructor() {}

  async startProcess() {
    try {
      await new LogsUtil().addLogs('info', `Starting up the process`, 'app');
    } catch (error: any) {
      await new LogsUtil().addLogs('error', error.message || error, 'app');
    }
  }
}
