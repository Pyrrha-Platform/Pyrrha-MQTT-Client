const logger = require('./logger');
const fs = require('fs');
var mqtt = require('mqtt');
require('dotenv').config();

var pemFile = fs.readFileSync(process.env.IOT_PEM);

const { timeStamp } = require('console');
const mqttClient = mqtt.connect({
    host: process.env.IOT_HOST,
    protocol: process.env.IOT_PROTOCOL,
    username: process.env.IOT_USERNAME, //hello world, how are you?
    port: process.env.IOT_SECURE_PORT,
    password: process.env.IOT_PASSWORD,
    clientId: process.env.IOT_CLIENTID,
    cert: pemFile,
    keepalive: parseInt(process.env.IOT_KEEPALIVE)
});

const pool = setupMariaDB();
var connection;

const asyncFunction = function () {
    try {
        logger.debug(`!!successfully connected to server ${process.env.IOT_HOST}`);
        //need to add error checking on the topic itself. Handle case where topic is not present.
        mqttClient.subscribe(process.env.IOT_TOPIC, { qos: 2 }, function (err) {
            logger.debug(`!!successfully subscribed to topic: ${process.env.IOT_TOPIC}`);
        });

        mqttClient.on('message', (topics, payload) => {
            var msg = JSON.parse(payload.toString());
            logger.debug(`\n\n\n\ngot a message: ${JSON.stringify(msg.firefighter_id)}-${JSON.stringify(msg.device_id)}`);
            logger.debug(JSON.stringify(msg));
            sendWSS(msg);

            //insert into database
            insertDatabase(msg);
        });
        //
        // This line doesn't run until the server responds to the publish
        // await mqttClient2.end();
        // This line doesn't run until the client has disconnected without error
    } catch (e) {
        // Do something about it!
        logger.error(e.stack);
        process.exit();
    }
}


logger.debug('connecting to IoT platform ...')
mqttClient.on("connect", asyncFunction);

mqttClient.on('close', function (err) {
    if (err) {
        logger.error(err);
    } else {
        logger.debug('connection closed');
    }
})

mqttClient.on('disconnect', function (err) {
    if (error) {
        logger.error(err);
    } else {
        logger.debug('connection disconnected');
    }
})


mqttClient.on('error', function (err) {
    if (err) {
        logger.error(err);
    } else {
        logger.debug('connection error');
    }
})


function setupMariaDB() {
    const mariadb = require('mariadb');
    const { type } = require('os');
    const pool = mariadb.createPool({
        host: process.env.MARIADB_HOST,
        port: process.env.MARIADB_PORT,
        user: process.env.MARIADB_USERNAME,
        password: process.env.MARIADB_PASSWORD,
        database: 'prometeo',
        connectionLimit: 5
    });
    return pool;
}


function sendWSS(msg) {


    // add type or real
    msg.type = "REAL";
    // take out this code from. We should not connect everytime a message comes in
    var WSS = require('websocket').client;
    var webSocketClient = new WSS();
    // webSocketClient.connect(`ws://${process.env.WS_HOST}:${process.env.WS_PORT}`, 'echo-protocol');
    webSocketClient.connect(`ws://${process.env.WS_HOST}:${process.env.WS_PORT}`, 'echo-protocol');

    webSocketClient.on('connectFailed', (error) => {
        logger.debug(`unable to connect to websocketserver: ${process.env.WS_HOST}:${process.env.WS_PORT}` + error.toString());
    });

    webSocketClient.on('connect', (connection => {
        logger.debug('WebSocket Client Connected');
        connection.on('error', function (error) {
            logger.debug("Connection Error: " + error.toString());
        });
        connection.on('close', function () {
            logger.debug('echo-protocol Connection Closed');
        });

        if (connection.connected) {
            // var time = Math.floor(Date.now() / 1000);
            // var data = { "fields": ["Bombero", "Estado", "Timestamp", "Temp", "Humidity", "CO"], "values": [msg.id, "Verde", time, msg.temp, msg.humidity, msg.CO] };
            console.log('sending msg');
            connection.sendUTF(JSON.stringify(msg));
        }
    }));
}

function getUTCTimeStamp(timestamp) {
    // return the UTC value of the timestamp
    return timestamp.toUTCString();
}

function setSecondsToZero(timeStamp) {
    timeStamp = new Date(timeStamp).setSeconds(0);
    return new Date(timeStamp).toISOString().substr(0, 19);
}

function insertDatabase(data) {
    logger.debug('insert to database');
    return pool.getConnection()
        .then(conn => {
            logger.debug('successfully connected to the database service!');



            // check if the data already exists in mariadb before inserting the new data????
            // clau - was coming from node-red message._id. Changed to time + data.id

            //             +-----------------+----------+---------------+-------------+----------+------+
            // | clau            | SensorID | timestamp     | temperature | humidity | CO   |
            // +-----------------+----------+---------------+-------------+----------+------+
            // | 10001e1c.9aa502 | 0006     | 1581342069129 |          26 |       40 |   16 |

            // assuming data.device_timestamp is already in UTC format
            var timestamp = new Date(data.device_timestamp).setSeconds(0)
            // logger.debug(`inserting timestamp: ${new Date(timestamp)}`);
            //     var device_timestamp =  new Date(data.device_timestamp).toISOString();
            //     var timestamp_mins = new Date(new Date(data.device_timestamp).setSeconds(0)).toISOString();

            /*
                INSERT INTO prometeo.firefighter_sensor_log
(timestamp_mins, firefighter_id, device_id, device_battery_level, temperature, humidity, carbon_monoxide, nitrogen_dioxide, formaldehyde, acrolein, benzene, device_timestamp, device_status_LED)
VALUES('', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
            */
            conn.query("INSERT INTO firefighter_sensor_log (timestamp_mins, firefighter_id, device_id, device_battery_level, temperature, humidity, carbon_monoxide, nitrogen_dioxide, formaldehyde, acrolein, benzene, device_timestamp) VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?)", [new Date(timestamp), data.firefighter_id, data.device_id, data.device_battery_level, data.temperature, data.humidity, data.carbon_monoxide, data.nitrogen_dioxide, data.formaldehyde, data.acrolein, data.benzene, data.device_timestamp])
                .then((res) => {
                    // logger.debug(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
                    conn.end();
                    return res;
                }).catch(err => {
                    //handle error
                    logger.error(err);
                    conn.end();
                    return err;
                })
        }).catch(err => {
            logger.error(err);
        });
}