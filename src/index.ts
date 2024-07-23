import "dotenv/config";
import { env } from "process";
import axios from "axios";
import { SpotifyUser } from "./Models/SpotifyUser";
import * as qs from "qs";
import * as express from "express";
import { isTokenExpired, saveTokenToEnv } from "./Helpers/generic";
import * as moment from "moment";
import {
	SpotifyPlaylist,
	SpotifyPlaylistShort,
} from "./Models/SpotifyPlaylist";
import { Track } from "./Models/Track";
import { SpotifyTrack } from "./Models/SpotifyTrack";
import { debug } from "console";

const app = express();

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = env.SPOTIFY_REDIRECT_URL;
const spotifyAccessToken = env.SPOTIFY_ACCESS_TOKEN;
const spotifyRefreshToken = env.SPOTIFY_REFRESH_TOKEN;
const spotifyExpiresIn = env.SPOTIFY_EXPIRES_IN;

const getSpotifyAccessToken = async (code: string): Promise<string> => {
	if (!spotifyClientId || !spotifyClientSecret)
		throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required");

	const expiredToken = isTokenExpired(spotifyExpiresIn);

	if (spotifyAccessToken && !expiredToken) return spotifyAccessToken;

	let formData = {};
	if (!code || code === "") {
		formData = {
			grant_type: "refresh_token",
			refresh_token: spotifyRefreshToken,
		};
	} else {
		formData = {
			code,
			redirect_uri: redirect_uri,
			grant_type: "authorization_code",
		};
	}

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
		`SPOTIFY_EXPIRES_IN=${moment().add(data.data.expires_in, "s").format()}`,
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

const getSpotifyPlaylists = async (
	accessToken: string,
	userId: string
): Promise<SpotifyPlaylistShort[]> => {
	if (!accessToken) throw new Error("accessToken is required");
	const res = await axios.get(
		`https://api.spotify.com/v1/users/${userId}/playlists`,
		{
			headers: {
				"Authorization": `Bearer ${accessToken}`,
			},
		}
	);

	return res.data?.items?.map(({ id, name }: SpotifyPlaylist) => ({
		id,
		name,
	}));
};

const getSpotifyFavoritesTracks = async (
	accessToken: string
): Promise<Track[]> => {
	const tracks: Track[] = [];
	let nextUrl = "https://api.spotify.com/v1/me/tracks";

	while (nextUrl) {
		const fetchedTracks = await fetchSpotifyTrackBatch(accessToken, nextUrl);
		tracks.push(...fetchedTracks.tracks);
		nextUrl = fetchedTracks.next;
	}

	return tracks;
};

const fetchSpotifyTrackBatch = async (accessToken: string, url: string) => {
	const response = await axios.get(url, {
		headers: {
			"Authorization": `Bearer ${accessToken}`,
		},
		params: {
			limit: 50,
		},
	});

	const tracks: Track[] = response.data.items.map(
		(item: { track: SpotifyTrack }) => {
			const { name, artists } = item.track;
			return {
				name,
				artist: artists.map(({ name }) => name).join(" "),
			};
		}
	);

	return { tracks, next: response.data.next };
};

export const main = async (code: string): Promise<void> => {
	try {
		const spotifyUserAccessToken = await getSpotifyAccessToken(code);
		const spotifyFavorites = await getSpotifyFavoritesTracks(
			spotifyUserAccessToken
		);

		console.log(spotifyFavorites.length, "tracks fetched");
	} catch (error) {
		console.error(error);
	}
};

const routes = require("./routes");
app.use("/", routes);

app.listen(3000);
