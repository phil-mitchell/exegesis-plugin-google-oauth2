'use strict';

const express = require( 'express' );
const exegesisExpress = require( 'exegesis-express' );
const http = require( 'http' );
const path = require( 'path' );
const fs = require( 'fs-extra' );

const require_helper = require( './require_helper' );

var google = require( 'googleapis' ).google;
var GoogleOAuth2 = google.auth.OAuth2;
google.auth.OAuth2 = class MockOAuth2 extends GoogleOAuth2 {
    constructor() {
        super( ...arguments );
        this.getToken = async function( code ) {
            if( code === 'BadCode' ) {
                throw new Error( 'Bad code' );
            }
            return{
                tokens: {
                    access_token: code,
                    scope: 'https://www.googleapis.com/auth/userinfo.email',
                    token_type: 'Bearer',
                    id_token: 'idToken1',
                    expiry_date: new Date().getTime() + 50
                }
            };
        };
        this.setCredentials = function( tokens ) {
            this.tokens = tokens;
        };
        this.requestAsync = async function() {
            if( this.tokens.access_token === 'BadToken' ) {
                throw new Error( 'Bad token' );
            }
            return{
                status: this.tokens.access_token === 'FailedRequest' ? 400 : 200,
                data: {
                    id: 'testid1',
                    name: 'Test User',
                    emails: [ 'test@google.com' ],
                    image: 'http://localhost/image.png'
                }
            };
        };
    }
};

async function authCallback1( context, tokens, me ) {
    if( tokens.access_token === 'authcode1' ) {
        return{
            token: me.id + ':' + tokens.access_token
        };
    }

    throw context.makeError( 403, 'Not authorized for user ' + me.id );
}

async function createServer() {
    const app = express();

    const options = {
        controllers: {},
        allowMissingControllers: true,
        plugins: [
            require_helper( 'index.js' )({
                clientId: 'asdf',
                clientSecret: 'fdsa'
            }),
            require_helper( 'index.js' )({
                clientId: 'asdf',
                clientSecret: 'fdsa',
                path: '/myauthtest',
                callback: authCallback1
            })
        ]
    };

    const exegesisMiddleware = await exegesisExpress.middleware(
        path.resolve( __dirname, './petstore.yaml' ),
        options
    );

    app.use( exegesisMiddleware );
    // Return a 404
    app.use( ( req, res ) => {
        res.status( 404 ).json({ message: `Not found` });
    });

    // Handle any unexpected errors
    app.use( ( err, req, res, next ) => {
        res.status( 500 ).json({ message: `Internal error: ${err.message}` });
        next();
    });

    const server = http.createServer( app );

    return server;
}

if( process.env.REPORT_DIR_FOR_CODE_COVERAGE ) {
    const dumpCoverage = () => {
        console.warn( 'Outputting code coverage information to ' + process.env.REPORT_DIR_FOR_CODE_COVERAGE );
        fs.ensureDirSync( process.env.REPORT_DIR_FOR_CODE_COVERAGE );
        fs.writeFileSync(
            process.env.REPORT_DIR_FOR_CODE_COVERAGE + '/app.json',
            JSON.stringify( global['__coverage__'] ), 'utf8'
        );
    };
    process.on( 'exit', dumpCoverage );
    process.on( 'SIGINT', process.exit );
    process.on( 'SIGTERM', process.exit );
}

createServer()
.then( server => {
    server.listen( 3000 );
    console.log( 'Listening on port 3000' );
    console.log( 'Try visiting http://localhost:3000/api-docs' );
})
.catch( err => {
    console.error( err.stack );
    process.exit( 1 );
});
