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
    console.log(`recieved message: ${msg}`);
    console.log(typeof msg);
    console.log(`message.id: ${msg['"id"']}`);
    console.log(msg.temp);

    console.log(msg.toJSON())

    console.log(msg.toString())

    // for(var propName in message) {
    //     console.log('printing properties')
    //     console.log(propName,message[propName]);
    // }

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
    connectionLimit: 5
});

function insertDatabase(data) {
    console.log('inside insertDatabase function');
    console.log(data);
    pool.getConnection()
        .then(conn => {
            console.log('successfully connected to the service!');
            return conn.query("INSERT INTO metrics value (?, ?, ?, ?, ?, ?)", ["10012fc6.5a038", "duck", "1581346399955", data.temp, data.humidity, data.CO]);
            // conn.query("SHOW DATABASES").then(result => {
            //     console.log('listing databases');
            //     console.log(result);
            //     // msg.topic = "insert into metrics ( clau, SensorID ,timestamp ,temperature, humidity, CO ) values ('" + msg._msgid + "', '" + msg.deviceId + "', " + timestamp + ", " + temperature + ", " + humidity  + ", " +  co +")";
            //     return conn.query("INSERT INTO metrics value (?, ?, ?, ?, ?, ?)", ["10012fc6.5a038", "duck", "1581346399955", data.temp, data.humidity, data.CO]);
            // })

        }).then((res) => {
            console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
            conn.end();
        }).catch(err => {
            //handle error
            console.log(err);
            conn.end();
        })
    //   conn.query("SELECT 1 as val")
    //     .then((rows) => {
    //       console.log(rows); //[ {val: 1}, meta: ... ]
    //       //Table must have been created before 
    //       // " CREATE TABLE myTable (id int, val varchar(255)) "
    //       return conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
    //     })
    //     .then((res) => {
    //       console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
    //       conn.end();
    //     })
    //     .catch(err => {
    //       //handle error
    //       console.log(err); 
    //       conn.end();
    //     })
    // })
    // }).catch (err => {
    //     console.log('not connected');
    //     console.log(err);
    //     //not connected
    // });



    // const pool = mariadb.createPool({ host: "mariadb34-6957-47-slave.default.svc.cluster.local", user: "admin", connectionLimit: 5 });
    // const pool = mariadb.createPool({ host: "172.21.34.15", user: "admin", connectionLimit: 5 });

    // if (data.deviceId.toLowerCase().includes("duck")){
    //     // Duck payload is in format '26.30/43.00/18.58' (without quotes)
    //     data = msg.payload.Payload.split('/');
    //     temperature = parseFloat(data[0]);
    //     humidity = parseFloat(data[1]);
    //     co = parseFloat(data[2]);
    // } else {
    //     temperature = msg.payload.Temperature;
    //     humidity = msg.payload.Humidity;
    //     co = msg.payload.CO;
    // }

    // store in mariadb
}

// insertDatabase({});