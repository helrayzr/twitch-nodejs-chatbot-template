//Import all the libraries and modules
require('dotenv').config();
const ComfyJS         = require("@helrayzr/comfyjs-botoauthmod");
const jsonData        = require('./data.json');
const express         = require('express');
const bodyParser      = require('body-parser');
const oauthRoute      = require('./routes/oauth');
const funcs           = require('./functions/general');
const Spotify         = require('./functions/spotify');
const Twitch          = require('./functions/twitch');
const Dictionary      = require('./functions/dictionary');
let   mods            = jsonData.mods;
let   modcommands     = jsonData.modcommands;
let   tokens          = require('./tokens.json');
let   server          = express();
let   SPOTIFYID       = process.env.SPOTIFYCLIENTID;
let   SPOTIFYSECRET   = process.env.SPOTIFYCLIENTSECRET;
let   SPOTIFYREFRESH  = process.env.SPOTIFYREFRESH;
let   CLIENTID        = process.env.TWITCHCLIENTID;
let   CLIENTSECRET    = process.env.TWITCHCLIENTSECRET;
let   REFRESH         = process.env.REFRESH || tokens['streamer'].refreshtoken;
let   BOTREFRESH      = process.env.BOTREFRESH || tokens['bot'].refreshtoken;
let   streamer_timer;
let   bot_timer;

async function reconnectComfy(id,secret,refreshtoken,type,timer) {
	await funcs.sleep(timer,true);
	await Twitch.refreshToken(id,secret,refreshtoken,type);
	if (type === "streamer") {
		await ComfyJS.Disconnect();
		await ComfyJS.Init(jsonData.channel, tokens['streamer'].accesstoken, [ jsonData.channel ]);
	}
	if (type === "bot") {
		await ComfyJS.BotDisconnect();
		await ComfyJS.BotInit( jsonData.botname, tokens['bot'].accesstoken, [ jsonData.channel ] );
	}
	tokens[`${type}`].timestamp = Math.floor(Date.now() / 1000);
	funcs.updateJSON("tokens.json",tokens);
	let newtimer = Twitch.getRefreshTime(type);
	reconnectComfy(id,secret,refreshtoken,type,newtimer);
}

async function refreshCheck() {
	while ( REFRESH == "" || BOTREFRESH == "") {
		if (REFRESH == "") console.log("No streamer refresh token was found in .env or tokens.json files.")
		if (BOTREFRESH == "") console.log("No bot refresh token was found in .env or tokens.json files.")
		await funcs.sleep(60,true);
		REFRESH = tokens['streamer'].refreshtoken;
		BOTREFRESH = tokens['bot'].refreshtoken;
	}
}

async function startConnect() {
	streamer_timer = Twitch.getRefreshTime('streamer');
	if ( streamer_timer < 30 ) await Twitch.refreshToken(CLIENTID,CLIENTSECRET,REFRESH,'streamer');
	await ComfyJS.Init( jsonData.channel, tokens['streamer'].accesstoken, [ jsonData.channel ] );
	bot_timer = Twitch.getRefreshTime('bot');
	if ( bot_timer < 30 ) await Twitch.refreshToken(CLIENTID,CLIENTSECRET,BOTREFRESH,'bot');
	await ComfyJS.BotInit( jsonData.botname, tokens['bot'].accesstoken, [ jsonData.channel ] );
	reconnectComfy(CLIENTID,CLIENTSECRET,REFRESH,'streamer',streamer_timer);
	reconnectComfy(CLIENTID,CLIENTSECRET,BOTREFRESH,'bot',bot_timer);
}

async function initComfy() {
	await refreshCheck();
	await startConnect();
}

if (!CLIENTID || !CLIENTSECRET) {
	console.log('A Client ID and Secret are needed to proceed. Please follow README instructions for setting up a new developer app on dev.twitch.tv, acquiring the Client ID / Secret, and adding it to the CLIENTID & CLIENTSECRET variables in this chatbot\'s .env file.');
	return;
}

server
	.use(bodyParser.urlencoded({ extended: true }))
	.use('/oauth',oauthRoute);
server.listen(jsonData.port);
console.log(`listening on port ${jsonData.port}`);

const WEATHER = process.env.WEATHER;
const DICTIONARY = process.env.DICTIONARY;
if (WEATHER == "") {
	console.log("No OpenWeatherMap oauth token was found in the .env file. !weather command is disabled.")
}
if (DICTIONARY == "") {
	console.log("No Mirriam-Webster Dictionary API token was found in the .env file. dictionary commands are disabled.")
}

if (SPOTIFYREFRESH !== "" || tokens['spotify'].refreshtoken !== "") Spotify.RefreshMonitor(SPOTIFYID,SPOTIFYSECRET,SPOTIFYREFRESH !== "" ? SPOTIFYREFRESH : tokens['spotify'].refreshtoken);

