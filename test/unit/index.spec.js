'use strict';

var expect = require( 'chai' ).expect;
var require_helper = require( '../require_helper' );
var index = require_helper( 'index' );

describe( 'openapi version check', function() {
    before( function() {
        this.plugin = index({});
    });
    it( 'throws an error if there is no openapi', function() {
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                }
            }) ).to.throw( "OpenAPI definition is missing 'openapi' field" );
    });
    it( 'throws an error if openapi is too low', function() {
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '2.0.0'
                }
            }) ).to.throw( 'OpenAPI version 2.0.0 not supported' );
    });
    it( 'throws an error if openapi is too high', function() {
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '4.0.0'
                }
            }) ).to.throw( 'OpenAPI version 4.0.0 not supported' );
    });
});

describe( 'Google client id + secret from environment', function() {
    before( function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        this.plugin = index({});
    });
    after( function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
    });
    it( 'throws an error if no variables are set', function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '3.0.0'
                }
            }) ).to.throw( 'options requires clientId and clientSecret for Google API access' );
    });
    it( 'throws an error if only GOOGLE_CLIENT_ID is set', function() {
        process.env.GOOGLE_CLIENT_ID='test1';
        delete process.env.GOOGLE_CLIENT_SECRET;
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '3.0.0'
                }
            }) ).to.throw( 'options requires clientId and clientSecret for Google API access' );
    });
    it( 'throws an error if only GOOGLE_CLIENT_SECRET is set', function() {
        delete process.env.GOOGLE_CLIENT_ID;
        process.env.GOOGLE_CLIENT_SECRET='secret1';
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '3.0.0'
                }
            }) ).to.throw( 'options requires clientId and clientSecret for Google API access' );
    });
    it( 'succeeds if both are set', function() {
        process.env.GOOGLE_CLIENT_ID='test1';
        process.env.GOOGLE_CLIENT_SECRET='secret1';
        let instance = this.plugin.makeExegesisPlugin({
            apiDoc: {
                openapi: '3.0.0'
            }
        });
        expect( instance ).to.be.ok;
        expect( instance._options.clientId ).to.equal( 'test1' );
        expect( instance._options.clientSecret ).to.equal( 'secret1' );
    });
});

describe( 'Google client id + secret from options', function() {
    before( function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        this.plugin = index({
            clientId: 'test2',
            clientSecret: 'secret2'
        });
    });
    after( function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
    });
    it( 'succeeds without environment variables', function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        let instance = this.plugin.makeExegesisPlugin({
            apiDoc: {
                openapi: '3.0.0'
            }
        });
        expect( instance ).to.be.ok;
        expect( instance._options.clientId ).to.equal( 'test2' );
        expect( instance._options.clientSecret ).to.equal( 'secret2' );
    });
    it( 'does not override with environment variables', function() {
        process.env.GOOGLE_CLIENT_ID='test1';
        process.env.GOOGLE_CLIENT_SECRET='secret1';
        let instance = this.plugin.makeExegesisPlugin({
            apiDoc: {
                openapi: '3.0.0'
            }
        });
        expect( instance ).to.be.ok;
        expect( instance._options.clientId ).to.equal( 'test2' );
        expect( instance._options.clientSecret ).to.equal( 'secret2' );
    });
});

describe( 'No path in options', function() {
    before( function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        this.plugin = index({
            clientId: 'test2',
            clientSecret: 'secret2'
        });
        this.apiDoc = {
            openapi: '3.0.0'
        };
        this.controllers = {};
        this.instance = this.plugin.makeExegesisPlugin({ apiDoc: this.apiDoc });
        this.instance.preCompile({ apiDoc: this.apiDoc, options: {
            controllers: this.controllers
        } });
    });
    it( 'uses /auth/google as default path', function() {
        expect( this.apiDoc.paths ).to.be.ok;
        expect( this.apiDoc.paths['/auth/google'] ).to.be.ok;
        expect( this.apiDoc.paths['/auth/google'].get ).to.be.ok;
    });
    it( 'creates controller function', function() {
        expect( this.controllers[this.apiDoc.paths['/auth/google'].get['x-exegesis-controller']] ).to.be.ok;
        expect( this.controllers[this.apiDoc.paths['/auth/google'].get['x-exegesis-controller']][
        this.apiDoc.paths['/auth/google'].get.operationId] ).to.be.a( 'function' );
    });
    it( 'sends a redirect to the correct path', async function() {
        var context = {
            req: {
                url: '/auth/google',
                protocol: 'proto',
                get: function( field ) {
                    if( field === 'host' ) {
                        return( 'myhost1' );
                    }
                }
            },
            res: {
                setStatus: function( status ) {
                    this.status = status;
                    return this;
                },
                set: function( header, value ) {
                    if( header === 'location' ) {
                        this.location = value;
                    }
                }
            },
            params: {
            }
        };
        await this.controllers[this.apiDoc.paths['/auth/google'].get['x-exegesis-controller']][
        this.apiDoc.paths['/auth/google'].get.operationId]( context );
        expect( context.res.status ).to.equal( 303 );
        expect( context.res.location ).to.contain(
            'redirect_uri=' + encodeURIComponent( 'proto://myhost1/auth/google' ) );
    });
});

describe( 'custom path in options', function() {
    before( function() {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        this.plugin = index({
            clientId: 'test2',
            clientSecret: 'secret2',
            path: '/my/path/to/auth'
        });
        this.apiDoc = {
            openapi: '3.0.0'
        };
        this.controllers = {};
        this.instance = this.plugin.makeExegesisPlugin({ apiDoc: this.apiDoc });
        this.instance.preCompile({ apiDoc: this.apiDoc, options: {
            controllers: this.controllers
        } });
    });
    it( 'uses specified path', function() {
        expect( this.apiDoc.paths ).to.be.ok;
        expect( this.apiDoc.paths['/my/path/to/auth'] ).to.be.ok;
        expect( this.apiDoc.paths['/my/path/to/auth'].get ).to.be.ok;
    });
    it( 'creates controller function', function() {
        expect( this.controllers[this.apiDoc.paths['/my/path/to/auth'].get['x-exegesis-controller']] )
        .to.be.ok;
        expect( this.controllers[this.apiDoc.paths['/my/path/to/auth'].get['x-exegesis-controller']][
        this.apiDoc.paths['/my/path/to/auth'].get.operationId] ).to.be.a( 'function' );
    });
});
