import { AppProcess } from './app';
import { LogsUtil } from './utils';

starApp().then(() => {
  console.log('End of the script');
});

async function starApp() {
  try {
    const logsUtil = new LogsUtil();
    await logsUtil.clearLogs();
    await logsUtil.addLogs('info', 'Start an app', 'app');
    const appProcess = new AppProcess();
    await appProcess.startProcess();
    await logsUtil.addLogs('info', 'End of script', 'app');
  } catch (error: any) {
    error = error.message || error;
    console.log({ error });
  }
}