ComfyJS.onCommand = async ( user, command, message, flags, extra ) => {
	let theUser = extra.username;
	let dispName = extra.displayName;
	let translatedMessage;

	if ( command === "addmod" ) {
		if ( !mods.includes(theUser) && modcommands.includes(command)) {
			ComfyJS.BotSay(`sorry ${dispName}, only mods can use the ${command} command.`);
			return;
		}
		let newmod = message.toLowerCase().split(/\s(.+)/)[0];
		mods[mods.length] = newmod;
		ComfyJS.BotSay( `${newmod} was added to the dictionary moderators list and can now use the following commands: ${jsonData.modcommands.join(', ')}`, extra.channel);
		funcs.updateJSON("data.json",jsonData);
		return;
	};

	if ( command === "removemod" ) {
		if ( !mods.includes(theUser) && modcommands.includes(command)) {
			ComfyJS.BotSay(`sorry ${dispName}, only mods can use the ${command} command.`);
			return;
		}
		let modname = message.split(/\s(.+)/)[0];
		if (modname === jsonData.channel.toLowerCase()) {
			mods.splice(mods.indexOf(theUser),1);
			funcs.updateJSON("data.json",jsonData);
			ComfyJS.BotSay( `Being cheeky, are ya? Well ${dispName}, you can't remove the streamer from the mods. And just for trying, you've been removed instead.`, extra.channel);
			return;
		}
		if (mods.includes(modname)) {
			mods.splice(mods.indexOf(modname),1);
			funcs.updateJSON("data.json",jsonData);
			ComfyJS.BotSay( `${modname} was removed from the mods list.`, extra.channel);
		} else {
			ComfyJS.BotSay( `${modname} was not found in the mods list.`, extra.channel);
		};
		return;
	};
	
	if ( command === "listmods" ) {
		ComfyJS.BotSay( `mods are: ${mods.join(', ')}`, extra.channel);
		return;
	};

	if( command === "brb" ) {
		if (!message) {
			ComfyJS.BotSay(`${user} needs to leave for a bit, but will be back soon.`,extra.channel);
		} else {
			ComfyJS.BotSay(`${user} needs to leave for a bit, but will be back in approx. ${message.split(' ')[0]} mins.`,extra.channel);
		}
		return;
	}
		
	if( command === "translate" ) {
		let translatedMessage = await funcs.translate(message);
		ComfyJS.BotSay(translatedMessage, extra.channel);
		return;
	};
	
	if( command === "weather" ) {
		if ( !WEATHER ) {
			ComfyJS.BotSay('OpenWeatherMap API key was not found.')
			return;
		}
		let weatherMessage = await funcs.getWeather(message,WEATHER);
		ComfyJS.BotSay(weatherMessage,extra.channel);
		return;
	};
	
	if( command === "songmonitor" ) {
		if ( !SPOTIFYREFRESH ) {
			console.log('No Spotify API keys, cannot start song monitor.')
			return;
		}
		Spotify.SongMonitor();
		return;
	};
	
	if( command === "song" ) {
		if ( !SPOTIFYREFRESH ) return;
		let message = Spotify.readSong('current');
		ComfyJS.BotSay(message,extra.channel);
		return;
	};
	
	if( command === "lastsong" ) {
		if ( !SPOTIFYREFRESH ) return;
		let message = Spotify.readSong('last');
		ComfyJS.BotSay(message,extra.channel);
		return;
	};
	
	if ( !DICTIONARY ) return;
	
	if( command === "suggestdef" ) {
		let response = Dictionary.addSuggestion(message,dispName);
		ComfyJS.BotSay(response,extra.channel);
		return;
	};
	
	if( command === "approvedef" ) {
		if ( !mods.includes(theUser) && modcommands.includes(command)) return `sorry ${dispName}, only mods can use the ${command} command.`;
		let approved = true;
		let response = Dictionary.resolveSuggestion(message,theUser,mods,approved);
		ComfyJS.BotSay(response,extra.channel);
		return;
	};
		
	if( command === "rejectdef" ) {
		if ( !mods.includes(theUser) && modcommands.includes(command)) return `sorry ${dispName}, only mods can use the ${command} command.`;
		let approved = false;
		let response = Dictionary.resolveSuggestion(message,theUser,mods,approved);
		ComfyJS.BotSay(response,extra.channel);
		return;
	};
	
	if( command === "removedef" ) {
		if ( !mods.includes(theUser) && modcommands.includes(command)) return `sorry ${dispName}, only mods can use the ${command} command.`;
		let response = Dictionary.removeDefinition(message,theUser,mods);
		ComfyJS.BotSay(response,extra.channel);
	};
	
	if( command === "pendingdefs" ) {
		let response = Dictionary.listPendingDefinitions();
		ComfyJS.BotSay(response,extra.channel);
	};
	
	if( command === "definition" ) {
		let response = await Dictionary.getDefinitions(message,DICTIONARY);
		ComfyJS.BotSay(response,extra.channel);
	};
	
	if( command === "nextdef" ) {
		let response = Dictionary.nextDefinition();
		ComfyJS.BotSay(response,extra.channel);
	};		
};

ComfyJS.onChat = ( user, message, flags, self, extra ) => {
	//exit if message is from the bot itself.
	if(self) return;
	//create variable for the username
	let theUser = extra.username;
	let dispName = extra.displayName;
	
}

initComfy();