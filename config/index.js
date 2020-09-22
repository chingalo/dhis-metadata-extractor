const { sourceServer } = require('./server-config');
const { programs } = require('./metadata');

module.exports = {
  sourceConfig: sourceServer,
  programs,
};
