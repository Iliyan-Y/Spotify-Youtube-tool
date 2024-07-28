# playlist-manager

Project created with npx create-typescript-application

# Setup

Note the redirect urls below, express is configured for those paths. If you want to change them please also update the `./routes.ts` file

## Spotify

Follow the instructions on [spotify](https://developer.spotify.com/documentation/web-api) to obtain client id and secret, add it to the .env file in the root dir

```
npm i
touch .env

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URL=http://localhost:3000/callback
```

## Youtube

- Create project and enable the youtube api - [Documentation](https://developers.google.com/youtube/v3/docs) [more documentation nodejs](https://developers.google.com/youtube/v3/quickstart/nodejs)

- When creating the project it will ask you to create credentials - we are going to need user data access. Follow the steps on the google cloud console to create the application. Add scopes `youtube youtube.force-ssl youtubepartner` (be careful with this it will grant full scope to the account).
- Download the client_secret provided from google and add the values to the .env file
- Create also a test user (in the oAuth consent tab) and provide the email address to the youtube account you want to access
- Create API key as well

```
YT_CLIENT_SECRET=
YT_CLIENT_ID=
YT_REDIRECT_URL=http://localhost:3000/ytcallback
YT_API_KEY=
```

once done run the server `npm run start:dev` and navigate to `http:localhost:3000` in your browser
