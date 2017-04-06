
var canvas = document.querySelector('.visualizer');
var mic = document.getElementById('input-mic');
var canvasCtx = canvas.getContext("2d");
var emptyCount = 0;
var voiceCount = 0;
var recorder;
var recording = false;
var canRecord = false;
var micOn = false;

var AudioContext=AudioContext||webkitAudioContext;
var context=new AudioContext;
var audio = document.createElement("audio");
//播放语音是不能录音
audio.addEventListener('ended', function () {
    canRecord = true;
}, false);

//调整兼容
navigator.getUserMedia=
    navigator.getUserMedia||
    navigator.webkitGetUserMedia||
    navigator.mozGetUserMedia;
onSuccess = function (e) {
    micOn = true;
    var data,p;
    //从麦克风的输入流创建源节点
    var stream=context.createMediaStreamSource(e);
    //alert("channelCount: "+stream.channelCount);
    visualize(e);
    //alert("channelCount1: "+stream.channelCount);
    //用于录音的processor节点
    recorder=context.createScriptProcessor(1024,1,0);
    recorder.onaudioprocess=function(e){
        data.push(e.inputBuffer.getChannelData(0));
    };

    startRecording = function () {
        if (!recording) {
            data=[],stream.connect(recorder),recording = true;
        }
    };

    stopRecording = function () {
        if (recording) {
            stream.disconnect(), recording = false;
            play.onclick();
        }

    };

    exportWAV = function () {
        //保存
        var frequency=context.sampleRate; //采样频率
        var pointSize=16; //采样点大小
        var channelNumber=1; //声道数量
        var blockSize=channelNumber*pointSize/8; //采样块大小
        var wave=[]; //数据
        for(var i=0;i<data.length;i++)
            for(var j=0;j<data[i].length;j++)
                wave.push(data[i][j]*0x8000|0);
        var length=wave.length*pointSize/8; //数据长度
        var buffer=new Uint8Array(length+44); //wav文件数据
        var view=new DataView(buffer.buffer); //数据视图
        buffer.set(new Uint8Array([0x52,0x49,0x46,0x46])); //"RIFF"
        view.setUint32(4,data.length+44,true); //总长度
        buffer.set(new Uint8Array([0x57,0x41,0x56,0x45]),8); //"WAVE"
        buffer.set(new Uint8Array([0x66,0x6D,0x74,0x20]),12); //"fmt "
        view.setUint32(16,16,true); //WAV头大小
        view.setUint16(20,1,true); //编码方式
        view.setUint16(22,1,true); //声道数量
        view.setUint32(24,frequency,true); //采样频率
        view.setUint32(28,frequency*blockSize,true); //每秒字节数
        view.setUint16(32,blockSize,true); //采样块大小
        view.setUint16(34,pointSize,true); //采样点大小
        buffer.set(new Uint8Array([0x64,0x61,0x74,0x61]),36); //"data"
        view.setUint32(40,length,true); //数据长度
        buffer.set(new Uint8Array(new Int16Array(wave).buffer),44); //数据
        //打开文件
        var blob=new Blob([buffer],{type:"audio/wav"});
        //open(URL.createObjectURL(blob));
        return blob;
    };
}

//录音对话模式
talk.onclick = function () {

    if(talk.value == "语音对话中") {
        talk.value="语音对话";
        canRecord = false;
    }else if(talk.value == "语音对话"){
        record.onclick();
        talk.value="语音对话中";
        canRecord = true;
    }

    var currMedia = document.getElementById('audio');

    alert("currMedia status: "+currMedia.paused);
};

//录音/停止 按钮点击动作
record.onclick=function(){
    //alert("record.onclick=function()");
    if (!micOn) {
        //请求麦克风
        navigator.getUserMedia({audio:true},onSuccess,function(e){
            console.log("请求麦克风失败");
        });
    }

    if(record.value=="录音")
        return emptyCount = 0, voiceCount = 0, this.value="停止", mic.setAttribute('class', 'active-mic');
    if(record.value=="停止")
        return stopRecording(),this.value="录音", mic.setAttribute('class', 'inactive-mic');
    //alert("channelCount2: "+stream.channelCount);
};
//播放/停止 按钮点击动作
play.onclick=function(){

    if (recording) {
        stopRecording();
        record.value = "录音";
        mic.setAttribute('class', 'inactive-mic');
    }
    var blob = exportWAV();
    //alert("blob: "+blob+" -- blob.size: "+blob.size);
    audio.src = URL.createObjectURL(blob);

    canRecord = false;

    audio.play();
    CHAT.wavUp(blob);
};

//保存
save.onclick=function(){
    if (recording) {
        stopRecording();
        record.value = "录音";
        mic.setAttribute('class', 'inactive-mic');
    }
    var blob = exportWAV();
    open(URL.createObjectURL(blob));
};

function runTest() {

    if ( !recording && record.value == "停止") {
        startRecording();
    }
}

function micClick() { // When the microphone button is clicked
    //alert("micON clicked --- recording: "+recording);
    record.onclick();

}

function visualize(stream) {
    //alert("function visualize(stream)");
    var source = context.createMediaStreamSource(stream);

    var analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    //alert("bufferLength: "+bufferLength);
    source.connect(analyser);
    //analyser.connect(audioCtx.destination);

    WIDTH = canvas.width
    HEIGHT = canvas.height;

    draw()

    function draw() {

        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;

        for(var i = 0; i < bufferLength; i++) {
            //alert("dataArray["+i+"]: "+dataArray[i]);
            var v = dataArray[i] / 128.0;
            var y = v * HEIGHT/2;

            if(talk.value == "语音对话") {
                canRecord = false;
            }

            var vol = Math.abs(y - HEIGHT/2) / HEIGHT/2 * 1000;
            //alert("vol: "+vol);
            if (vol > 40) {
                voiceCount ++;
                emptyCount = 0;

                if (voiceCount > 5 && canRecord && record.value == "录音") {
                    record.onclick();
                }

                if (voiceCount > 10 && !recording && record.value == "停止") {
                    //alert("start recording"+voiceCount);
                    startRecording();
                    voiceCount = 0;
                }

            }else if (vol < 3) {
                emptyCount ++;
                if (emptyCount > 40960 && recording) {
                    //alert("stop recoring"+emptyCount);
                    stopRecording();
                    record.value = "录音";
                    mic.setAttribute('class', 'inactive-mic');
                    emptyCount = 0;
                    voiceCount = 0;
                }
            }

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();

    }
}