const moment = require('moment');
const fileManipulation = require('./file-manipulation.helper');
const fileName = 'logs';
const dirFolder = 'logs';

async function clearLogs() {
  const data = '';
  try {
    await fileManipulation.writeToFile(dirFolder, fileName, data, false);
  } catch (error) {
    console.log(data);
  } finally {
    return;
  }
}
async function addLogs(type = 'INFO', message, resource = '') {
  const time = moment().format('YYYY-MM-DD hh:mm:ss A');
  const data = `${time} ${type}(${resource}) ${message}\n`;
  const flag = 'a+';
  try {
    await fileManipulation.writeToFile(dirFolder, fileName, data, false, flag);
  } catch (error) {
    console.log(data.replace('\n', ''));
  } finally {
    return;
  }
}

module.exports = { clearLogs, addLogs };
