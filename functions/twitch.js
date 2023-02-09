const axios           = require('axios');
const funcs           = require('./general');
let   tokens          = require('../tokens.json');
let   monitoring      = false;

async function refreshToken(id,secret,refreshtoken,type) {
	await axios({
		method: "post",
		url: tokens[`${type}`].uri,
		data: {
			client_id     : id,
			client_secret : secret,
			refresh_token : refreshtoken != "" ? refreshtoken : tokens[`${type}`].refreshtoken,
			grant_type    : 'refresh_token',
		}
	})

	.then((response) => {
		tokens[`${type}`].timestamp    = Math.floor(Date.now() / 1000);
		tokens[`${type}`].accesstoken  = response.data.access_token;
		tokens[`${type}`].expiration   = response.data.expires_in;
		funcs.updateJSON("tokens.json",tokens);
	})
	.catch(err => {
		console.log(err);
	});
}

function getRefreshTime(type) {
	let currTime = Math.floor(Date.now() / 1000);
	let expireTime = tokens[`${type}`].timestamp + tokens[`${type}`].expiration - 30
	let refreshWait = currTime - expireTime > 0 ? 0 : (expireTime - currTime);
	if (refreshWait > 0) console.log(`Next Twitch ${type} token refresh in ${refreshWait} seconds.`);
	return refreshWait;
}

module.exports = {
	refreshToken,
	getRefreshTime
}
