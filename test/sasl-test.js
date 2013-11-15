var xmpp = require('../lib/node-xmpp');
var fs = require('fs');

var user = {
    jid: "me@localhost",
    password: "secret"
};

function startServer() {

    // Sets up the server.
    var c2s = new xmpp.C2SServer({
        port: 5222,
        domain: 'localhost'
    });

    // On Connect event. When a client connects.
    c2s.on("connect", function(client) {
        // That's the way you add mods to a given server.

        // Allows the developer to register the jid against anything they want
        c2s.on("register", function(opts, cb) {
            console.log("REGISTER");
            cb(true);
        });

        // Allows the developer to authenticate users against anything they want.
        client.on("authenticate", function(opts, cb) {
            //console.log("AUTH");
            //console.log(opts.jid + " -> " + opts.password);
            //console.log(user.jid + " -> " + user.password);
            if (opts.jid == user.jid && opts.password == user.password) {
                console.log("success");
                cb(false);
            } else {
                console.log("error");
                cb(new Error("Authentication failure"));
            }
        });

        client.on("online", function() {
            console.log("ONLINE");
            client.send(new xmpp.Message({
                type: 'chat'
            }).c('body').t("Hello there, little client."));
        });

        // Stanza handling
        client.on("stanza", function(stanza) {
            console.log("STANZA" + stanza);
        });

        // On Disconnect event. When a client disconnects
        client.on("disconnect", function(client) {
            console.log("DISCONNECT");
        });

    });

    return c2s;
}

function registerHandler(cl) {

    cl.on('stanza',
        function(stanza) {
            if (stanza.is('message') &&
                // Important: never reply to errors!
                stanza.attrs.type !== 'error') {

                // Swap addresses...
                stanza.attrs.to = stanza.attrs.from;
                delete stanza.attrs.from;
                // and send back.
                cl.send(stanza);
            }
        });
}

describe('JID', function() {

    before(function(done) {
        console.log("start server");
        startServer();
        done();
    });

    describe('server', function() {
        it('should accept plain authentication', function(done) {
            var cl = new xmpp.Client({
                jid: user.jid,
                password: user.password
            });

            registerHandler(cl);

            cl.on('online',
                function() {
                    console.log("online");
                    done();
                });
            cl.on('error',
                function(e) {
                    console.log(e);
                    done(e);
                });

        });

        it('should not accept plain authentication', function(done) {
            var cl = new xmpp.Client({
                jid: user.jid,
                password: "secretsecret"
            });

            registerHandler(cl);

            cl.on('online',
                function() {
                    console.log("online");
                    done("user is not valid");
                });
            cl.on('error',
                function(e) {
                    // this should happen
                    done();
                });

        });

        /* 
         * google talk is replaced by google hangout,
         * but we can support the protocol anyway
         */
        it('should accept google authentication', function(done) {

            var gtalk = new xmpp.Client({
                jid: 'me@gmail.com',
                oauth2_token: 'xxxx.xxxxxxxxxxx', // from OAuth2
                oauth2_auth: 'http://www.google.com/talk/protocol/auth',
                host: 'localhost'
            });

            registerHandler(gtalk);

            gtalk.on('online',
                function() {
                    console.log("online");
                    done();
                });
            gtalk.on('error',
                function(e) {
                    console.log(e);
                    done(e);
                });
        });


    });

});