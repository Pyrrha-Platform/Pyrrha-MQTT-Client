const fs = require('fs');
var mqtt = require('mqtt');
require('dotenv').config();
var pemFile = fs.readFileSync(process.env.IOT_PEM);

const client = mqtt.connect({
    host: process.env.IOT_HOST,
    protocol: process.env.IOT_PROTOCOL,
    username: process.env.IOT_USERNAME,
    port: process.env.IOT_SECURE_PORT,
    password: process.env.IOT_PASSWORD,
    clientId: process.env.IOT_CLIENTID,
    cert: pemFile
})

client.on('connect', function (packet) {
    client.subscribe(process.env.IOT_TOPIC, function (err, packet) {
        if (err) {
            console.log(err);
        }
    })
})

client.on('message', function (topic, message) {
    console.log(message.toString());
})

client.on('error', function (err) {
    console.log(err);
})

client.on('close', function () {
    console.log('connection closed');
})
