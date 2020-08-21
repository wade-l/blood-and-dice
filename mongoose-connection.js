var mongoose = require ("mongoose");
var schemas = require("./schemas.js");

let Game = mongoose.model('games', schemas.GameSchema);
let Guild = mongoose.model('guilds', schemas.GuildSchema);
let Channel = mongoose.model('channels', schemas.ChannelSchema);

/**
  Retrieves the Game object for the corresponding guild and channel.
  Channel takes precedence over guild.
*/
async function getGame(uristring, guildId, channelId) {
    try {

        console.log("Connecting to MongoDB server [" + uristring + "]");

        await mongoose.connect(uristring, {useNewUrlParser: true, useUnifiedTopology: true});

        let query = await Channel.findOne({discord_id: channelId}).populate('game').exec();

        if (query == null ) {
            query = await Guild.findOne({discord_id: guildId}).populate('game').exec();
            if (query == null) {
                return null;
            } else {
                return query.game;
            }
          } else {
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
