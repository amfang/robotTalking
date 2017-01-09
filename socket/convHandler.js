// The Api module is designed to handle all interactions with the server

var CONV_module = require('../modules/CONV_module');

var Api = (function() {

  var requestPayload; //userPayload -- car-dashboard
  var responsePayload; //watsonPayload -- car-dashboard
  // context in car-dashboard -- put into sendRequest(text, context)

  console.log("Api init");
  // Publicly accessible methods defined
  return {
    //initConversation: initConversation,
    //returnSTTModel: returnSTTModel,
    preHandling: preHandling,
    sendRequest: sendRequest,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      //console.log("setRequestPayload: "+newPayloadStr);
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    }
  };

  //预处理
  function preHandling(data) {
    /*
     * - 判断返回结果进行预处理 - call_retrieve_and_rank & intent === "off_topic"
     */
    console.log("preHandling");
    console.log("responseHandler -- data: "+JSON.stringify(data));
    if (data && data.intents && data.entities && !data.output.error) {

      // Check if message is handled by retrieve and rank and there is no message set
      console.log("data.context.call_retrieve_and_rank: "+data.context.call_retrieve_and_rank+"--- data.output.text: "+data.output.text);
      if (data.context.call_retrieve_and_rank && data.output.text) {
        console.log("Out of scope");
        // TODO add EIR link
        data.context.call_retrieve_and_rank = false;
        data.output.text = ['I am not able to answer that. You can try asking the'
        + ' <a href="https://conversation-enhanced.mybluemix.net/" target="_blank">Enhanced Information Retrieval App</a>'];

        //return data;
      }

      console.log("responseHandler -- data: "+JSON.stringify(data));
      var primaryIntent = data.intents[0];
      if (primaryIntent) {
        /*
         * 返回信息处理入口位置
         */

        //如果返回data: {"intents":[{"intent":"off_topic",猜测在说设定不同的语言(cn/en)
        /*
        if (primaryIntent.intent === "off_topic") {
          //console.log("Maybe in different language");
          //data.output.text = ['I am not able to answer that. You can try asking the'
          //+ ' <a href="https://conversation-enhanced.mybluemix.net/" target="_blank">Enhanced Information Retrieval App</a>'];
          //Api.setResponsePayload(JSON.stringify(data));

          primaryIntent.intent = "lan_switch";
          data.intents[0] = primaryIntent
          //console.log("Api.stt_model: "+stt_model);
          if (stt_model === "zh-CN_BroadbandModel") {
            stt_model = "en-US_BroadbandModel";
            data.output.text = ['I guess you are talking in English speaking, "Yes" or "No"?'];

          }else if (stt_model === "en-US_BroadbandModel") {
            stt_model = "zh-CN_BroadbandModel";
            data.output.text = ['我猜你在说中文, 准备给你设置成中文沟通模式,请回答"是"或者"不是"?'];
          }
          console.log("responseHandler -- data -- updated: "+JSON.stringify(data));
          //Api.setResponsePayload(JSON.stringify(data));
          //return data;
        }*/
      }
    }
    //Api.setResponsePayload(JSON.stringify(data));
    return data;
  }

  // Function used for initializing the conversation with the first message from Watson -- copied from car-dashboard
  function initConversation() {
    //postConversationMessage('');
    sendRequest('', null);
  }

  // Send a message request to the server
  function sendRequest(text, contextIn, callback) {

    var context;

    // Build request payload
    var payloadToWatson = {}; // data -- car-dashboard
    if (text) {

      payloadToWatson.input = {
        text: text
      };

      /*
       * - 发送中文前进行处理, 确定workspace是中文/英文 链接
       * - current: 中文仅进行提示,不做处理

      //check cn or En
      console.log("sendRequest() - text:"+text+"xx");
      var reg = new RegExp("[\\u4E00-\\u9FFF]+","g");
      if(reg.test(text)) {
        text = text.replace(/(^\s*)|(\s*$)/g, ''); // trim emptyspace
        if (text == "是") {
          var payload = {output: {text: ['中文对话模式设置成功,请使用中文会话交流;']}};
          Api.setRequestPayload(JSON.stringify(payloadToWatson));
          Api.setResponsePayload(JSON.stringify(payload));
          return;
        }else if (text == "不是") {
          var payload = {output: {text: ['Please continue use english talking;']}};
          Api.setRequestPayload(JSON.stringify(payloadToWatson));
          Api.setResponsePayload(JSON.stringify(payload));
          stt_model = "en-US_BroadbandModel";
          return;
        }*/
        /*
         * - 发送中文前进行处理, 确定workspace是中文/英文 链接
         * - current: 中文仅进行提示,不做处理

        //alert("text: "+text+" -- 汉字！");
        var payload = {output: {text: ['中文会话模块正在开发中,暂时无法使用,已经设置成英文交流模式,请使用英文交流;']}};
        Api.setRequestPayload(JSON.stringify(payloadToWatson));
        Api.setResponsePayload(JSON.stringify(payload));
        stt_model = "en-US_BroadbandModel";
        return;
      }*/

    }
    //保持api -> context, 如果调用函数添加contextIn(conversation), 那么使用, 如果没有(STT), 使用保持的
    //alert("sendRequest -- contextIn: "+contextIn+" -- context: "+context);
    if (contextIn) {
      context = contextIn;
    }
    //alert("sendRequest -- contextIn: "+contextIn+" -- context: "+context);
    if (context) {
      payloadToWatson.context = context;
    }

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      //Api.setRequestPayload(payloadToWatson); //Api.setUserPayload(data); -- copid from car-dashboard
      Api.setRequestPayload(params);
    }
    CONV_module.sendAsking(params, function (err, data) { //通过CONV_module进行conversation数据交换

      if (!err) {

        var response = data;
        context = response.context;

        /*
         * - 判断返回结果进行预处理 - call_retrieve_and_rank & intent === "off_topic"
         */
        console.log("postConversationMessage -- http.responseText: "+JSON.stringify(data));
        //Api.preHandling(data);
        callback(null, data);
      }

    });
  }
}());

module.exports = Api;
