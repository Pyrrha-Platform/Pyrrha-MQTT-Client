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

client.on('message', function (topic, msg) {

    msg = JSON.parse(msg.toString());

    if (msg.id == "duck") {
        console.log('received a duck!')
        //convert insertdatabase into a promise so main program is not waiting
        insertDatabase(msg);
    }

})

client.on('error', function (err) {
    console.log(err);
})

client.on('close', function () {
    console.log('connection closed!');
})

console.log('connecting to mariadb');
const mariadb = require('mariadb');
const { type } = require('os');
const pool = mariadb.createPool({
    host: process.env.MARIADB_HOST,
    user: process.env.MARIADB_USERNAME,
    password: process.env.MARIADB_PASSWORD,
    database: 'prometeo',
    connectionLimit: 5
});

function insertDatabase(data) {
    console.log('inside insertDatabase function');
    console.log(data);
    pool.getConnection()
        .then(conn => {
            console.log('successfully connected to the database service!');
            conn.query("INSERT INTO metrics VALUES (?, ?, ?, ?, ?, ?)", [Math.floor(Math.random() * Math.floor(1000)), "duck", "1581346399955", data.temp, data.humidity, data.CO])
                .then((res) => {
                    console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
                    conn.end();
                }).catch(err => {
                    //handle error
                    console.log(err);
                    conn.end();
                })
        }).catch(err => {
            console.log('not connected');
            console.log(err);
        });
}
