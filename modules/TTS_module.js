/**
 * Created by JackyFang on 1/4/17.
 */
//Baidu TTS

var https = require('https');
var http = require('http');
var fs = require('fs');

var TTS_module = (function() {

    return {
        getToken: getToken,
        toSpeech: toSpeech
    };

    function getToken(req, callback) {

        var grant_type = "client_credentials";
        var client_id = "OZ6Gictexbw7oL6KegStvoLUsm9Nwxff";
        var client_secret = "Yz655zwraEaOfVTlZt3RByGahzRqPpzP";

        var regUrl = "https://openapi.baidu.com/oauth/2.0/token";
        var url = regUrl+"?grant_type="+grant_type+"&client_id="+client_id+"&client_secret="+client_secret+"&";

        https.get(url, function (res) {

            res.on('data', function (data) {
                console.log("TTS_module -- data: "+data);
                var tokTime = process.uptime(); // 此函数是通过nodejs启动运行时间来得到一个秒数时间戳，精确到毫秒
                var token = JSON.parse(data).access_token;
                console.log("TTS_module -- token: "+token);
                callback(null, token);
            });

        }).on('error', function (err) {
            console.log("TTS_module -- err: "+err);
        });

    }

    function toSpeech (inputText, token,  callback) {

        //var file = fs.createWriteStream('baidu.mp3');

        console.log("token: "+token);
        // http://tsn.baidu.com/text2audio?tex=***&lan=zh&cuid=***&ctp=1&tok=***  -- baidu TTS
        var baseUrl = "http://tsn.baidu.com/text2audio";
        var cuid = "c8:69:cd:b7:97:34";
        var url = encodeURI(baseUrl+"?tex="+inputText+"&lan=zh&cuid="+cuid+"&ctp=1&tok="+token);

        http.get(url, function (res) {
            var output;
            var buffers = [];
            res.on('data', function (data) {

                buffers.push(data);
                //file.write(data); // 写入文件
            });
            res.on('end', function () {
                //file.end();
                //console.log("baidu.mp3 download done");

                var fileBuffer = Buffer.concat(buffers);
                callback(null, fileBuffer);
            });
        }).on('error', function (err) {
            console.log("err: "+err);
        });
    }

}());

module.exports = TTS_module;
