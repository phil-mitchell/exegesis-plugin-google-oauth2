# exegesis-plugin-google-oauth2

[![Run Status](https://api.shippable.com/projects/5c32b19e302eb707003c01b6/badge?branch=master)]()
[![Coverage Badge](https://api.shippable.com/projects/5c32b19e302eb707003c01b6/coverageBadge?branch=master)]()
![](https://img.shields.io/github/issues/phil-mitchell/exegesis-plugin-google-oauth2.svg)
![](https://img.shields.io/github/license/phil-mitchell/exegesis-plugin-google-oauth2.svg)
![](https://img.shields.io/node/v/exegesis-plugin-google-oauth2.svg)
![](https://img.shields.io/npm/dependency-version/exegesis-plugin-google-oauth2/googleapis.svg)

## Description

Exegesis middleware to handle Google OAuth2 authentication

## Installation

```sh
npm install exegesis-plugin-google-oauth2
```

## Example

Add this to your Exegesis options:

```js
const exegesisGoogleOAuth2Plugin = require( 'exegesis-plugin-google-oauth2' );

options = {
    plugins: [
        exegesisGoogleOAuth2Plugin({
            // URL path to expose authentication endpoints (default /auth/google)
            path: '/auth/google',

            // Client ID and secret for Google API
            clientId: 'myGoogleClient',
            clientSecret: 'MyClientSecret',

            // Authorization parameters to be passed to Google API (defaults shown)
            authorization: {
                access_type: 'online',
                prompt: 'consent',
                scope: [ 'email', 'profile' ]
            },

            // Options to pass to people.get (see https://developers.google.com/people/api/rest/v1/people/get)
            people: {
                skip: false, // don't call the people API
                resourceName: 'people/me',
                personFields: 'names,nicknames,coverPhotos,emailAddresses'
            },

            // Callback function to handle successful authentication
            // parameters:
            // - context: exegesis context object
            // - tokens: tokens received from Google
            // - me: Google People user profile
            callback: async function( context, tokens, me ) {
                return{
                    id: me.id
                }
            }
        })
    ]
};
```

The environment variables `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` may also be used to provide the clientId and clientSecret.

If no callback function is provided, the response to successful authentication will be a JSON object:

```
{
    id: me.id,
    name: me.displayName,
    emails: me.emails,
    image: me.image
}
```
