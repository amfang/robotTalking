
'use strict';

var STT_module = require('../modules/STT_module');
var TTS_module = require('../modules/TTS_module');

var Api = require('./convHandler');
//var ConversationResponse = require('./response');

var fs = require("fs");
var sio = require('socket.io');

var TTStoken;
var tokTime;
var tokExpire = true;

var IO = function(server) {

  // 调用init
  console.log("调用init");
  //ConversationResponse.init();

  // Make call to API to try and get TTS token - 259200 expired

  TTS_module.getToken("123", function (err, token) {
    if (!err) {
      TTStoken = token;
      tokTime = process.uptime();
    }
  });

  // io init
  var io = sio.listen(server);
  //在线用户
  var onlineUsers = {};
  //当前在线人数
  var onlineCount = 0;

  var arrAllSocket = [];

  //
  var arrAllContext = [];

  io.on('connection', function(socket){

    //console.log('a user connected');

    //监听新用户加入
    socket.on('login', function(obj){

      //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
      socket.name = obj.userid;

      //
      arrAllSocket[obj.username] = socket.id; //把socket.id存到全局数组里面去
      //console.log("login: "+obj.username+" -- arr: "+arrAllSocket[obj.username]);

      //检查在线列表，如果不在里面就加入
      if(!onlineUsers.hasOwnProperty(obj.userid)) {
        onlineUsers[obj.userid] = obj.username;
        //在线人数+1
        onlineCount++;
      }

      //向所有客户端广播用户加入
      io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});

      var contextIn = arrAllContext[obj.username];
      console.log("username: "+obj.username+" -- contextIn: "+JSON.stringify(contextIn));

      sendApiRequest("", contextIn, obj);

      console.log(obj.username+'加入了聊天室');

    });

    //监听用户退出
    socket.on('disconnect', function(){
      //将退出的用户从在线列表中删除
      if(onlineUsers.hasOwnProperty(socket.name)) {
        //退出用户的信息
        var obj = {userid:socket.name, username:onlineUsers[socket.name]};

        //删除
        delete onlineUsers[socket.name];
        //在线人数-1
        onlineCount--;

        //向所有客户端广播用户退出
        io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        console.log(obj.username+'退出了聊天室');
      }
    });

    //监听用户发布聊天内容
    socket.on('message', function(obj){

      //向所有客户端广播发布的消息
      io.emit('message',obj.username, obj);
      console.log(obj.username+'说：'+obj.content);

    });

    //监听用户发布上传文件
    socket.on('private_message', function(from, obj){
      //判断语音还是字符
      if (obj.content.length < 300){

        var data = obj.content;

        //STT返回文字进行conversation处理 -- planning
        var contextIn = arrAllContext[obj.username];
        console.log("username: "+obj.username+" -- contextIn: "+JSON.stringify(contextIn));

        sendApiRequest(data, contextIn, obj);

      }else{
        getTextFromSTT(from, obj);
      }

    });

    function getTextFromSTT(from, obj) {
      /*
       * 接收到客户端传入信息obj, 进行处理decode -- developing
       */
      //console.log("private_message get: "+obj.content);

      var base64Data=obj.content.replace(/^data:audio\/wav;base64,/,""); // aduio/wav格式
      var binaryData=new Buffer(base64Data,'base64').toString('binary');
      var fileName = "./userData/" + obj.username + ".wav";
      fs.writeFile(fileName,binaryData,'binary',function(err){
        if(err){
          console.log(err);
        } else {
          //callback next action -- planning
          //Waston STT_module 上传wav并回调识别文字;
          STT_module.recognizeFile(fileName, function (err, data) {

            console.log("STT back data: "+data);
            //获取STT返回文字
            data = data.substr(1, data.length - 2);
            data = data.replace(/\s+/g,""); //trim(); //
            obj.content = data;

            var from = obj.username;

            var target = arrAllSocket[from];
            console.log("--------------------------------------------------------------");
            console.log("username: "+obj.username+" -- STT target: "+target);
            console.log("--------------------------------------------------------------");
            if(target)
            {
              //向发送客户端返回语音识别的字符串
              io.to(target).emit('message',from, obj);
              //socket.to(target).emit('message',from, obj);
              //target.emit('message',from, obj);
              console.log('STT 返回语音识别的字符串 to: ' + from);
            }

            //STT返回文字进行conversation处理 -- planning
            var contextIn = arrAllContext[obj.username];
            console.log("username: "+obj.username+" -- contextIn: "+JSON.stringify(contextIn));

            sendApiRequest(data, contextIn, obj);

          });
        }
      });

    }

    function sendCONVRequest(req, contextIn, obj, callback) {

      //
      Api.sendRequest(req, contextIn, function (err, data) {
        if (!err) {

          arrAllContext[obj.username] = data.context;
          console.log("username: "+obj.username+" -- context data: "+JSON.stringify(data));

          //conversation返回对话内容进行分析处理调用
          var handledRes = Api.preHandling(data, obj.username);

          //conversation返回结果进行TTS处理,然后调用下面encode并返回客户端
          //获取Conversation返回结果
          var outData = handledRes;

          callback(null, outData);

        }
      });
    }

    function sendApiRequest(req, contextIn, obj) {
      sendCONVRequest(req, contextIn, obj, function (err, outData) {
        if (!err) {

          console.log("function chatUpdateSetup(obj) { -- newPayloadStr: "+outData.output.text);
          obj.content = outData.output.text;

          var from = obj.username;
          var target = arrAllSocket[from];
          console.log("--------------------------------------------------------------");
          console.log("username: "+obj.username+" -- CONV target: "+target);
          console.log("--------------------------------------------------------------");
          if(target)
          {
            //向发送客户端返回Waston的会话结果字符串
            io.to(target).emit('message',"Waston", obj);
            console.log('CONV 返回Waston的会话结果字符串 to: ' + from);
          }

          //转换为语音,并返回客户端mp3, 判断获取TTS token
          checkTTSToken();

          if (tokExpire) {
            TTS_module.getToken("123", function (err, token) {
              if (!err) {
                TTStoken = token;
                tokTime = process.uptime();

                processTTS(outData.output.text, obj, function (err, data) {

                  if (!err) {
                    obj.content = data;
                    //obj.username = "waston";
                    //console.log("returnStr: "+from);
                    //console.log("arr: "+arrAllSocket[from]);
                    var from = obj.username;
                    var target = arrAllSocket[from];
                    console.log("--------------------------------------------------------------");
                    console.log("username: "+obj.username+" -- TTS target: "+target);
                    console.log("--------------------------------------------------------------");
                    if(target)
                    {
                      //向发送客户端返回会话结果语音合成的音频字符串
                      io.to(target).emit('message',from, obj);
                      //io.sockets.socket(target).emit('message',from, obj);
                      console.log('TTS 返回会话结果语音合成的音频字符串 to: ' + from);
                    }
                  }

                });
              }
            });
          } else {
            processTTS(outData.output.text, obj, function (err, data) {
              if (!err) {
                obj.content = data;
                //obj.username = "waston";
                //console.log("returnStr: "+from);
                //console.log("arr: "+arrAllSocket[from]);
                var from = obj.username;
                var target = arrAllSocket[from];
                console.log("--------------------------------------------------------------");
                console.log("username: "+obj.username+" -- TTS target: "+target);
                console.log("--------------------------------------------------------------");
                if(target)
                {
                  //向发送客户端返回会话结果语音合成的音频字符串
                  io.to(target).emit('message',from, obj);
                  //io.sockets.socket(target).emit('message',from, obj);
                  console.log('TTS 返回会话结果语音合成的音频字符串 to: ' + from);
                }
              }
            });
          }
        }
      });
    }

    function processTTS(str, obj, callback) {

      TTS_module.toSpeech(str,TTStoken, function (err, data) {

        var returnStr = new Buffer(data).toString('base64');
        console.log("returnStr: "+returnStr);
        //var base64Data = str.replace(/^undefined/,"");

        callback(null, returnStr);

        // 返回语音写入server
        /*fs.writeFile("baidu2.mp3", data,  function(err){
         if (err) {
         console.log("ERROR");
         }else{
         console.log("baidu2.mp3 download");
         }
         });*/
      });
    }

    function checkTTSToken() {
      var currTime = process.uptime();
      var interval = currTime - tokTime;
      if (interval > 259000 || !TTStoken) {
        tokExpire = true;
      } else {
        tokExpire = false;
      }
    }

  });

}

module.exports = IO;