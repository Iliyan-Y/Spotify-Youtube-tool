import "dotenv/config";
import { env } from "process";
import axios from "axios";

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

export const main = async (): Promise<void> => {
	const token = await getSpotifyAccessToken();
};

main();
