(function () {

	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;

	w.CHAT = {
		msgObj:d.getElementById("scrollingChat"),
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		testWS:null,
		userid:null,
		socket:null,
		fs:null,
		//让浏览器滚动条保持在最低部
		scrollToBottom:function(){
			this.msgObj.scrollTop = this.msgObj.scrollHeight;
		},
		//退出，本例只是一个简单的刷新
		logout:function(){
			//this.socket.disconnect();
			location.reload();
		},
		//提交聊天消息内容
		submit:function(){
			var content = d.getElementById("textInput").value;

			if(content != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					content: content
				};
				//alert("username: "+obj.username+" -- content: "+obj.content);
				this.socket.emit('message', obj);
				d.getElementById("textInput").value = '';
			}
			return false;
		},
		//提交上传文件
		fileUp:function(){
			//alert("submit clicked");
			var content = "123";
			var obj = {
				userid: this.userid,
				username: this.username,
				content: content
			};

			var fileName = d.getElementById("fileup").value;
			var element = d.getElementById("fileup");
			//alert("filename: "+fileName);

			var reader = new FileReader();
			reader.readAsDataURL( element.files[0]);
			reader.onload = function(e){

				content = e.target.result;  //encode完成后添加内容
				obj.content = content;
				//alert("this.username: "+content);
				CHAT.socket.emit('private_message',CHAT.username, obj); // 异步执行需要获取全局变量, this在这里失效
			};

		},
		//提交上传文件
		wavUp:function(blob){
			//alert("wavUp exec");
			var content = "123";
			var obj = {
				userid: this.userid,
				username: this.username,
				content: content
			};

			var blob = blob;
			//alert("blob: "+blob+" -- blob.size: "+blob.size);

			var reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onload = function(e){

				content = e.target.result;  //encode完成后添加内容
				obj.content = content;
				//alert("this.username: "+CHAT.username);
				CHAT.socket.emit('private_message',CHAT.username, obj); // 异步执行需要获取全局变量, this在这里失效
			};

		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		//更新系统消息，本例中在用户加入、退出的时候调用
		updateSysMsg:function(o, action){
			//当前在线用户列表
			var onlineUsers = o.onlineUsers;
			//当前在线人数
			var onlineCount = o.onlineCount;
			//新加入用户的信息
			var user = o.user;
				
			//更新在线人数
			var userhtml = '';
			var separator = '';
			for(key in onlineUsers) {
		        if(onlineUsers.hasOwnProperty(key)){
					userhtml += separator+onlineUsers[key];
					separator = '、';
				}
		    }
			//d.getElementById("onlinecount").innerHTML = '当前共有 '+onlineCount+' 人在线，在线列表：'+userhtml;
			
			//添加系统消息
			/*var html = '';
			html += '<div class="msg-system">';
			html += user.username;
			html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			this.msgObj.appendChild(section);*/
			this.scrollToBottom();
		},
		init:function(){
			//alert("init:function()");
			/*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/
			this.userid = this.genUid();
			this.username = this.genUid();
			
			//d.getElementById("showusername").innerHTML = this.username;
			//this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
			this.scrollToBottom();

			var hostName = window.location.host;

			//连接websocket后端服务器-bluemix
			this.socket = io.connect(hostName);
			
			//告诉服务器端有用户登录
			this.socket.emit('login', {userid:this.userid, username:this.username});
			//alert("username:"+this.username);
			
			//监听新用户登录
			this.socket.on('login', function(o){
				CHAT.updateSysMsg(o, 'login');
			});
			
			//监听用户退出
			this.socket.on('logout', function(o){
				CHAT.updateSysMsg(o, 'logout');
			});
			
			//监听消息发送
			this.socket.on('message', function(from, obj){
				//alert("from: "+from+" -- obj.username: "+obj.username+" -- CHAT.username: "+CHAT.username+" -- CHAT.userid: "+CHAT.userid+" -- content: "+obj.content);

				if (from != obj.username) {
					obj.username = from;
				}
				//alert("from: "+from+" -- obj.username: "+obj.username+" -- CHAT.username: "+CHAT.username+" -- CHAT.userid: "+CHAT.userid+" -- content: "+obj.content);

				if (obj.content.length < 300) {  // 获取音频字符串不显示
					var isme = (obj.username == CHAT.username) ? true : false;
					var contentDiv = '<div>'+obj.content+'</div>';
					var usernameDiv = '<span>'+obj.username+'</span>';

					var section = d.createElement('section');
					if(isme){
						section.className = 'user';
						section.innerHTML = contentDiv + usernameDiv;
					} else {
						section.className = 'service';
						section.innerHTML = usernameDiv + contentDiv;
					}
					CHAT.msgObj.appendChild(section);
					CHAT.scrollToBottom();
				} else {
					//alert(obj.content);
					var base64Str = obj.content; //base64 字符串

					var blob = b64toBlob(base64Str, "audio/mpeg"); // base64 decode - from SaveBlob.js

					//alert("blob: "+ blob);
					//doSave(blob, "song.mp3"); // from SaveBlob.js - 实现浏览器保存blob到本地

					var media = document.createElement('audio');
					var bloburl = URL.createObjectURL(blob); //
					media.src = bloburl;
					//var media = new Audio("data:audio/mp3;base64,"+base64Str); // HTML5直接播放base64 mp3
					media.play();  // online play music
					//alert("saveAs done");
				}

			});

		}
	};

	//通过“回车”提交信息
	d.getElementById("textInput").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.submit();
		}
	};

	CHAT.init();


})();