import fs = require("fs");
import path = require("path");
import * as moment from "moment";

export const generateRandomString = (length: number) => {
	var text = "";
	var possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

/** Updates a .env file with new tokens. It reads the existing .env file, compares the tokens with the ones provided, updates the matching tokens, adds new tokens, and then writes the updated content back to the .env file.
 */
export const saveTokenToEnv = (tokens: string[]): void => {
	const envFilePath = path.resolve(__dirname, "../../.env");
	let envFileContent = fs.readFileSync(envFilePath, "utf-8");
	const lines = envFileContent.split("\n");
	const updatedLines = lines.map((line) => {
		const [key, ...value] = line.split("=");
		const existingToken = tokens.find((token) => token.startsWith(`${key}=`));
		if (existingToken) {
			return existingToken;
		} else {
			return line;
		}
	});
	const newLines = [
		...updatedLines,
		...tokens.filter((token) => !updatedLines.includes(token)),
	];
	envFileContent = newLines.join("\n");
	fs.writeFileSync(envFilePath, envFileContent, "utf-8");
};

export const isTokenExpired = (timestamp: string) => {
	if (!timestamp) return true;

	const currentTimestamp = moment();

	if (currentTimestamp.isAfter(moment(timestamp))) {
		return true;
	}

	return false;
};
