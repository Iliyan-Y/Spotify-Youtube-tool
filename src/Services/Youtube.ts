const fs = require("fs");
const readline = require("readline");
import { google } from "googleapis";
import { env } from "process";
import { saveTokenToEnv } from "../Helpers/generic";
import { OAuth2Client } from "google-auth-library";
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ["https://www.googleapis.com/auth/youtube"];

export async function YoutubeAuthorize(): Promise<OAuth2Client> {
	const clientSecret = env.YT_CLIENT_SECRET;
	const clientId = env.YT_CLIENT_ID;
	const redirectUrl = env.YT_REDIRECT_URL;
	const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
	const credentials = {
		access_token: env.YT_ACCESS_TOKEN,
		refresh_token: env.YT_REFRESH_TOKEN,
	};

	oauth2Client.credentials = credentials;

	if (credentials.access_token) {
		console.log("SUCCESSFUL call other yt logic");
	} else {
		return getNewToken(oauth2Client);
	}
	return oauth2Client;
}

function getNewToken(oauth2Client: OAuth2Client): OAuth2Client {
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	console.log("Authorize this app by visiting this url: ", authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	let response: OAuth2Client;
	rl.question("Enter the code from that page here: ", function (code) {
		rl.close();
		oauth2Client.getToken(code, function (err, token) {
			if (err) {
				console.log("Error while trying to retrieve access token", err);
				throw err;
			}
			oauth2Client.credentials = token;
			saveTokenToEnv([
				`YT_ACCESS_TOKEN=${token.access_token}`,
				`YT_REFRESH_TOKEN=${token.refresh_token}`,
			]);
			console.log(token);
			console.log("YT AUTH SUCCESS");
			response = oauth2Client;
			//	getChannel(oauth2Client);
		});
	});
	return response;
}

// /**
//  * Lists the names and IDs of up to 10 files.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function getChannel(auth) {
// 	const service = google.youtube("v3");
// 	service.channels.list(
// 		{
// 			auth: auth,
// 			part: "snippet,contentDetails,statistics",
// 			forUsername: "GoogleDevelopers",
// 		},
// 		function (err, response) {
// 			if (err) {
// 				console.log("The API returned an error: " + err);
// 				return;
// 			}
// 			const channels = response.data.items;
// 			if (channels.length == 0) {
// 				console.log("No channel found.");
// 			} else {
// 				console.log(
// 					"This channel's ID is %s. Its title is '%s', and " +
// 						"it has %s views.",
// 					channels[0].id,
// 					channels[0].snippet.title,
// 					channels[0].statistics.viewCount
// 				);
// 			}
// 		}
// 	);
// }
