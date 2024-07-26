import "dotenv/config";
import { env } from "process";
import axios from "axios";
import * as express from "express";
import { backupPlaylistToJson } from "./Helpers/generic";
import {
	getSpotifyAccessToken,
	getSpotifyFavoritesTracks,
} from "./Services/Spotify";

const app = express();

export const main = async (code: string): Promise<void> => {
	try {
		const spotifyUserAccessToken = await getSpotifyAccessToken(code);
		const spotifyFavorites = await getSpotifyFavoritesTracks(
			spotifyUserAccessToken
		);
		console.log(spotifyFavorites.length, "tracks fetched");
		backupPlaylistToJson(spotifyFavorites);
		//todo auth in youtube
		// create playlist
		// add the tracks to the playlist
	} catch (error) {
		console.error(error);
	}
};

const routes = require("./routes");
app.use("/", routes);

app.listen(3000);
