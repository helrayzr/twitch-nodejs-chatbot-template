
# NodeJS Twitch Chatbot Template

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

Are you a Twitch streamer? Getting into JS dev and looking for a fun project? Or are you just looking for some fun features to add to your stream? Whatever your reason, this template is a good place to start.

My motivation for this template was to provide a simple means of getting started with a cross-platform, self-hosted chatbot (and if you're getting started in JS dev, also provide some good starting examples of API integrations and OAuth authentication). A few software installations here, some app registrations there, and you're all set!
## Special Thanks

 - [CasualElephant](https://twitch.tv/casualelephant) - A good friend IRL and streamer, whose coding streams are what got me started experimenting with streaming and JS Dev in the first place.
 - [Instafluff](https://twitch.tv/instafluff) - Streamer and developer of the [ComfyJS](https://github.com/instafluff/ComfyJS) Twitch Chat Module, which I forked for the chatbot's Twitch integration.

## Prerequisites

Before getting started, you will need to install the following on your computer:
 - [Git](https://git-scm.com/downloads)
 - [Node.js](https://nodejs.org/en/download/)
 - Setup of your main Twitch account ([Creating a Twitch Account](https://help.twitch.tv/s/article/creating-an-account-with-twitch?language=en_US)) and secondary bot account ([Creating Additional Accounts](https://help.twitch.tv/s/article/creating-an-account-with-twitch?language=en_US#AdditionalAccounts))
 - Enabling 2FA on your primary Twitch account ([Setting up Two-Factor Authentication (2FA)](https://help.twitch.tv/s/article/two-factor-authentication?language=en_US))

## Installation

For now, I am only posting Windows instructions. I hope to get to Mac / Linux instructions and screenshots in at a later date, but they should be fairly similar to the Windows instructions (and if you're on Linux, odds are you can figure it out without a step-by-step anyway).

### Windows

#### Download Method 1: ZIP Extraction

After installing prerequisites, scroll to the top of this Github page and click the green Code button > Download ZIP. Extract the ZIP folder to the desired hard disk location.

#### Download Method 2: git clone

After Installing prerequisites, open Git Bash and navigate via Command Line to the directory you wish to put the chatbot files. Then, run the command:

```bash
git clone https://github.com/helrayzr/twitch-nodejs-chatbot-template.git
```

#### Install Dependencies
Open a Command Prompt or PowerShell window in the directory containing the downloaded files.

![screenshot](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-PSAsAdmin.jpg)

From this PS/CMD window, run the following:

```bash
  npm install
```
    
This will automatically download and install the necessary packages the chatbot needs to function.

## Setup and Configuration

### The data.json, tokens.json and .env files

Before we begin setup, let's briefly discuss 3 of the files we will be using for storing our configurations. Each file is located at the root folder of the chatbot and serves a separate function in the setup.

#### .env

The .env file is used to store sensitive information. For the chatbot, this would be any API Authentication-related information (IDs, Secrets, Refresh Tokens, etc.) and needs to be filled in before the bot is started.

#### data.json

In this file is where we configure your channel name and the port for the local server to listen on. By default, this port is **8080** but can be changed if you so choose. However, this number is important for future configuration steps, so this number will be bolded throughout the document to indicate everywhere this needs to be changed when not using the default port.

#### tokens.json

This file will be used as storage of your current access tokens and act as temporary storage of refresh tokens. During setup, we cannot write new information to the .env file, so when the refresh token is generated it is stored here. Later instructions will remind you to transfer this token to the .env file and remove the code and refresh token from the tokens.json after it is generated. At the end of your configuration, tokens.json should only have the access token, URI, expiration, and timestamp filled.

### [Required] Twitch App Setup

#### Creating a Twitch App

- Go to [dev.twitch.tv](https://dev.twitch.tv) and login with your primary Twitch account.
- From the [Console](https://dev.twitch.tv/console) page, click "[Register Your Application](https://dev.twitch.tv/console/apps/create)", located in the top-right of the Applications widget.
- On this page, add the following information and click Create:
   - Name: Whatever you want to name the application, this doesn't matter beyond giving it a name.
   - OAuth Redirect URLs:
     - [http://localhost:**8080**/oauth/auth/streamer](#)
     - [http://localhost:**8080**/oauth/auth/bot](#)
   - Category: Chat Bot

![App Registration](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-AppRegistration.png)

- After the app is registered, open the [Applications](https://dev.twitch.tv/console/apps) tab and click the Manage button next to your newly created app.
- Click the New Secret button at the bottom, then copy the Client ID and Client Secret and paste them to the end of the .env file's TWITCHCLIENTID and TWITCHCLIENTSECRET fields, respectively.

![Application Keys](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-ApplicationKeys.png)

#### Acquiring OAuth Tokens to Twitch App

- From your chosen terminal, navigate to the directory of the root directory of the chatbot and run
```bash
node ./server.js
```
Upon completing this step, the bot will start up the local web server for generating OAuth tokens and check every minute to see if the tokens have been generated.

![Bot Requesting Tokens](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-BotRequestingTokens.png) 

- Open a web browser and go to [http://localhost:**8080**/oauth/setup](), where you will have 2 links for streamer token and bot token. Both are needed, so start with whichever token you want (I recommend starting with the bot token as you will receive the option to log out of the bot account before getting the streamer token to your primary account, should you forget to log out of your account before trying to make the next token.)

![Token Links](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-OAuthSetupPage.png)

- You will be prompted to allow the application to login to Twitch (if you haven't already done so) and allow your app access to your account. Once confirmed, the tokens will be in the tokens.json file.

![Prompt for allowing access](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-AccessPrompt.png)

![tokens.json](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-TokensJSON.png)

- Transfer the refresh token to BOTREFRESH (for the bot account) or REFRESH (for your main account) in the .env file.
- Repeat the above steps for your other account's token.
  - **Before moving on to the next token, log out of Twitch and login to your other account.**

Congratulations! your chatbot is now connected to your app and will remain so until you change your account password. If you change your password, simply follow these steps again starting from the generation of a new secret.

### [Optional] API Keys for pre-built chatbot features

While you are connected, in its bare form it only has a few commands:
- !addmod and !removemod, which give mod permissions to your viewers for the mod commands configured in the bot.
- !listmods, which gives you a list of said mods.
- !brb, which sends a "be right back" message on behalf of the command's user.
- !translate, which leverages Google Translate's API to translate a message into any language (See Usage section for details, or run !translate -help in chat for instructions.)

The rest is up to you to play with and add to. However, if you gather some additional API keys and add them to your .env file, there are additional pre-built features available in this template.

#### Weather Lookup [OpenWeatherMap API] 

- [Sign Up Here](https://home.openweathermap.org/users/sign_up) for an OpenWeatherMap Account
- After signup and logging in, go to the [API Keys](https://home.openweathermap.org/api_keys) page, enter a name for your new key in the "Create Key" section, and click Generate.

- Copy the new key to the WEATHER field in the .env file (note: the OpenWeatherMap key does not immediately give access to the API, it takes a while for it to fully propagate and allow the bot to run queries.)

After adding this key, on the next launch of the chatbot you will have access to the following commands:
- !weather - Gets the weather for the <City> / <City>,<Country> / <City>,<US State>,US specified after the command.
  - See Usage section of this document, or run "!weather -help" in your channel's chat for more details.

#### Dictionary Lookup / Custom Dictionary Words [Mirriam-Webster Dictionary API]

- [Register Here](https://dictionaryapi.com/register/index) for a Mirriam-Webster Developer Account.
  - Note that it will ask for an Application URL, which you can enter as http://\<your external IP address\> ([What is my IP?](https://www.google.com/search?q=what+is+my+ip))
- After Registration and signing in, navigate to the [Your Keys](https://dictionaryapi.com/account/my-keys) tab, copy the Dictionary key, and place it in the DICTIONARY field of the .env file.

After adding this key, on the next launch of the chatbot you will have access to the following commands:

- !definition - Looks up the definition to the word following the command.
- !nextdef - If there are multiple definitions to a word, this will provide the next definition.
- !suggestdef - Adds a word and definition to a list of suggested custom definitions for the dictionary.
- !approvedef - [Mod Only] Approves adding a word in the suggestions list to the custom dictionary.
- !rejectdef - [Mod Only] Rejects a word in the suggestions list.
- !removedef - [Mod Only] Removes a word and all of its custom definitions from the custom dictionary.
- !pendingdefs - Lists all words in the suggestions list pending approval.

#### Spotify Song Monitor [Spotify Web API]

Note: While all of the previous APIs have free tiers, The Spotify Web API requires a Spotify Premium subscription (though if you are using Spotify for your on-stream music, it is likely you have Premium anyway. Not choosing your tracks / playlist comes with the risk of playing DRM-protected songs that will get you banned.)

- Log into your Spotify account on the [Spotify Developer Login Page](https://developer.spotify.com/dashboard/login)
- Click the "Create an App" button, input a name and description for your app, agree to the terms of service, and then click "Create"

![App Registration Spotify](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-AppRegistrationSpotify.jpg)

- Click the "Edit Settings" button and add [https://localhost:**8080**/oauth/auth/spotify](#) to the Redirect URIs section, then save the changes.

![Spotify App Settings](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-SpotifyAppSettings.png)

- Copy the Client ID and Secret, then paste them into the SPOTIFYCLIENTID and SPOTIFYCLIENTSECRET fields (respectively) of the .env file.

![Spotify Client ID / Secret](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-SpotifyClientIDSecret.png)

- Start up your bot and go to [https://localhost:**8080**/setup](#). You will now notice a new link - Authorize Spotify. Click that link, authorize the app to connect via your account, and the results will be in your tokens.json file. Move the refresh token to SPOTIFYREFRESH in the .env file and remove the refresh token and code from the tokens.json (for security purposes). 

![Oauth Setup Spotify Link](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-OAuthSetupSpotify.png)

![Spotify Auth Page](https://helrayzr.github.io/twitch-nodejs-chatbot-template/assets/Screenshot-SpotifyAuthPage.png)

With this key in place, you can now use the following commands:
- !songmonitor - starts a monitor that will check Spotify at the end of each song for what you are currently listening to.
- !currentsong - displays in chat the name of the current song playing.
- !lastsong - displays in chate the name of the last song played.

The results are stored in 2 files: CurrentSongArtist.txt and tracks.json. In OBS, if you create a new Text on your chosen scene you can point it to the CurrentSongArtist.txt file and it will show the track on your overlay.
## Usage/Examples

### Base Commands
#### Add a moderator for the bot
```bash
!addmod Helrayzr
```
#### Remove a moderator from the bot
```bash
!removemod Helrayzr
```
#### List bot moderators
```bash
!listmods
```

#### Send a "Be Right Back" message to chat
```bash
!brb
!brb <# of minutes until you return>
```

### Google Translate
#### Notes
- Default language set to English
- Viewers in chat can see a description of how to use this command by typing
```
!translate -help
```

#### Syntax

```bash
!translate <Message>
!translate -language:<Language Name / Code> <Message>
```

#### Examples
```bash
!translate Quiero traducir este mensaje al inglés.
!translate -language:es I want to translate this message to Spanish.
!translate -language:Russian I want to translate this message to Russian.
```

### WeatherBot: 
#### Syntax
```bash
!weather <City Name>
!weather <City Name>,<Country Code / Name>
!weather <City Name>,<US State Code / Name>,US
```

#### Examples
```bash
!weather Liverpool
!weather Dublin,Ireland
!weather Liverpool,GB
!weather Portland,Maine,US
!weather San Antonio,TX,US
```

### Dictionary Lookup / Custom Dictionary
#### Syntax
```bash
!definition <Word> <Definition>
!suggestdef <Word> <Definition>
!approvedef <Word>
!rejectdef <Word>
!removedef <Word>
```

#### Examples
```bash
!definition Coffee
!suggestdef Helrayzr A Twitch streamer and coding enthusiast
!approvedef Helrayzr
!rejectdef Helrayzr
!removedef Helrayzr
```

### Spotify Song Monitor
#### Start monitoring songs being played
```bash
!songmonitor
```
Note: Song Monitoring stops when no song is detected, which will happen after pausing for a period of time.

#### Get the current song name and artist
```bash
!song
```
#### Get the last song name and artist
```bash
!lastsong
```

## API References

[Twitch API Reference](https://dev.twitch.tv/docs/api/reference/)

[Spotify Web API Reference](https://developer.spotify.com/documentation/web-api/reference/#/)

[OpenWeatherMap API Reference](https://openweathermap.org/current)

[Mirriam-Webster Dictionary API Reference](https://dictionaryapi.com/products/api-collegiate-dictionary)

