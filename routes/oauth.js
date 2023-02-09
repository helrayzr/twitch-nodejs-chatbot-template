require('dotenv').config();
const axios          = require('axios');
const express        = require('express');
const router         = express.Router();
const funcs          = require('../functions/general');
let   jsonData       = require('../data.json');
var   tokens         = require('../tokens.json');
let   SPOTIFYID      = process.env.SPOTIFYCLIENTID;
let   SPOTIFYSECRET  = process.env.SPOTIFYCLIENTSECRET;
let   TWITCHCLIENTID = process.env.TWITCHCLIENTID;
let   TWITCHSECRET   = process.env.TWITCHCLIENTSECRET;
let   spotifylink    = SPOTIFYID === "" ? "" : `
	<h3 style="text-align:center;">
		<a href="https://accounts.spotify.com/en/authorize?response_type=code&client_id=${SPOTIFYID}&redirect_uri=http://localhost:${jsonData.port}/oauth/auth/spotify&scope=user-read-currently-playing">Authorize Spotify</a>
	</h3>
`;



router.get('/setup', (req, res) => {
	//console.log(req);
	res.send(`
	<h1 style="text-align: center">Use the following links to get  auth tokens for your main and bot accounts.</h1>
	<h2 style = "text-align: center; font-weight: bold">DO NOT DO THIS ON STREAM! you will expose sensitive information.</h2>
	<h3 style="text-align:center;">
		<a href="https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCHCLIENTID}&redirect_uri=http://localhost:${jsonData.port}/oauth/auth/streamer&scope=bits%3Aread+channel%3Aread%3Asubscriptions+channel_subscriptions+user%3Aedit+chat%3Aread+chat%3Aedit+channel%3Amoderate+moderation%3Aread+moderator%3Amanage%3Achat_settings+whispers%3Aedit+user%3Amanage%3Awhispers+whispers%3Aread+channel%3Amanage%3Aredemptions+channel%3Aread%3Aredemptions+channel%3Aedit%3Acommercial+channel_commercial+channel%3Amanage%3Abroadcast+channel_editor+user%3Aedit%3Abroadcast+clips%3Aedit+channel%3Amanage%3Aextensions+channel%3Aread%3Ahype_train+analytics%3Aread%3Aextensions+analytics%3Aread%3Agames+user%3Aread%3Afollows+user%3Aread%3Abroadcast+user%3Aread%3Aemail+channel%3Aread%3Apolls+channel%3Amanage%3Apolls+channel%3Aread%3Apredictions+channel%3Amanage%3Apredictions+moderator%3Amanage%3Aannouncements+channel%3Amanage%3Amoderators+channel%3Aread%3Avips+channel%3Amanage%3Avips+user%3Amanage%3Achat_color+moderator%3Amanage%3Achat_messages+channel%3Aread%3Agoals+channel%3Aread%3Acharity+moderator%3Aread%3Achatters">Streamer Account</a>
	</h3>
	<h3 style="text-align: center;">
		<a href="https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCHCLIENTID}&redirect_uri=http://localhost:${jsonData.port}/oauth/auth/bot&scope=chat%3Aread+chat%3Aedit">Bot Account</a>
	</h3>
	${spotifylink}
	`);
});

router.get('/auth/:type', async (req, res) => {
	let data;
	let type = req.params.type.toLowerCase();
	tokens[`${type}`].code = req.query.code;
	let urlparams = type === 'spotify' ? {
		client_id      : SPOTIFYID,
		client_secret  : SPOTIFYSECRET,
		code           : tokens[`${type}`].code,
		grant_type     : 'authorization_code',
		redirect_uri   : `http://localhost:${jsonData.port}/oauth/auth/${type}`
	} : "";
	let urldata = type === 'spotify' ? "" : {
		client_id      : TWITCHCLIENTID,
		client_secret  : TWITCHSECRET,
		code           : tokens[`${type}`].code,
		grant_type     : 'authorization_code',
		redirect_uri   : `http://localhost:${jsonData.port}/oauth/auth/${type}`
	};
	let urlauth = type === 'spotify' ? {
		username: SPOTIFYID,
		password: SPOTIFYSECRET
	} : null;
	await axios({
		url:    tokens[`${type}`].uri,
		method: 'post',
		params: urlparams,
		data:   urldata,
		auth:   urlauth
	})	
	.then((response) => {
		tokens[`${type}`].accesstoken  = response.data.access_token;
		tokens[`${type}`].refreshtoken = response.data.refresh_token;
		tokens[`${type}`].expiration   = response.data.expires_in;
		tokens[`${type}`].timestamp    = Math.floor(Date.now() / 1000);
		funcs.updateJSON("tokens.json",tokens);
	})
	.catch(err => {
		console.log(err);
	});
	type = type[0].toUpperCase() + type.slice(1);
	res.send(`
	<h1 style="text-align: center">${type} Account Tokens Generated.</h1>
	<h2 style = "text-align: center; font-weight: bold">Close this tab if you've already created your other tokens.</h2>
	<h2 style = "text-align: center;">remember to transfer your ${req.params.type} refresh token to the .env file and remove all codes / tokens from the tokens.json for security purposes.</h2>
	<h2 style="text-align:center;">
		If not, <a href="/oauth/setup">Return to Setup</a>
	</h2>
	`);	
})

module.exports = router;