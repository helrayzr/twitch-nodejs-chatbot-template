const axios       = require('axios');
const translation = require('./translation.json');
const weather     = require('./weather.json');
const fs          = require('fs');

async function sleep(duration,seconds = false) {
	let multiplier = seconds ? 1000 : 1;
	await new Promise(resolve => setTimeout(resolve,duration*multiplier));
}

function updateJSON(file,jsonObj) {
	data = JSON.stringify(jsonObj, null, "\t");
	fs.writeFile(file, data, function(err) {
		if (err) {
			console.log(err);
		};
	});
}

function writeFile(file,string) {
	fs.writeFile(file, string, function(err) {
		if (err) {
			console.log(err);
		};
	});
}

async function translate(message) {
	let phrase = message;
	let code = "";
	let name = "";
	if ( message === '-help' ) {
		return `The !translate function uses Google Translate's API to auto-detect the text following the command. By default, it will translate to English, but if you use "!translate -language:<Insert Language Name / Code Here>" it will convert the proceeding text to that language so long as it is recognized by Google Translate. for example: "!translate -language:es message" will translate the word "message" to Spanish (-language:spanish will do the same thing as -language:es)`;
	}
	if ( phrase.match(/-language:/gi) ) {
		let tlang = message.split(':')[1].split(' ')[0];
		let tlangrx = new RegExp(tlang, 'gi');
		phrase = phrase.replace(/-language:.*? /gi,'');
		let tcode = translation.languages.findIndex(function(currentValue, index, arr) {
			return currentValue.Code.toLowerCase() == tlang.toLowerCase();
		});
		let tfull = translation.languages.findIndex(function(currentValue, index, arr) {
			return currentValue.Name.match(tlangrx);
		});
		if ( tcode + tfull === -2 ) {
			return `language name/code '${tlang}' was not found.`;
		} else if ( tcode === -1 ) {
			code = translation.languages[tfull].Code;
			name = translation.languages[tfull].Name;
		} else {
			code = translation.languages[tcode].Code;
			name = translation.languages[tcode].Name;
		};
	}
	if (code === "") code = "en";
	if (name === "") name = "English";
	let uri = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${code}&dt=t&q=${phrase}`;
	let res = encodeURI(uri);
	let out = await axios.get(res)
		.then (function (response) {
			let len = response.data[0].length;
			let start = [];
			for(i = 0;i < len; i++) {
				start.push(response.data[0][i][0]);
			}
			let idx = translation.languages.findIndex(function(currentValue, index, arr) {
				return currentValue.Code.toLowerCase() == response.data[2].toLowerCase();
			});
			let lang = translation.languages[idx].Name;
			return `"${phrase}", translated from ${lang} to ${name}, is "${start.join('')}"`;
		})
		.catch (function (error) {
			console.log(error);
			return "There was an error translating.";
		});
	return out;
}

async function getWeather(message,key) {
	if ( message === '-help' ) {
		return `The !weather function uses OpenWeatherMap's API to find the weather in the city/state/country specified after the command. To ensure you are getting the desired results, be specific. The format options are: 1. <City Name>, 2. <City Name>,<Country Name/Code>, and 3. <City Name>,<State Name/Code>,US (API only supports State name/code for US locations).`;
	}
	if ( message == "") return 'no location specified. use "!weather -help" to get more info on how to use the !weather command.';
	let loc = message;
	let locArr = message.split(',');
	let city;
	let countryname;
	let countrycode;
	let statename;
	let statecode;

	
	if ( locArr.length === 1 ) {
		loc = message.replace(' ','%20');
	} else {
		city          = locArr[0];
		let country   = locArr.length > 2 ? 'US' : locArr[1].trim();
		let countryrx = new RegExp(country.trim(), 'gi');
		let state     = locArr.length > 2 ? locArr[1].trim() : null;
		let codeidx;
		let fullidx;
		if ( state ) {
			let staterx = new RegExp(state, 'gi');
			codeidx = weather.states.findIndex(function(currentValue, index, arr) {
				return currentValue.Code.toLowerCase() == state.toLowerCase();
			});
			fullidx = weather.states.findIndex(function(currentValue, index, arr) {
				return currentValue.Name.match(staterx);
			});
			if ( codeidx + fullidx === -2 ) {
				return `state name/code '${state}' was not found.`;
			} else if ( codeidx === -1 ) {
				statecode = weather.states[fullidx].Code;
				statename = weather.states[fullidx].Name;
			} else {
				statecode = weather.states[codeidx].Code;
				statename = weather.states[codeidx].Name;
			};			
		} else {
			codeidx = weather.countries.findIndex(function(currentValue, index, arr) {
				return currentValue.Code.toLowerCase() == country.toLowerCase();
			});
			fullidx = weather.countries.findIndex(function(currentValue, index, arr) {
				return currentValue.Name.match(countryrx);
			});
			if ( codeidx + fullidx === -2 ) {
				return `country name/code '${country}' was not found.`;
			} else if ( codeidx === -1 ) {
				countrycode = weather.countries[fullidx].Code;
				countryname = weather.countries[fullidx].Name;
			} else {
				countrycode = weather.countries[codeidx].Code;
				countryname = weather.countries[codeidx].Name;
			};
		}
		loc = state ? `${city},${statecode},US` : `${city},${countrycode}`;
	}
	let out = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${loc}&appid=${key}`)
		.then(function (weatherdata) {
			//console.log(weatherdata.data);
			let celcius     = weatherdata.data.main.temp - 273.15;
			let fahrenheit  = Math.round(celcius * 1.8 + 32);
			celcius         = Math.round(celcius * 10) / 10;
			let wind_metric = weatherdata.data.wind.speed;
			let wind_mph    = Math.round(wind_metric * 2.2369362912 * 10) / 10;
			wind_metric     = Math.round(wind_metric * 10) / 10;
			let humidity    = weatherdata.data.main.humidity;
			let city        = weatherdata.data.name;
			let countryidx  = weather.countries.findIndex(function(currentValue, index, arr) {
				return currentValue.Code.toLowerCase() == weatherdata.data.sys.country.toLowerCase();
			});
			let country = weather.countries[countryidx].Name;
			let description = weatherdata.data.weather[0].description;
			return `${celcius}°C/${fahrenheit}°F, ${humidity}% humidity, with ${description} and ${wind_metric} m/s (${wind_mph} MPH) winds in ${city}${!!statename ? ', ' + statename : ''} (${!!countryname ? countryname : country}).`;
		})
		.catch(function (error) {
			console.log(error);
			return `An error occurred while looking up temperature data for ${loc}.`;
		});
	return out;
}

module.exports = {
	sleep,
	updateJSON,
	writeFile,
	translate,
	getWeather
};