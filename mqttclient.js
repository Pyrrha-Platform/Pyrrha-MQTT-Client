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

console.log(`trying to connect to the server: ${process.env.IOT_HOST}`);

client.on('connect', function (packet) {
    client.subscribe(process.env.IOT_TOPIC, function (err, packet) {
        if (err) {
            console.log(`unable to connect to server: ${process.env.IOT_HOST}`);
            console.log(err);
        } else {
            console.log(`successfully connected to server ${process.env.IOT_HOST} on topic ${process.env.IOT_TOPIC}`);
        }
    })
})

client.on('message', function (topic, message) {
    console.log(`recieved message: ${message.toString()}`);

})

client.on('error', function (err) {
    console.log(err);
})

client.on('close', function () {
    console.log('connection closed');
})

// function insertDatabase(data) {
//     const mariadb = require('mariadb');
//     const pool = mariadb.createPool({ host: "172.30.208.213", user: process.env.DB_USER, connectionLimit: 5 });
//     pool.getConnection()

// }