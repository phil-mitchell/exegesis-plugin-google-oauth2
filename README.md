# exegesis-plugin-swagger-ui-express

[![Run Status](https://api.shippable.com/projects/5c3011d2302eb707003b9ffe/badge?branch=master)]()
[![Coverage Badge](https://api.shippable.com/projects/5c3011d2302eb707003b9ffe/coverageBadge?branch=master)]()
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
            path: '/auth/google'
        })
    ]
};
```
