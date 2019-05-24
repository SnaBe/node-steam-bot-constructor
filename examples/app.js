//Import libs & resources
const config = require('./settings/config.json');
const logger = require('../lib/logger');
const AppID = require('../resources/appids');
//Replace this with `const SteamBot = require('steam-bot-constructor');` if used outside of the module directory
const SteamBot = require('../index');
//Other required modules
const SteamTotp = require('steam-totp');

//Setup a new SteamBot instance named tradeBot
const tradeBot = new SteamBot({
  accountName: config.tradeBot.username,
  password: config.tradeBot.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.tradeBot.sharedSecret),
  identitySecret: config.tradeBot.identitySecret,
  gamesToPlay: AppID.TF2,
  personaName: config.tradeBot.displayName 
});

//Setup a new SteamBot instance named idleBot
const idleBot = new SteamBot({
  accountName: config.idleBot.username,
  password: config.idleBot.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.idleBot.sharedSecret),
  identitySecret: config.idleBot.identitySecret,
  gamesToPlay: AppID.TF2,
  personaName: config.idleBot.displayName 
});

//When the tradeBot instance receives a new trade offer, act on it.
tradeBot.manager.on('newOffer', function(offer) {
  logger.warn(`New offer #${offer.id} from ${offer.partner.getSteamID64()}. Offer note: ${offer.message}`);
  //Call a custom function
  processOffer(offer);
});

//When the idleBot instance receives chat messages
idleBot.client.on('friendMessage', function(steamID, message) {
  switch(message) {
    case '!help':
      idleBot.client.chatMessage(steamID, 'Hello! I\'m a TF2 bot. To get started type !commands');
      break;
    case '!commands':
      idleBot.client.chatMessage(steamID, 'Current list of commands: !help, !commands');
      break;
    default:
      idleBot.client.chatMessage(steamID, 'Unknown command, please try !commands or !help.'); 
      break; 
  }
});

//Your custom function to process the parsed offer.
function processOffer(offer) {
  logger.info(`Processing offer #${offer.id}`);
  //Built-in methods for getting getItemsToReceive & getItemsToGive
  var theirItems = tradeBot.getItemsToReceive(offer);
  var ourItems = tradeBot.getItemsToGive(offer);
  //Log the items
  logger.warn(`Our trade partner will give us ${theirItems.length} items.`);
  logger.warn(`We'll give our trade partner ${ourItems.length} of our items.`);
  //You can add more of your own code here
}
