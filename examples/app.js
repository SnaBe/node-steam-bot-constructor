const SteamBot = require('../index');
const SteamTotp = require('steam-totp');

const tradeBot = new SteamBot({
  accountName: "tradingbotforsnabe",
  password: "tradingbotforsteam",
  twoFactorCode: SteamTotp.generateAuthCode("Zl9HB6l9eA76Lpv9Wizwq8enSls=")
});

const idleBot = new SteamBot({
  accountName: "tradingbotforsnabe",
  password: "tradingbotforsteam",
  twoFactorCode: SteamTotp.generateAuthCode("Zl9HB6l9eA76Lpv9Wizwq8enSls=")
});
