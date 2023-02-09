const axios           = require('axios');
const funcs            = require('./general');
let   tokens          = require('../tokens.json');
let   tracks          = require('../tracks.json');
let   checkingSpotify = false;

async function refreshToken(id,secret,refreshtoken) {
	await axios({
		method: "post",
		url: tokens['spotify'].uri,
		params: {
			refresh_token  : refreshtoken !== "" ? refreshtoken : tokens['spotify'].refreshtoken,
			grant_type     : 'refresh_token'
		},
		auth: {
			username: id,
			password: secret
		}
	})
	.then((response) => {
		//console.log(response);
		tokens['spotify'].timestamp    = Math.floor(Date.now() / 1000);
		tokens['spotify'].accesstoken  = response.data.access_token;
		tokens['spotify'].expiration   = response.data.expires_in;
		funcs.updateJSON("tokens.json",tokens);
	})
	.catch(err => {
		console.log(err);
	});
}

async function getCurrentSong() {
	let nextCheck = await axios.get('https://api.spotify.com/v1/me/player/currently-playing',{
		headers: {
			'Authorization': `Bearer ${tokens['spotify'].accesstoken}` 
		}
	})
	.then((response) => {
		//console.log(response);
		let artists = "";
		if (response.data === '') {
			funcs.writeFile("CurrentSongArtist.txt", 'No Spotify music playing');
			return -1;
		};
		response.data.item.artists.forEach(artist => {
			artists += `${artist.name}, `;
		});
		artists = artists.substring(0,artists.length - 2);
		let track = response.data.item.name;
		if ( tracks['current'].name !== track ) {
			tracks['last'].name = tracks['current'].name;
			tracks['last'].artist = tracks['current'].artist;
			tracks['current'].name = track;
			tracks['current'].artist = artists;
			funcs.updateJSON("tracks.json",tracks);
			funcs.writeFile("CurrentSongArtist.txt", `${track} - ${artists}`);
		}
		let waitTime = response.data.item.duration_ms - response.data.progress_ms + 2000;
		return waitTime;
	})
	.catch((err) => {
		console.log(err);
		return -1;
	});
	if (nextCheck !== -1) console.log(`Checking for next song in ${Math.floor(nextCheck / 1000)} seconds`);
	return nextCheck;
}

async function RefreshMonitor(id,secret,refreshtoken) {
	while (true) {
		let currTime = Math.floor(Date.now() / 1000);
		let expireTime = tokens['spotify'].timestamp + tokens['spotify'].expiration - 30
		let refreshWait = currTime - expireTime > 0 ? 0 : (expireTime - currTime);
		//if (refreshWait > 0) console.log('Next Spotify token refresh in ' + refreshWait + ' seconds.');
		await funcs.sleep(refreshWait,true);
		await refreshToken(id,secret,refreshtoken);
	}
}

async function SongMonitor() {
	console.log('song monitoring started.');
	let currTime = Math.floor(Date.now() / 1000);
	let expireTime = tokens['spotify'].timestamp + tokens['spotify'].expiration - 30
	if ( expireTime - currTime < 1) {
		console.log('Access token has expired. There may be an issue with your refresh token.');
		return;
	}
	checkingSpotify = true;
	let nextCheck;
	while (nextCheck !== -1) {
		nextCheck = await getCurrentSong();
		if ( nextCheck !== -1) await funcs.sleep(nextCheck);
	}
	console.log('no song detected. song monitoring stopped.');
	checkingSpotify = false;
}

function readSong(type) {
	return type.charAt(0).toUpperCase() + type.slice(1) + ' Song: "' + tracks[`${type}`].name + '" by ' + tracks[`${type}`].artist;
}

module.exports = {
	refreshToken,
	getCurrentSong,
	RefreshMonitor,
	SongMonitor,
	readSong
}