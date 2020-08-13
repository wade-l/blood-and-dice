"use strict";
const mongoose = require("mongoose");

var GameSchema = new mongoose.Schema({
	name: String,
	system: String
});

var GuildSchema = new mongoose.Schema({
	discord_id: String,
	game: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "games"
	}
});

var ChannelSchema = new mongoose.Schema({
	discord_id: String,
	game: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "games"
	}
});

exports.GameSchema = GameSchema;
exports.GuildSchema = GuildSchema;
exports.ChannelSchema = ChannelSchema;
