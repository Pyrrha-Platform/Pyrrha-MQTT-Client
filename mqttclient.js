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

console.log('hey there!');

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
    console.log('connection closed!');
})

function insertDatabase(data) {
    const mariadb = require('mariadb');
    const pool = mariadb.createPool({ host: "172.21.34.15", user: "root", connectionLimit: 5 });
    pool.getConnection()

    if (data.deviceId.toLowerCase().includes("duck")){
        // Duck payload is in format '26.30/43.00/18.58' (without quotes)
        data = msg.payload.Payload.split('/');
        temperature = parseFloat(data[0]);
        humidity = parseFloat(data[1]);
        co = parseFloat(data[2]);
    } else {
        temperature = msg.payload.Temperature;
        humidity = msg.payload.Humidity;
        co = msg.payload.CO;
    }

    // store in mariadb
}

// insertDatabase({});