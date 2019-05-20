//Require the needed node modules
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
//Require a custom console logger
const logger = require('./lib/logger');
//Our SteamBot class
class SteamBot {
  //Constructor
  constructor(logOnOptions) {
    this.client = new SteamUser();
    this.community = new SteamCommunity();
    this.manager = new TradeOfferManager({
      steam: this.client,
      community: this.community,
      language: 'en'
    });
    //Log on using the parsed options
    this.logOn(logOnOptions);
  }
  //Log on method
  logOn(logOnOptions) {
    //The client will log on using the parsed options
    this.client.logOn(logOnOptions);
    //The loggedOn event was emitted
    this.client.on('loggedOn', (details) => {
      logger.info(`Bot ${this.client.steamID.getSteamID64()} successfully logged into Steam!`);
      //Set the clients default state to Online
      this.client.setPersona(SteamUser.EPersonaState.Online);
    });
    //The clients web session
    this.client.on('webSession', (sessionid, cookies) => {
      //Set the cookies for trade offers
      this.manager.setCookies(cookies, (err) => {
        if(err) {
          logger.error(`Bot ${this.client.steamID.getSteamID64()} was unable to get cookies for trade offers. Error: ${err}`);
          //Exit
          process.exit(1);
        }
        logger.info(`Bot ${this.client.steamID.getSteamID64()}'s trade offer cookies set. Got its api key: ${this.manager.apiKey}`);
      });
      //Set the cookies for steamcommunity
      this.community.setCookies(cookies);
    });
    //A bot instance ran encountered an error
    this.client.on('error', (err) => {
      logger.error(`Bot ${client.steamID.getSteamID64()} encountered an error: ${err}`);
    });
    //Whenever we receive new Steam items
    this.client.on('newItems', (count) => {
      logger.info(`Bot ${client.steamID.getSteamID64()} received ${count} new items.`);
    });
    //Handle a trade request from a given user
    this.client.on('tradeRequest', (steamID, respond) => {
      logger.info(`Bot ${this.client.steamID.getSteamID64()} received a trade request from user ${steamID}, declining...`);
      //We do not wish to open up a trade window
      respond(false);
      this.client.chatMessage(steamID, 'I\'m not currently programmed to use the trade window. If you think this is an error, please contact the administrator.');
    });
    //When an offer sent by another user changes state
    this.manager.on('receivedOfferChanged', (offer, oldState) => {
      var user = offer.partner.getSteamID64();
      logger.warn(`${user}'s offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
    });
    //When an offer we sent changes state
    this.manager.on(`sentOfferChanged`, (offer, oldState) => {
      logger.warn(`Bot ${this.client.steamID.getSteamID64()}'s offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
    });
  }
}

//Export the module
module.exports = SteamBot;