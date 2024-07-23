import "dotenv/config";
import { env } from "process";
import axios from "axios";
import { SpotifyUser } from "./Models/SpotifyUser";
import * as qs from "qs";
import * as express from "express";
import { saveTokenToEnv } from "./Helpers/generic";
const app = express();

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = env.SPOTIFY_REDIRECT_URL;
const spotifyAccessToken = env.SPOTIFY_ACCESS_TOKEN;

const getSpotifyAccessToken = async (code: string): Promise<string> => {
	// todo validate token not expired
	if (spotifyAccessToken) return spotifyAccessToken;

	if (!spotifyClientId || !spotifyClientSecret)
		throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required");

	const formData = {
		code,
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

	saveTokenToEnv([
		`SPOTIFY_ACCESS_TOKEN=${data.data.access_token}`,
		`SPOTIFY_REFRESH_TOKEN=${data.data.refresh_token}`,
	]);

	return data.data.access_token;
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

export const main = async (code: string): Promise<void> => {
	try {
		const spotifyUserAccessToken = await getSpotifyAccessToken(code);
		const spotifyUser = await getSpotifyUser(spotifyUserAccessToken);
		console.log(spotifyUser.id);
	} catch (error) {
		console.error(error);
	}
};

const routes = require("./routes");
app.use("/", routes);

app.listen(3000);
