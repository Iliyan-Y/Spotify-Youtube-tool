import "dotenv/config";
import { env } from "process";
import axios from "axios";
import { SpotifyUser } from "./Models/SpotifyUser";

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;

const getSpotifyAccessToken = async (): Promise<string> => {
	if (!spotifyClientId || !spotifyClientSecret)
		throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required");

	const url = "https://accounts.spotify.com/api/token";

	const data = await axios.post(
		url,
		{
			grant_type: "client_credentials",
			client_id: spotifyClientId,
			client_secret: spotifyClientSecret,
		},
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		}
	);

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

export const main = async (): Promise<void> => {
	try {
		debugger;
		const token = await getSpotifyAccessToken();
		const spotifyUser = await getSpotifyUser(token);
	} catch (error) {
		console.error(error);
	}
};

main();
