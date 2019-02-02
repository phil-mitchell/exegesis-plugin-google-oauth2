'use strict';

var superagent = require( 'superagent' );
var expect = require( 'chai' ).expect;

describe( 'Default options', function() {
    it( 'redirects google oauth', function( done ) {
        superagent
        .get( 'http://localhost:3000/auth/google' )
        .redirects( 0 )
        .ok( res => res.status === 303 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.headers.location ).to.contain( 'https://accounts.google.com/o/oauth2/v2/auth?' );
            expect( res.headers.location ).to.contain(
                'redirect_uri=' + encodeURIComponent( 'http://localhost:3000/auth/google' ) );
            done();
        });
    });

    it( 'handles the code from google', function( done ) {
        superagent
        .get( 'http://localhost:3000/auth/google' )
        .query({ code: 'authcode1' })
        .ok( res => res.status === 200 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.id ).to.equal( 'testid1' );
            expect( res.body.emails ).to.contain( 'test@google.com' );
            expect( res.body.image ).to.equal( 'http://localhost/image.png' );
            done();
        });
    });

    it( 'handles bad code from Google', function( done ) {
        superagent
        .get( 'http://localhost:3000/auth/google' )
        .query({ code: 'BadCode' })
        .ok( res => res.status === 500 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.message ).to.equal( 'Bad code' );
            done();
        });
    });

    it( 'handles bad token from Google', function( done ) {
        superagent
        .get( 'http://localhost:3000/auth/google' )
        .query({ code: 'BadToken' })
        .ok( res => res.status === 500 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.message ).to.equal( 'Bad token' );
            done();
        });
    });

    it( 'handles failed request to Google', function( done ) {
        superagent
        .get( 'http://localhost:3000/auth/google' )
        .query({ code: 'FailedRequest' })
        .ok( res => res.status === 500 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.message ).to.equal( 'Failed to get user information from Google' );
            done();
        });
    });
});

describe( 'Custom path and callback', function() {
    it( 'handles the code from google', function( done ) {
        superagent
        .get( 'http://localhost:3000/myauthtest' )
        .query({ code: 'authcode1' })
        .ok( res => res.status === 200 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.token ).to.equal( 'testid1:authcode1' );
            done();
        });
    });

    it( 'handles bad code from Google', function( done ) {
        superagent
        .get( 'http://localhost:3000/myauthtest' )
        .query({ code: 'authcode2' })
        .ok( res => res.status === 403 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.message ).to.contain( 'Not authorized for user testid1' );
            done();
        });
    });
});

describe( 'Skip people API', function() {
    it( 'handles the code from google', function( done ) {
        superagent
        .get( 'http://localhost:3000/skippeople' )
        .query({ code: 'authcode1' })
        .ok( res => res.status === 200 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.access_token ).to.eql( 'authcode1' );
            done();
        });
    });
});

describe( 'Override personFields', function() {
    it( 'handles the code from google', function( done ) {
        superagent
        .get( 'http://localhost:3000/personfields' )
        .query({ code: 'authcode1' })
        .ok( res => res.status === 200 )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body.id ).to.equal( 'testid1' );
            expect( res.body.emails ).to.not.exist;
            expect( res.body.image ).to.not.exist;
            done();
        });
    });
});
