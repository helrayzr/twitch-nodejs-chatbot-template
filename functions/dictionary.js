const axios             = require('axios');
//const fs                = require('fs');
const funcs             = require('./general');
let   MyDictionary      = require('./definitions.json');
let   suggestions       = MyDictionary.suggestions;
let   customdefinitions = MyDictionary.definitions;
let   defs              = [];
let   lastword          = "";

function addSuggestion(message,dispName) {
	if (message == "") return "Invalid - Please enter a suggested word and definition after the command.";
	let definition = message.split(' ');
	let word = definition.shift();
	if (definition.length === 0) return `Invalid - Please enter a suggested definition for ${word}.`;
	let suggestion = {
		"User": dispName,
		"Word": word,
		"Definitions": [
			definition.join(' ')
		]
	};
	suggestions[suggestions.length] = suggestion;
	funcs.updateJSON("./functions/definitions.json",MyDictionary);
	return `Your suggestion has been noted, ${dispName}.`;
}

function resolveSuggestion(message,theUser,modsList,approved = true) {
	if (!modsList.includes(theUser)) return `You are not authorized to ${approved ? 'approve' : 'reject'} suggestions. Only mods can do this.`;
	let word = message.split(/\s+/gi)[0];
	if (word == "") return "Invalid - Please enter a word after the command.";
	let suggestidx = suggestions.findIndex(function (s) {
		return s.Word.toLowerCase() === word.toLowerCase();
	});
	if (suggestidx === -1) return `${word} was not found in the list of suggestions.`;
	let newword = {
		"Word": suggestions[suggestidx].Word,
		"Definitions": suggestions[suggestidx].Definitions
	};
	if ( approved ) {
		let defidx = customdefinitions.findIndex(function (s) {
			return s.Word.toLowerCase() === newword.Word.toLowerCase();
		});
		if ( defidx === -1) {
			customdefinitions[customdefinitions.length] = newword;
		} else {
			let defslength = customdefinitions[defidx].Definitions.length;
			customdefinitions[defidx].Definitions[defslength] = newword.Definitions[0];
		}
	}
	suggestions.splice(suggestidx,1);
	funcs.updateJSON("./functions/definitions.json",MyDictionary);
	return `"${newword.Word}: ${newword.Definitions[0]}" was ${approved ? 'added' : 'denied entry'} into the dictionary.`;
}

function removeDefinition(message,theUser,modsList) {
	if (!modsList.includes(theUser)) return "You are not authorized to remove definitions. Only mods can do this.";
	let word = message.split(/\s+/gi)[0];
	if (word == "") return "Invalid - Please enter a word after the command.";
	let idx = customdefinitions.findIndex(function (s) {
		return s.Word.toLowerCase() === word.toLowerCase();
	});
	if (idx === -1) return `${word} was not found in the custom dictionary.`;
	let numdefs = customdefinitions[idx].Definitions.length;
	customdefinitions.splice(idx,1);
	funcs.updateJSON("./functions/definitions.json",MyDictionary);
	return `${word} and its ${numdef} definition${numdefs > 1 ? 's were' : ' was'} removed from the custom dictionary.`;	
}

function listPendingDefinitions() {
	let i = 1;
	let response = "";
	let suggestLength = suggestions.length;
	if ( suggestLength === 0 ) return "There are no suggestions to review.";
	suggestions.forEach(suggestion => {
		response += `${i}) ${suggestion.Word}: ${suggestion.Definitions[0]} (suggested by ${suggestion.User})${i === suggestLength ? '' : ', '}`;
		i++;
	});
	return response;
}

async function getDefinitions(message,key) {
	let word = message.split(/\s+/gi)[0];
	if ( !word ) return "Invalid - Please enter a word after the command.";
	let idx = customdefinitions.findIndex(function (d) {
		return d.Word.toLowerCase() === word.toLowerCase();
	});
	let customDefs = idx === -1 ? 0 : customdefinitions[idx].Definitions.length
	lastword = word;
	let out = await axios.get(`https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${key}`)
		.then(function (dictionary) {
			if ( typeof dictionary.data === 'string' || dictionary.data instanceof String || typeof dictionary.data[0] === 'string' || dictionary.data[0] instanceof String || dictionary.data.length === 0) {
				if (idx === -1) return `${word} was not found in the dictionary.`;
				let i = 1;
				let list = `Only custom definitions found for ${customdefinitions[idx].Word}. `;
				customdefinitions[idx].Definitions.forEach( definition => {
					list += `${i}) - ${definition}${i === customDefs ? '' : ', '}`;
					i++;
				});
				return list;
			}
			//console.log(dictionary.data);
			let numdefs = 0;
			let len = dictionary.data.length;
			let definitions = [];
			let related = "";
			let seenext = "";
			let rx = new RegExp(`^${word}` + "\\:*\\d*$", 'gi');
			for(i = 0;i < len; i++) {
				let definition = dictionary.data[i];
				//console.log(definition);
				//let defid = dictionary[i].meta.id;
				if ( definition.meta.id.match(rx) && definition.fl !== "abbreviation" ) {
					numdefs++;
					definitions.push(definition);
				}
			}
			let relatedrx = new RegExp(dictionary.data[0].meta.id, 'gi');
			if ( definitions.length === 0 ) {
				let definition = dictionary.data[0];
				definitions.push(definition);
				numdefs++;
				word = definition.meta.id;
				related = "(may be related to) ";
			}
			defs = definitions;
			if (idx !== -1) {
				customdefinitions[idx].Definitions.forEach(definition => {
					numdefs++;
					defs.unshift(definition);
				});
			};
			if ( numdefs > 1 ) {
				seenext = `There are ${numdefs - 1} other definitions. To see the next, use command !nextdef`;
			};
			let firstdef = defs.shift();
			//console.log(firstdef);
			if (!firstdef.hasOwnProperty('shortdef')) {
				return `${lastword} [Custom] - ${firstdef}. ${seenext}`;
			}
			let partofspeech = firstdef.fl;
			//console.log(partofspeech);
			let similardefs = firstdef.shortdef;
			let deftext = similardefs.join(' | ');
			//console.log(deftext);
			return `${related}${word} [${partofspeech}] - ${deftext}. ${seenext}`;
		})
		.catch(function (error) {
			console.log(error);
			return `An error occurred while looking up definition data for ${word}.`;
		});
	return out;	
}

function nextDefinition() {
		let numdefs = defs.length;
		if (numdefs === 0) return "There are no remaining definitions.";
		let seenext = "";
		if ( numdefs > 1 ) {
			seenext = `${numdefs === 2 ? 'There is 1 more definition' : 'There are ' + (numdefs - 1).toString() + ' other definitions'}. To see the next, use command !nextdef`;
		};
		let nextdef = defs.shift();
		if (!nextdef.hasOwnProperty('shortdef')) {
			return `${lastword} [Custom] - ${nextdef}. ${seenext}`;
		}
		let partofspeech = nextdef.fl;
		let deftext = nextdef.shortdef.join(' | ');
		return `${lastword} [${partofspeech}] - ${deftext}. ${seenext}`;	
}

module.exports = {
	addSuggestion,
	resolveSuggestion,
	removeDefinition,
	listPendingDefinitions,
	getDefinitions,
	nextDefinition
};