const Winston = require('winston');
const level = require('../resources/levels');
const colors = require('../resources/colors.js');

Winston.addColors(colors);

const logger = module.exports = Winston.createLogger({
  levels: level,
  format: Winston.format.combine(
    Winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    Winston.format.printf(info => `${info.timestamp}: ${info.message}`)
  ),
  transports: [
    new Winston.transports.Console({
      format: Winston.format.combine(
        Winston.format.colorize({message: true}),
        Winston.format.printf(info => `${info.timestamp}: ${info.message}`)
      )
    }),
    new Winston.transports.File({
      level: 'error',
      filename: './logs/errors.log'
    })
  ],
  level: 'info'
});

