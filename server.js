#!/usr/bin/env node

'use strict';

var app = require('./app');

//add http&socket module
var http = require("http").Server(app);
var socket = require("./socket/msg")(http);

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;

http.listen(port, function() {
  console.log('Server running on port: %d', port);
});
