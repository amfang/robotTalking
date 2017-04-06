/*

 */
var express = require("express");

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require("cfenv");

// create a new express server
var app = express();

// serve the files out of ./public as our main files - bluemix web files
app.use(express.static(__dirname + "/public"));

// init
console.log("app init");

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

module.exports = app;