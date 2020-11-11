const logger = require('./logger');
const fs = require('fs');
var mqtt = require('mqtt');
require('dotenv').config();

logger.info(`!!successfully connected to server ${process.env.IOT_HOST}`);
var pemFile = fs.readFileSync(process.env.IOT_PEM);

var mqtt = require('mqtt')
const client = mqtt.connect({
    host: process.env.IOT_HOST,
    protocol: process.env.IOT_PROTOCOL,
    username: process.env.IOT_USERNAME, //hello world, how are you?
    port: process.env.IOT_SECURE_PORT,
    password: process.env.IOT_PASSWORD,
    clientId: process.env.IOT_CLIENTID + 'publish',
    cert: pemFile
});

client.on('connect', function () {
    logger.info('connnected!');

    var CronJob = require('cron').CronJob;
    var job = new CronJob('* * * * * *', function () {
        console.log(`Sending reading to IoT platform at ${new Date().toString()}`);

        // create the json object
        const data = {
            "firefighter_id": `FF-${getRandomInt(1, 50)}`,
            "device_id": `00${getRandomInt(100, 500)}`,
            "device_battery_level": (Math.random() * (0.00 - 100.00) + 0.0200).toFixed(2),
            "temperature": (Math.random() * 50).toFixed(2),
            "humidity": (Math.random() * 100).toFixed(2),
            "carbon_monoxide": (Math.random() * 150).toFixed(2),
            "nitrogen_dioxide": (Math.random() * 10).toFixed(2),
            "formaldehyde": (Math.random() * 10).toFixed(2),
            "acrolein": (Math.random() * 10).toFixed(2),
            "benzene": (Math.random() * 10).toFixed(2),
            "device_timestamp": new Date().toUTCString()
        }

        const topic = `iot-2/evt/event${getRandomInt(0, 100)}/fmt/json`;

        client.publish(topic, JSON.stringify(data), (err) => {
            if (err) {
                logger.error(err);
            } else {
                logger.info('finished publishing');
            }
        });

    }, null, true, 'America/Los_Angeles');
    job.start();

    // client.subscribe(process.env.IOT_TOPIC, { qos: 2 }, function (err) {
    //     if (!err) {
    //         logger.info(`subscribed to topic: ${process.env.IOT_TOPIC}`);
    //         // client.publish('presence', 'Hello mqtt')
    //     } else {
    //         logger.info(err);
    //     }
    // })
})

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
    logger.info('connection error');
    logger.info(err);
})

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}