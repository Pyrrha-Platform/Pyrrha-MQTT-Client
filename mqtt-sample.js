const logger = require('./logger');
const fs = require('fs');
var mqtt = require('mqtt');
require('dotenv').config({ path: '.env.client' });

// logger.info(`!!successfully connected to server ${process.env.IOT_HOST}`);
var pemFile = fs.readFileSync(process.env.IOT_PEM);

var mqtt = require('mqtt')
// the clientid format from the docs: d:orgId:deviceType:deviceId.
const options = {
    host: process.env.IOT_HOST,
    protocol: process.env.IOT_PROTOCOL,
    username: process.env.IOT_USERNAME,
    port: process.env.IOT_SECURE_PORT,
    password: process.env.IOT_PASSWORD,
    clientId: process.env.IOT_CLIENTID,
    cert: pemFile
};

const client = mqtt.connect(options);

function publish(client) {
    // create the json object
    const data = {
        "firefighter_id": process.env.IOT_FIREFIGHTER_ID,
        "device_id": process.env.IOT_DEVICE_ID,
        "device_battery_level": (Math.random() * (0.00 - 100.00) + 0.0200).toFixed(2),
        "temperature": (Math.random() * 50).toFixed(2),
        "humidity": (Math.random() * 100).toFixed(2),
        "carbon_monoxide": (Math.random() * 150).toFixed(2),
        "nitrogen_dioxide": (Math.random() * 10).toFixed(2),
        "formaldehyde": (Math.random() * 10).toFixed(2),
        "acrolein": (Math.random() * 10).toFixed(2),
        "benzene": (Math.random() * 10).toFixed(2),
        "device_timestamp": getUTCTime()
    }

    const topic = `iot-2/evt/myevt/fmt/json`;

    client.publish(topic, JSON.stringify(data), (err) => {
        if (err) {
            logger.error(err);
        } else {
            console.log(`\n\n\nfinished publishing data: ${JSON.stringify(data)}`);
        }
    });
}

function getUTCTime() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var hours = dateObj.getUTCHours();
    var minutes = dateObj.getUTCMinutes();
    var seconds = dateObj.getUTCSeconds();

    var newdate = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return newdate;
}

console.log(`connecting with clientid: ${options.clientId}`);

const timeMins = 1;
client.on('connect', function (err) {
    logger.info('connnected!');
    publish(client);
    time = setInterval(function () {
        publish(client);
    }, timeMins * 300000);

});


client.on('message', function (topic, message) {
    logger.info('\n\n\n\n');
    logger.info(message.toString())
})

client.on('close', function (err) {
    if (err) { logger.info(err) };
    logger.info('connection closed');
})

client.on('disconnect', function (err) {
    logger.info('connection disconnected');
})


client.on('error', function (err) {
    console.log(err);
    logger.info('connection error');
    logger.info(err);
})

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}