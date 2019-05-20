//Import libs & resources
const config = require('./settings/config.json');
const logger = require('../lib/logger');
const AppID = require('../resources/appids');
//Replace this with `const SteamBot = require('steam-bot-constructor');` if used outside of the module directory
const SteamBot = require('../index');
//Other required modules
const SteamTotp = require('steam-totp');
const SteamRepApi = require('steamrep');

SteamRepApi.timeout = 5000;

//Setup a new SteamBot instance named tradeBot
const tradeBot = new SteamBot({
  accountName: config.tradeBot.username,
  password: config.tradeBot.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.tradeBot.sharedSecret)
});

//Setup a new SteamBot instance named idleBot
const idleBot = new SteamBot({
  accountName: config.idleBot.username,
  password: config.idleBot.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.idleBot.sharedSecret)
});

//The tradeBot instance will play TF2 once it logs onto Steam.
tradeBot.client.on('loggedOn', function(details) {
  tradeBot.client.gamesPlayed(AppID.TF2);
});

//The idleBot instance will play DOTA 2 once it logs onto Steam.
idleBot.client.on('loggedOn', function(details) {
  idleBot.client.gamesPlayed(AppID.DOTA2);
});

//When the tradeBot instance receives a new trade offer, act on it.
tradeBot.manager.on('newOffer', function(offer) {
  logger.warn(`New offer #${offer.id} from ${offer.partner.getSteamID64()}. Offer note: ${offer.message}`);
  //Call a custom function 
  processOffer(offer);
});

//Your custom function to process the parsed offer.
function processOffer(offer) {
  logger.info(`Processing offer #${offer.id}`);
  //You can add more of your own code here
}
