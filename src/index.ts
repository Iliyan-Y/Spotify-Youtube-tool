import "dotenv/config";
import { env } from "process";
import axios from "axios";
import { SpotifyUser } from "./Models/SpotifyUser";
import * as qs from "qs";

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;
const spotifyUserCode = env.SPOTIFY_USER_CODE;

// Some url not very important atm.
const redirect_uri = "http://localhost:3000";

const getSpotifyAccessToken = async (): Promise<any> => {
	if (!spotifyClientId || !spotifyClientSecret)
		throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required");

	const formData = {
		code: spotifyUserCode,
		redirect_uri: redirect_uri,
		grant_type: "authorization_code",
	};
	const queryParams = qs.stringify(formData);

	const data = await axios.post(
		`https://accounts.spotify.com/api/token`,
		queryParams,
		{
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				"Authorization":
					"Basic " +
					Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString(
						"base64"
					),
			},
		}
	);
	return data.data;
};

const getSpotifyUser = async (accessToken: string): Promise<SpotifyUser> => {
	if (!accessToken) throw new Error("accessToken is required");
	const spotifyUser = await axios.get("https://api.spotify.com/v1/me", {
		headers: {
			"Authorization": `Bearer ${accessToken}`,
		},
	});
	return spotifyUser.data as SpotifyUser;
};

export const main = async (): Promise<void> => {
	try {
		const tokens = await getSpotifyAccessToken();
		const spotifyUser = await getSpotifyUser(tokens.access_token);
		console.log(spotifyUser);
		debugger;
	} catch (error) {
		console.error(error);
	}
};

main();
