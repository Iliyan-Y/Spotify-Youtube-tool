import { env } from "process";
import axios from "axios";
import * as qs from "qs";
import * as moment from "moment";
import { isTokenExpired, saveTokenToEnv } from "../Helpers/generic";
import { SpotifyUser } from "../Models/SpotifyUser";
import {
	SpotifyPlaylist,
	SpotifyPlaylistShort,
} from "../Models/SpotifyPlaylist";
import { Track } from "../Models/Track";
import { SpotifyTrack } from "../Models/SpotifyTrack";

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = env.SPOTIFY_REDIRECT_URL;
const spotifyAccessToken = env.SPOTIFY_ACCESS_TOKEN;
const spotifyRefreshToken = env.SPOTIFY_REFRESH_TOKEN;
const spotifyExpiresIn = env.SPOTIFY_EXPIRES_IN;

export const getSpotifyAccessToken = async (code: string): Promise<string> => {
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

	const tokens = [
		`SPOTIFY_ACCESS_TOKEN=${data.data.access_token}`,
		`SPOTIFY_EXPIRES_IN=${moment().add(data.data.expires_in, "s").format()}`,
	];

	if (data.data.refresh_token) {
		tokens.push(`SPOTIFY_REFRESH_TOKEN=${data.data.refresh_token}`);
	}

	saveTokenToEnv(tokens);

	return data.data.access_token;
};

export const getSpotifyUser = async (
	accessToken: string
): Promise<SpotifyUser> => {
	if (!accessToken) throw new Error("accessToken is required");
	const spotifyUser = await axios.get("https://api.spotify.com/v1/me", {
		headers: {
			"Authorization": `Bearer ${accessToken}`,
		},
	});
	return spotifyUser.data as SpotifyUser;
};

export const getSpotifyPlaylists = async (
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

export const getSpotifyFavoritesTracks = async (
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
