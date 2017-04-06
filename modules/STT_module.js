/**
 * Created by JackyFang on 1/2/17.
 */

//
var vcapServices = require('vcap_services'),
    extend = require('util')._extend,
    watson = require('watson-developer-cloud');

var fs = require('fs');

var username = '7c678e18-2d31-4ff8-b5d1-52ab09807ba8';
var password = 'hjrOYlQLOaS2';

var STT_module = {
    getToken: function () { //检测是否能连接Waston并通过认证 - 可以不用
        console.log("STT_module - getToken: function ()");

        /*
         * - Get function of STT
         */

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

    },
    initToken: function (token) {
        if (!token) {
            console.error('No authorization token available');
            console.error('Attempting to reconnect...');
        }
    },
    recognizeFile: function (fileName, callback) { //上传wav文件并返回文字

        var speech_to_text = watson.speech_to_text({
            username: username,
            password: password,
            version: 'v1',
        });

        var params = {
            model: 'zh-CN_BroadbandModel', //'en-US_BroadbandModel', //
            content_type: 'audio/wav',
            continuous: true,
            'interim_results': false,
            'max_alternatives': 3,
            'word_confidence': false,
            timestamps: false
        };

        var recognizeStream = speech_to_text.createRecognizeStream(params);

        // pipe in some audio
        console.log("filename: "+fileName);
        fs.createReadStream(fileName).pipe(recognizeStream);

        // and pipe out the transcription
        recognizeStream.pipe(fs.createWriteStream('transcription.txt'));

        /*
        这里为何没有发送文件去识别？
         */

        // listen for 'data' events for just the final text
        // listen for 'results' events to get the raw JSON with interim results, timings, etc.
        recognizeStream.setEncoding('utf8'); // to get strings instead of Buffers from `data` events

        /*['data', 'results', 'error', 'connection-close'].forEach(function(eventName) {
            recognizeStream.on(eventName, console.log.bind(console, eventName));
        });*/

        //recognizeStream.on('results', function(event) { onEvent('Results:', event); });

        recognizeStream.on('data', function (event) {
            onEvent('Data: ', event);
        });

        recognizeStream.on('error', function(event) {
            onEvent('Error:', event);
        });

        function onEvent(name, event) {
            console.log("event: "+name, JSON.stringify(event,null,2));
            var data = JSON.stringify(event,null,2);
            callback(null, data);
        }

    }
};

module.exports = STT_module;
