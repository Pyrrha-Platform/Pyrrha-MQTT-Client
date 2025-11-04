const logger = require('./logger');
const mqtt = require('mqtt');
require('dotenv').config();

// TODO: add code to check for secure connection

const clientID = process.env.IOT_CLIENTID;
console.log(`Connecting to ${process.env.IOT_HOST} as client id: ${clientID}`);

const mqttClient = mqtt.connect({
  host: process.env.IOT_HOST,
  protocol: process.env.IOT_PROTOCOL,
  port: process.env.IOT_SECURE_PORT,
  clientId: clientID,
  username: process.env.IOT_USERNAME,
  password: process.env.IOT_PASSWORD,
});

const pool = setupMariaDB();
let connection;

const asyncFunction = function () {
  try {
    logger.debug(`!!successfully connected to server ${process.env.IOT_HOST}`);
    //need to add error checking on the topic itself. Handle case where topic is not present.
    mqttClient.subscribe(process.env.IOT_TOPIC, { qos: 2 }, function (_err) {
      logger.debug(
        `!!successfully subscribed to topic: ${process.env.IOT_TOPIC}`
      );
    });

    mqttClient.on('message', (topics, payload) => {
      const msg = JSON.parse(payload.toString());
      logger.debug(
        `\n\n\n\ngot a message: ${JSON.stringify(
          msg.firefighter_id
        )}-${JSON.stringify(msg.device_id)}`
      );
      logger.debug(JSON.stringify(msg));

      // Parse device ID to numeric format for consistency between WebSocket and Database
      // but preserve the original device name for display purposes
      if (
        typeof msg.device_id === 'string' &&
        msg.device_id.includes('Prometeo:')
      ) {
        const originalDeviceName = msg.device_id;
        const lastDigits = msg.device_id.split(':').pop();
        msg.device_id = parseInt(lastDigits, 10);
        msg.device_name = originalDeviceName;
        logger.debug(
          `Parsed device_id to numeric: ${msg.device_id}, preserved device_name: ${msg.device_name}`
        );
      }

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
};

logger.debug('connecting to IoT platform ...');
mqttClient.on('connect', asyncFunction);

mqttClient.on('close', function (err) {
  if (err) {
    logger.error(err);
  } else {
    logger.debug('connection closed');
  }
});

mqttClient.on('disconnect', function (err) {
  if (err) {
    logger.error(err);
  } else {
    logger.debug('connection disconnected');
  }
});

mqttClient.on('error', function (err) {
  if (err) {
    logger.error(err);
  } else {
    logger.debug('connection error');
  }
});

function setupMariaDB() {
  console.log(
    `creating mariadb connection pool on: ${process.env.MARIADB_HOST}`
  );
  const mariadb = require('mariadb');
  const pool = mariadb.createPool({
    host: process.env.MARIADB_HOST,
    port: process.env.MARIADB_PORT,
    user: process.env.MARIADB_USERNAME,
    password: process.env.MARIADB_PASSWORD,
    database: process.env.MARIADB_DB,
    connectionLimit: 5,
  });
  if (pool && pool !== null) {
    console.log('finished creating mariadb coonection pool');
  } else {
    console.log('could not create connection to mariadb');
  }
  return pool;
}

function sendWSS(msg) {
  // add type or real
  msg.type = 'REAL';
  // take out this code from. We should not connect everytime a message comes in
  const WSS = require('websocket').client;
  const webSocketClient = new WSS();
  // webSocketClient.connect(`ws://${process.env.WS_HOST}:${process.env.WS_PORT}`, 'echo-protocol');
  webSocketClient.connect(
    `ws://${process.env.WS_HOST}:${process.env.WS_PORT}`,
    'echo-protocol'
  );

  webSocketClient.on('connectFailed', (error) => {
    logger.debug(
      `unable to connect to websocketserver: ${process.env.WS_HOST}:${process.env.WS_PORT}` +
        error.toString()
    );
  });

  webSocketClient.on('connect', (connection) => {
    logger.debug('WebSocket Client Connected');
    connection.on('error', function (error) {
      logger.debug('Connection Error: ' + error.toString());
    });
    connection.on('close', function () {
      logger.debug('echo-protocol Connection Closed');
    });

    if (connection.connected) {
      // var time = Math.floor(Date.now() / 1000);
      // var data = { "fields": ["Bombero", "Estado", "Timestamp", "Temp", "Humidity", "CO"], "values": [msg.id, "Verde", time, msg.temp, msg.humidity, msg.CO] };
      console.log('sending msg');
      connection.sendUTF(JSON.stringify(msg));

      // reason codes: https://tools.ietf.org/html/rfc6455#section-7.4.1
      connection.close('1000', 'Closing connection after sending message');
    }
  });
}

function _getUTCTimeStamp(timestamp) {
  // return the UTC value of the timestamp
  return timestamp.toUTCString();
}

function _setSecondsToZero(timeStamp) {
  timeStamp = new Date(timeStamp).setSeconds(0);
  return new Date(timeStamp).toISOString().substr(0, 19);
}

function insertDatabase(data) {
  logger.debug('insert to database');
  return pool
    .getConnection()
    .then((conn) => {
      logger.debug('successfully connected to the database service!');

      // check if the data already exists in mariadb before inserting the new data????
      // clau - was coming from node-red message._id. Changed to time + data.id

      //             +-----------------+----------+---------------+-------------+----------+------+
      // | clau            | DeviceID | timestamp     | temperature | humidity | CO   |
      // +-----------------+----------+---------------+-------------+----------+------+
      // | 10001e1c.9aa502 | 0006     | 1581342069129 |          26 |       40 |   16 |

      // assuming data.device_timestamp is already in UTC format
      const timestamp = new Date(data.device_timestamp).setSeconds(0);
      // logger.debug(`inserting timestamp: ${new Date(timestamp)}`);
      //     const device_timestamp =  new Date(data.device_timestamp).toISOString();
      //     const timestamp_mins = new Date(new Date(data.device_timestamp).setSeconds(0)).toISOString();

      // Device ID should already be numeric from MQTT message parsing
      const numericDeviceId = data.device_id;

      /*
                INSERT INTO prometeo.firefighter_device_log
(timestamp_mins, firefighter_id, device_id, device_battery_level, temperature, humidity, carbon_monoxide, nitrogen_dioxide, formaldehyde, acrolein, benzene, device_timestamp, device_status_led)
VALUES('', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
            */
      conn
        .query(
          'INSERT INTO firefighter_device_log (timestamp_mins, firefighter_id, device_id, device_battery_level, temperature, humidity, carbon_monoxide, nitrogen_dioxide, formaldehyde, acrolein, benzene, device_timestamp) VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?)',
          [
            new Date(timestamp),
            data.firefighter_id,
            numericDeviceId,
            data.device_battery_level,
            data.temperature,
            data.humidity,
            data.carbon_monoxide,
            data.nitrogen_dioxide,
            data.formaldehyde,
            data.acrolein,
            data.benzene,
            data.device_timestamp,
          ]
        )
        .then((res) => {
          // logger.debug(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
          conn.end();
          return res;
        })
        .catch((err) => {
          //handle error
          logger.error(err);
          conn.end();
          return err;
        });
    })
    .catch((err) => {
      logger.error(err);
    });
}
