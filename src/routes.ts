const router = require("express").Router();
import { generateRandomString } from "./Helpers/generic";
import * as qs from "qs";
import { env } from "process";
import { getSpotifyAccessToken } from "./Services/Spotify";
import {
	addToPlaylist,
	getYoutubeClient,
	getYtAuthorizeLink,
	updateYtClient,
	ytCreatePlaylist,
	ytSearchVideo,
} from "./Services/Youtube";
import * as playlistJson from "../backupPlaylist.json";

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const redirect_uri = env.SPOTIFY_REDIRECT_URL;
const spotifyAccessToken = env.SPOTIFY_ACCESS_TOKEN;

const spotifyUserMiddleware = (req, res, next) => {
	if (spotifyAccessToken) {
		res.status(200).json("Spotify user authenticated");
		next();
	} else {
		// todo refactor for spotify
		res.status(500).json("Spotify auth error - implement middleware - todo");
	}
};

router.get("/", spotifyUserMiddleware, function (_, res) {
	var state = generateRandomString(16);
	var scope = "user-read-private user-read-email user-library-read";

	const params = {
		response_type: "code",
		client_id: spotifyClientId,
		scope: scope,
		redirect_uri: redirect_uri,
		state: state,
	};

	res.redirect(
		"https://accounts.spotify.com/authorize?" + qs.stringify(params)
	);
});

router.get("/callback", async function (req, res) {
	var code = req.query.code || null;
	var state = req.query.state || null;

	if (!state || !code) {
		res.status(500).json("state or code mismatch");
	}

	try {
		await getSpotifyAccessToken(code);
		res
			.status(200)
			.json("Spotify Auth successful, playlist manager is running");
	} catch (error) {
		console.error(error);
		res.status(500).json(error);
	}
});

//todo: create spotify endpoints for the getSpotifyFavoritesTracks
let ytClient = getYoutubeClient();
const youtubeUserMiddleware = (req, res, next) => {
	if (ytClient.credentials.access_token) {
		next();
	} else {
		const authUrl = getYtAuthorizeLink(ytClient);
		res.redirect(authUrl);
	}
};

router.get("/ytcallback", async function (req, res) {
	var code = req.query.code || null;

	if (!code) {
		res.status(500).json("no code provided");
	}

	try {
		ytClient = await updateYtClient(code, ytClient);
		res.status(200).json("Yt Auth successful, ready to roll");
	} catch (error) {
		console.error(error);
		res.status(500).json(error);
	}
});

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
const loopPlaylist = async (playlistId: string) => {
	let counter = 0;
	for (const song of playlistJson) {
		const title = `${playlistId}: ${song.artist} - ${song.name}`;

		console.log("adding song:", title);
		const ytSearchResultId = await ytSearchVideo(ytClient, title);
		if (ytSearchResultId) {
			await addToPlaylist(ytClient, playlistId, ytSearchResultId);
			counter += 1;
		}

		await timer(1501);
	}
	console.log("total songs added:", counter);
};

// this will handle the migration of the playlists from file
router.get("/yt/playlist", youtubeUserMiddleware, async (_, res) => {
	try {
		const playlistItem = {
			auth: ytClient,
			title: "Liked Songs",
			description: "Playlist migrated from Spotify Liked Songs",
		};
		const { id } = await ytCreatePlaylist(playlistItem);

		loopPlaylist(id);

		res.status(200).json("Rolling");
	} catch (error) {
		console.error(error);
		res.status(500).json(error);
	}
});

module.exports = router;
