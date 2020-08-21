var mongoose = require ("mongoose");
var schemas = require("./schemas.js");

let Game = mongoose.model('games', schemas.GameSchema);
let Guild = mongoose.model('guilds', schemas.GuildSchema);
let Channel = mongoose.model('channels', schemas.ChannelSchema);

async function getGame(uristring, guildId, channelId) {
  try {

    console.log("Trying to log in");

    await mongoose.connect(uristring, {useNewUrlParser: true, useUnifiedTopology: true});

    let query = await Channel.findOne({discord_id: channelId}).populate('game').exec();

    if (query == null ) {
      query = await Guild.findOne({discord_id: guildId}).populate('game').exec();
      if (query == null) {
        return null;
      } else {
      	console.log("Guild query:");
        console.log(query);
        return query.game;
      }
    } else {
    	console.log("Channel query:")
      console.log(query);
      return query.game;
    }
      
    } catch (e) {
      console.log(e);
  }
}

exports.getGame = getGame;
exports.Game = Game;
exports.Guild = Guild;
exports.Channel = Channel;
