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
    //Identity secret
    this.identitySecret = logOnOptions.identitySecret;
    //Game to play
    this.gamesToPlay = logOnOptions.gamesToPlay;
    //Display name / persona name
    this.personaName = logOnOptions.personaName;
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
      //Play a chosen game
      this.client.gamesPlayed(this.gamesToPlay);
      //No identity secret supplied
      if(!this.identitySecret) {
        logger.warn(`Bot ${this.client.steamID.getSteamID64()} will be unable to accept or create trade offers without an identity secret.`);
      }
      //Set the clients default state to Online
      this.client.setPersona(SteamUser.EPersonaState.Online, this.personaName);
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
    //A bot instance encountered an error
    this.client.on('error', (err) => {
      logger.error(`Bot ${client.steamID.getSteamID64()} encountered an error: ${err}`);
    });
    //Whenever a bot instance receives new Steam items
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
  //Steamcommunity methods
  //Posting a comment on a given users Steam profile
  commentOnUserProfile(user, comment, callback) {
    //The community instance handles the the 'posting'
    this.community.postUserComment(user, comment, (err) => {
      if(err) {
        return callback(new Error(`Error posting a comment to user ${user}'s profile: ${err}`), false);
      }
      callback(err, `Successfully commented ${comment} on user ${user}'s profile.`);
    });
  }
  //Handeling Trade Offers
  //Get item count from a inventory
  getItemCount(inventory, item) {
    //An empty array of Steam items
    var items = [];
    //Loop trough the inventory
    for(var n = 0; n < inventory.length; n++) {
      //Look for item
      if(inventory[n].market_hash_name.indexOf(item) >= 0) {
        //Add it to our array
        items.push(item);
      }
    }
    //Return the number items in the array
    return Number(items.length);
  }
  //Get items by name
  getItemsByName(inventory, item, amount) {
    //An empty array of Steam items
    var items = [];
    //Loop trough the inventory
    for(var n = 0; n < inventory.length; n++) {
      //Look for x amount of item
      if(items.length < amount && inventory[n].market_hash_name.indexOf(item) >= 0) {
        //Add it to our array
        items.push(inventory[n]);
      }
    }
    //Return the updated array of items
    return items;
  }
  //Get items to receive from a trade offer
  getItemsToReceive(offer) {
    var itemsToReceive = [];
    //The items to receive in the trade offer
    offer.itemsToReceive.forEach((item) => {
      //If the item has a market_hash_name
      if(item.market_hash_name) {
        //Add it to our array
        itemsToReceive.push(item);
      }
    });
    //Return the updated array of items to receive
    return itemsToReceive;
  }
  //Get items to give from a trade offer
  getItemsToGive(offer) {
    var itemsToGive = [];
    //The items we're trading to another user
    offer.itemsToGive.forEach((item) => {
      //If the item has a market_hash_name
      if(item.market_hash_name) {
        //Add it to our array
        itemsToGive.push(item);
      }
    });
    //Return the updated array of items to give
    return itemsToGive;
  }
  //Accept offer
  acceptOffer(offer, callback) {
    //Accept the parsed offer
    offer.accept((err, status) => {
      if(err) {
        callback(new Error(`Unable to accept offer #${offer.id}, error: ${err}`), false);
      } else if(status == 'pending') {
        logger.info(`Validated offer #${offer.id}, awaiting confirmation.`);
        //Confirm the offer using the bot instances identity secret
        this.community.acceptConfirmationForObject(this.identitySecret, offer.id, (err) => {
          if(err) {
            return callback(new Error(`Unable to confirm offer #${offer.id}, error: ${err.message}`), false);  
          }
          callback(err, `Trade offer #${offer.id} confirmed.`);
        });
      } else {
        callback(err, `Confirmed donation #${offer.id} from ${offer.partner.getSteamID64()}.`);
      }
    });
  }
  //Decline offer
  declineOffer(offer, callback) {
    //Decline the parsed offer
    offer.decline((err) => {
      if(err) {
        return callback(new Error(`Error declining offer #${offer.id}, error: ${err}`), false);
      }
      callback(err, `Offer #${offer.id} was successfully declined.`);
    });
  }
  //Create a trade offer
  createTradeOffer(partner, theirItems, ourItems, message, callback) {
    //Create the offer
    var offer = manager.createOffer(partner);
    //Set an offer message
    offer.setMessage(message);
    //Add their items
    offer.addTheirItems(theirItems);
    //Add our items
    offer.addMyItems(ourItems);
    //Confirm and send the trade offer
    offer.send((err, status) => {
      if(err) {
        this.client.chatMessage(partner, `Something went wrong sending you the trade offer, please try again. If this continues please contact the administrator.`);
        return callback(new Error(`Error sending the trade offer: ${err}`), false);
      } else if(status == 'pending') {
        logger.warn(`Trade offer #${offer.id} is validated, but awaiting confirmation.`);
        //Notify our trade partner of the trade offer state
        this.client.chatMessage(partner, `The trade offer is validated, but awaiting confirmation.`);
        //Confirm the offer using the bot instances identity secret
        this.community.acceptConfirmationForObject(this.identitySecret, offer.id, (err) => {
          if(err) {
            //Notify our trade partner of the trade offer state
            this.client.chatMessage(partner, `Error confirming your trade offer, retrying.`);
            return callback(new Error(`Error confirming trade offer #${offer.id}`), false);
          } else {
            //Notify our trade partner of the trade offer state
            this.client.chatMessage(partner, `The trade offer was sent successfully. You can accept it here: http://steamcommunity.com/tradeoffer/${offer.id}`);
            callback(err, `Trade offer #${offer.id} confirmed.`);
          }
        });
      }
    });
  }
}
//Export the module
module.exports = SteamBot;

