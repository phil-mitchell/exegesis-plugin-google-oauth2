'use strict';

const semver = require( 'semver' );
const google = require( 'googleapis' ).google;
const url = require( 'url' );

const controllerName = 'exegesis-plugin-google-oauth2';

class GoogleOAuth2Plugin {
    constructor( apiDoc, options ) {
        // Verify the apiDoc is an OpenAPI 3.x.x document, because this plugin
        // doesn't know how to handle anything else.
        if( !apiDoc.openapi ) {
            throw new Error( "OpenAPI definition is missing 'openapi' field" );
        }

        if( !semver.satisfies( apiDoc.openapi, '>=3.0.0 <4.0.0' ) ) {
            throw new Error( `OpenAPI version ${apiDoc.openapi} not supported` );
        }

        options = Object.assign({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }, options );

        if( !options.clientId || !options.clientSecret ) {
            throw new Error( 'options requires clientId and clientSecret for Google API access' );
        }

        options.authorization = Object.assign({
            access_type: 'online',
            prompt: 'consent',
            scope: [ 'email', 'profile' ]
        }, options.authorization );
        options.path = options.path || '/auth/google';

        this._options = options;

        apiDoc.paths = apiDoc.paths || {};
        apiDoc.paths[options.path] = {
            'get': {
                summary: 'Authenticate with Google OAuth2',
                'x-exegesis-controller': controllerName,
                operationId: 'authenticate ' + options.path,
                security: [],
                parameters: [ {
                    'in': 'query',
                    name: 'code',
                    description: 'The authentication code provided by Google',
                    schema: {
                        type: 'string'
                    }
                } ],
                responses: {
                    '200': {
                        description: 'Authentication was successful'
                    },
                    '303': {
                        description: 'Redirect to start OAuth handshake'
                    }
                }
            }
        };
    }

    preCompile({ options }) {
        var authOptions = this._options;

        options.controllers[controllerName] = options.controllers[controllerName] || {};
        options.controllers[controllerName]['authenticate ' + authOptions.path ] = async function( context ) {
            var parsedUrl = url.parse( context.req.url );
            var auth = new google.auth.OAuth2(
                authOptions.clientId,
                authOptions.clientSecret,
                context.req.protocol + '://' + context.req.get( 'host' ) + parsedUrl.pathname
            );

            var query = context.params.query;
            if( !query || !query.code ) {
                context.res.setStatus( 303 ).set( 'location', auth.generateAuthUrl( JSON.parse( JSON.stringify( authOptions.authorization ) ) ) );
            } else {
                let me = null;
                let tokens = null;
                try {
                    let data = await auth.getToken( query.code );
                    tokens = data.tokens;
                    if( !authOptions.people || !authOptions.people.skip ) {
                        auth.setCredentials( tokens );
                        let people = google.people({ version: 'v1', auth });
                        me = await people.people.get( Object.assign({
                            resourceName: 'people/me',
                            personFields: 'names,nicknames,coverPhotos,emailAddresses'
                        }, authOptions.people || {}) );
                        if( me.status !== 200 || !me.data ) {
                            throw new Error( 'Failed to get user information from Google' );
                        }
                        me = me.data;
                    }
                } catch( e ) {
                    return context.res.setStatus( 500 ).json({
                        message: e.message
                    });
                }
                if( typeof( authOptions.callback ) === 'function' ) {
                    return authOptions.callback( context, tokens, me );
                }
                if( me ) {
                    return context.res.json({
                        id: me.id,
                        name: me.displayName,
                        emails: me.emails,
                        image: me.image
                    });
                }
                return context.res.json( tokens );
            }
        };
    }
}

module.exports = function plugin( options ) {
    return{
        info: {
            name: 'exegesis-plugin-google-oauth2'
        },
        options: options,
        makeExegesisPlugin: function makeExegesisPlugin({ apiDoc }) {
            return new GoogleOAuth2Plugin( apiDoc, options );
        }
    };
};
