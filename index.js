const logsHelper = require('./helpers/logs.helper');
const app = require('./app');

start();

async function start() {
  try {
    await logsHelper.addLogs('INFO', 'Start an app', 'App');
    await app.startApp();
  } catch (error) {
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}
