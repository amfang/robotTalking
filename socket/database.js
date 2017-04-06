/**
 * Created by jackyfang on 24/01/2017.
 */

'use strict';

var mysql = require('mysql'),
    Test_DB = 'coversation_mysql',
    Test_TB = 'conversation_records';

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root'
});

//创建连接
//connection.connect();

var DB = (function() {

    return {
        insertData: insertData,
        countData: countData
    };

    function insertData(username, input, output, conv_data, remark) {

        connection.query('USE '+Test_DB);

        var conv_time = (new Date()).toLocaleDateString() + " " + (new Date()).toLocaleTimeString();

        //console.log("conv_time: "+conv_time);

        connection.query(
            'INSERT INTO '+Test_TB+' '+
            'SET username = ?, input = ?, output = ?, conv_data = ?, conv_time = ?, remark = ?',
            [username, input, output, conv_data, new Date(), remark]
        );

        //connection.end();
    }

    function countData() {

        connection.query('USE '+Test_DB);

        connection.query('Select count(*) AS count from '+Test_TB,
            function(err, rows, fields) {
                if (err) throw err;
                console.log('The solution is: ', rows[0].count)
            }
        );

        //connection.end();
    }

    function test() {
        DB.insertData("111", '2345', 'ddddddd');
    }

}());

module.exports = DB;
