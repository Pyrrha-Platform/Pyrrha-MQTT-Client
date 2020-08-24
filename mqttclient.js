const fs = require('fs');
var mqtt = require('mqtt');
require('dotenv').config();

var pemFile = fs.readFileSync(process.env.IOT_PEM);

const MQTT = require("async-mqtt");
const mqttClient2 = MQTT.connect({
    host: process.env.IOT_HOST,
    protocol: process.env.IOT_PROTOCOL,
    username: process.env.IOT_USERNAME, //hello world, how are you?
    port: process.env.IOT_SECURE_PORT,
    password: process.env.IOT_PASSWORD,
    clientId: process.env.IOT_CLIENTID,
    cert: pemFile
});

// const pool = setupMariaDB();

const asyncFunction = async () => {
    try {
        //need to add error checking on the topic itself. Handle case where topic is not present.
        await mqttClient2.subscribe(process.env.IOT_TOPIC);
        console.log(`!!successfully connected to server ${process.env.IOT_HOST} on topic ${process.env.IOT_TOPIC}`);
        mqttClient2.on('message', (topics, payload) => {
            var msg = JSON.parse(payload.toString());
            console.log(`got a message: ${JSON.stringify(msg)}`);
            sendWSS(msg);

            //insert into database
            // insertDatabase(msg);
        });
        //
        // This line doesn't run until the server responds to the publish
        // await mqttClient2.end();
        // This line doesn't run until the client has disconnected without error
    } catch (e) {
        // Do something about it!
        console.log(e.stack);
        process.exit();
    }
}

mqttClient2.on("connect", asyncFunction);


function setupMariaDB() {
    const mariadb = require('mariadb');
    const { type } = require('os');
    const pool = mariadb.createPool({
        host: process.env.MARIADB_HOST,
        user: process.env.MARIADB_USERNAME,
        password: process.env.MARIADB_PASSWORD,
        database: 'prometeo',
        connectionLimit: 5
    });
    return pool;
}

function sendWSS(msg) {
    // take out this code from. We should not connect everytime a message comes in
    var WSS = require('websocket').client;
    var webSocketClient = new WSS();
    // webSocketClient.connect(`ws://${process.env.WS_HOST}:${process.env.WS_PORT}`, 'echo-protocol');
    webSocketClient.connect('ws://ws:8080', 'echo-protocol');

    webSocketClient.on('connectFailed', (error) => {
        console.log(`unable to connect to websocketserver: ${process.env.WS_HOST}:${process.env.WS_PORT}` + error.toString());
    });

    webSocketClient.on('connect', (connection => {
        // console.log('websocketclient connection established');
        // connection.sendUTF("hello from mqtt client");
        // console.log(`what is data2: ${data}`);
        console.log('WebSocket Client Connected');
        connection.on('error', function (error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function () {
            console.log('echo-protocol Connection Closed');
        });

        if (connection.connected) {
            var time = Math.floor(Date.now() / 1000);
            var data = { "fields": ["Bombero", "Estado", "Timestamp", "Temp", "Humidity", "CO"], "values": [msg.id, "Verde", time, msg.temp, msg.humidity, msg.CO] };
            connection.sendUTF(JSON.stringify(data));
        }
    }));
}

function insertDatabase(data) {
    console.log('insert to database');
    return pool.getConnection()
        .then(conn => {
            console.log('successfully connected to the database service!');
            console.log(`inserting ${JSON.stringify(data)}`);
            // clau - was coming from node-red message._id. Changed to time + data.id

            //             +-----------------+----------+---------------+-------------+----------+------+
            // | clau            | SensorID | timestamp     | temperature | humidity | CO   |
            // +-----------------+----------+---------------+-------------+----------+------+
            // | 10001e1c.9aa502 | 0006     | 1581342069129 |          26 |       40 |   16 |

            var time = Math.floor(Date.now() / 1000);
            conn.query("INSERT INTO metrics VALUES (?, ?, ?, ?, ?, ?)", [time + data.id, data.id, time, data.temp, data.humidity, data.CO])
                .then((res) => {
                    // console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
                    conn.end();
                    return res;
                }).catch(err => {
                    //handle error
                    console.log(err);
                    conn.end();
                    return err;
                })
        }).catch(err => {
            console.log('not connected');
            console.log(err);
        });
}
