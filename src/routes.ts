const router = require("express").Router();
import { main } from "./index";
import { generateRandomString } from "./Helpers/generic";
import * as qs from "qs";
import { env } from "process";

const spotifyClientId = env.SPOTIFY_CLIENT_ID;
const redirect_uri = env.SPOTIFY_REDIRECT_URL;

router.get("/", function (_, res) {
	var state = generateRandomString(16);
	var scope = "user-read-private user-read-email";

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
		res.redirect(
			"/#" +
				qs.stringify({
					error: "state_mismatch",
					message: "state or code mismatch",
				})
		);
	}

	main(code);

	res.status(200).json("Auth successful, playlist manager is running");
});

module.exports = router;
