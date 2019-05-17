const config = require('./settings/config.json');
const SteamBot = require('../index');
const SteamTotp = require('steam-totp');

const tradeBot = new SteamBot({
  accountName: config.tradeBot.username,
  password: config.tradeBot.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.tradeBot.sharedSecret)
});

const idleBot = new SteamBot({
  accountName: config.idleBot.username,
  password: config.idleBot.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.tradeBot.sharedSecret)
});
