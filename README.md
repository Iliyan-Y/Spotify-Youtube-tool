# playlist-manager

Project created with npx create-typescript-application

# Setup

Follow the instructions on [spotify](https://developer.spotify.com/documentation/web-api) to obtain client id and secret, add it to the .env file in the root dir

```
touch .env

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

## Personal Account Authorization

- authorize the app to have access to the user profile - [documentation](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- replace YOUR_CLIENT_ID YOUR_REDIRECT and SOME_RANDOM_STRING_OF_16 with your values and paste the link below in the browser
- you will get prompt to spotify auth page

```
"https://accounts.spotify.com/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=user-read-private%20user-read-email&redirect_uri=YOUR_REDIRECT_URI&state=SOME_RANDOM_STRING_OF_16"
```

- if the authentication is successful you will get redirected. **N.B.** ! do **NOT** close the page, save the url somewhere and extract the CODE and STATE values
  Then save them in .env file as:

```
SPOTIFY_USER_CODE=
SPOTIFY_USER_STATE=
```
