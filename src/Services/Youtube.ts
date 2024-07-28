import { google } from "googleapis";
import { env } from "process";
import {
	backupPlaylistToJson,
	saveTokenToEnv,
	timer,
} from "../Helpers/generic";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { Track } from "../Models/Track";
const youtube = google.youtube("v3");
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = [
	"https://www.googleapis.com/auth/youtube",
	"https://www.googleapis.com/auth/youtube.force-ssl",
	"https://www.googleapis.com/auth/youtubepartner",
];

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
	oauth2Client.apiKey = env.YT_API_KEY;

	if (!oauth2Client.apiKey) throw new Error("YT_API_KEY is required");
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

interface PlaylistItem {
	auth: OAuth2Client;
	title: string;
	description: string;
}

export const ytCreatePlaylist = async (playlistItem: PlaylistItem) => {
	const { auth, title, description } = playlistItem;

	const response = await youtube.playlists.insert({
		part: ["snippet", "status"],
		auth,
		requestBody: {
			snippet: {
				title,
				description,
				tags: ["PlaylistManager", "API call"],
				defaultLanguage: "en",
			},
			status: {
				privacyStatus: "private",
			},
		},
	});
	console.log("Playlist created successfully");
	return response.data;
};

export const ytSearchVideo = async (
	auth: OAuth2Client,
	searchPhrase: string
): Promise<string | undefined> => {
	const response = await axios.get(
		"https://youtube.googleapis.com/youtube/v3/search",
		{
			params: {
				part: "snippet",
				maxResults: 1,
				q: searchPhrase,
				type: "video",
				key: auth.apiKey,
			},
		}
	);
	if (!response.data || !response.data.items || response.data.items.length <= 0)
		return undefined;

	return response.data.items[0].id.videoId;
};

export const addToPlaylist = async (
	auth: OAuth2Client,
	playlistId: string,
	videoId: string
): Promise<boolean> => {
	const data = {
		snippet: {
			playlistId,
			position: 0,
			resourceId: {
				kind: "youtube#video",
				videoId,
			},
		},
	};
	const url = "https://youtube.googleapis.com/youtube/v3/playlistItems";
	const config = {
		params: {
			part: "snippet",
			key: auth.apiKey,
		},
		headers: {
			"Authorization": `Bearer ${auth.credentials.access_token}`,
			"Accept": "application/json",
			"Content-Type": "application/json",
		},
	};
	try {
		await axios.post(url, data, config);
		return true;
	} catch (error) {
		console.log("ERROR ADDING title to playlist:", error);
		return false;
	}
};

//todo: refactor error handling
export const migratePlaylist = async (
	ytClient: OAuth2Client,
	playlistId: string,
	playlist: Track[]
) => {
	console.log("Transfer to playlist with Id: ", playlistId);
	let counter = 0;
	while (playlist.length > 0) {
		const song = playlist.pop();
		const title = `${song.artist} ${song.name}`;
		console.log(`adding song ${counter}:`, title);
		try {
			const ytSearchResultId = await ytSearchVideo(ytClient, title);
			if (ytSearchResultId) {
				const isAdded = await addToPlaylist(
					ytClient,
					playlistId,
					ytSearchResultId
				);
				if (!isAdded) {
					throw new Error("Failed to add to playlist");
				}
				counter += 1;
			}
			await timer(1501);
		} catch (error) {
			playlist.push(song);
			backupPlaylistToJson(playlist, playlistId);
			console.error("An error occurred:", error);
			break;
		}
	}
	console.log(`${counter} of ${playlist.length + counter} transferred`);
};
