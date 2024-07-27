const fs = require("fs");
const readline = require("readline");
import { google } from "googleapis";
import { env } from "process";
import { saveTokenToEnv } from "../Helpers/generic";
import { OAuth2Client } from "google-auth-library";
import { String } from "lodash";
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ["https://www.googleapis.com/auth/youtube"];

export const getYoutubeClient = (): OAuth2Client => {
	const clientSecret = env.YT_CLIENT_SECRET;
	const clientId = env.YT_CLIENT_ID;
	const redirectUrl = env.YT_REDIRECT_URL;
	const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
	const credentials = {
		access_token: env.YT_ACCESS_TOKEN,
		refresh_token: env.YT_REFRESH_TOKEN,
	};

	oauth2Client.credentials = credentials;
	return oauth2Client;
};

export function getYtAuthorizeLink(oauth2Client: OAuth2Client): string {
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	console.log("Authorize this app by visiting this url: ", authUrl);
	return authUrl;
}

export async function updateYtClient(
	code: string,
	oauth2Client: OAuth2Client
): Promise<OAuth2Client> {
	const { tokens } = await oauth2Client.getToken(code);

	oauth2Client.credentials = tokens;
	saveTokenToEnv([
		`YT_ACCESS_TOKEN=${tokens.access_token}`,
		`YT_REFRESH_TOKEN=${tokens.refresh_token}`,
	]);

	return oauth2Client;
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
