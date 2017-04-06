/**
 * Created by JackyFang on 1/2/17.
 */

//
require ( 'dotenv' ).config ( {silent: true} );
var watson = require('watson-developer-cloud');

//The conversation workspace id
var workspace_id = process.env.WORKSPACE_ID || '<workspace_id>';
//var logs = null;
console.log("workspace_id: "+workspace_id);

// Create the service wrapper
var conversation = watson.conversation ( {
    username: process.env.CONVERSATION_USERNAME || '<username>',
    password: process.env.CONVERSATION_PASSWORD || '<password>',
    //url: 'https://gateway.watsonplatform.net/conversation/api',
    version_date: '2016-10-21',
    version: 'v1'
} );

var CONV_module = {
    getToken: function () { //检测是否能连接Waston并通过认证 - 可以不用
        /*console.log("STT_module - getToken: function ()");


         * - Get function of STT


        // For local development, replace username and password
        var config = extend({
            version: 'v1',
            url: 'https://stream.watsonplatform.net/speech-to-text/api',
            username: process.env.STT_USERNAME || username,
            password: process.env.STT_PASSWORD || password
        }, vcapServices.getCredentials('speech_to_text'));

        var authService = watson.authorization(config);

        console.log("here");

        // Get token using your credentials
        // server to get token
        authService.getToken({url: config.url}, function(err, token) {
            if (err) {
                console.log("STT_module -- token -- err: "+err);
                next(err);
            } else {
                console.log("STT_module -- token: "+token);
                //initToken();
                STT_module.initToken(token);
            }
        });
         */
    },
    initToken: function (token) {
        if (!token) {
            console.error('No authorization token available');
            console.error('Attempting to reconnect...');
        }
    },
    sendAsking: function (req, callback) {

        if ( !workspace_id || workspace_id === '<workspace-id>' ) {
            //If the workspace id is not specified notify the user
            callback(null, JSON.parse({
                'output': {
                    'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
                    '<a href="https://github.com/watson-developer-cloud/car-dashboard">README</a> documentation on how to set this variable. <br>' +
                    'Once a workspace has been defined the intents may be imported from ' +
                    '<a href="https://github.com/watson-developer-cloud/car-dashboard/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
                    }
                })
            );
        }

        req = JSON.parse(req);

        console.log("req: "+JSON.stringify(req));
        console.log("req.input: "+JSON.stringify(req.input));

        var payload = {
            workspace_id: workspace_id,
            context: {}
        };

        console.log("payload: "+JSON.stringify(payload));

        if ( req ) {
            if ( req.input ) {
                payload.input = req.input;

            }
            if ( req.context ) {
                // The client must maintain context/state
                payload.context = req.context;
                //console.log('app.post - : req.context:'+ JSON.stringify(req.body.context) +'; time: '+new Date ());
            }
        }
        console.log("req.body -- payload: "+JSON.stringify(payload));

        console.log('payload.input: '+ JSON.stringify(payload.input) +'; time: '+new Date ());
        console.log('payload.context: '+ JSON.stringify(payload.context) +'; time: '+new Date ());
        // Send the input to the conversation service
        conversation.message ( payload, function (err, data) {

            console.log('request : payload; response: '+ JSON.stringify(data) +'; time: '+new Date ());
            console.log("***********");
            var res = CONV_module.updateMessage(payload, data);
            callback(err, res);
        });
    },
    /**
     * Updates the response text using the intent confidence
     * @param  {Object} input The request to the Conversation service
     * @param  {Object} response The response from the Conversation service
     * @return {Object}          The response with the updated message
     */
    updateMessage: function(input, response) {
        var responseText = null;
        if (!response.output) {
            response.output = {};
        } else {
            return response;
        }
        if (response.intents && response.intents[0]) {
            var intent = response.intents[0];
            // Depending on the confidence of the response the app can return different messages.
            // The confidence will vary depending on how well the system is trained. The service will always try to assign
            // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
            // user's intent . In these cases it is usually best to return a disambiguation message
            // ('I did not understand your intent, please rephrase your question', etc..)
            if (intent.confidence >= 0.75) {
                responseText = 'I understood your intent was ' + intent.intent;
            } else if (intent.confidence >= 0.5) {
                responseText = 'I think your intent was ' + intent.intent;
            } else {
                responseText = 'I did not understand your intent';
            }
        }
        response.output.text = responseText;
        console.log("updateMessage: -- response: "+response);
        return response;
    }

};

module.exports = CONV_module;
