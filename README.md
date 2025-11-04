# Pyrrha MQTT client

[![License](https://img.shields.io/badge/License-Apache2-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Slack](https://img.shields.io/static/v1?label=Slack&message=%23prometeo-pyrrha&color=blue)](https://callforcode.org/slack)

This repository contains the [Pyrrha](https://github.com/Pyrrha-Platform/Pyrrha) solution MQTT
client that receives [device](https://github.com/Pyrrha-Platform/Pyrrha-Firmware) readings from the
[mobile app](https://github.com/Pyrrha-Platform/Pyrrha-Mobile-App) via the
[IBM IoT Platform](https://cloud.ibm.com/catalog/services/internet-of-things-platform). The service
then stores the data in the [database](https://github.com/Pyrrha-Platform/Pyrrha-Database) and also
sends it to the [WebSocket service](https://github.com/Pyrrha-Platform/Pyrrha-WebSocket-Server).

## Technologies used

1. [Node.js](https://nodejs.org/en/)
1. [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. [WebSocket Server](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)

## Prerequisites

You need to have the following services running to use the MQTT client. The IoT platform runs on IBM
Cloud. The database and websocket services can be run locally using Docker.

1. [Pyrrha MQTT Server (VerneMQ)](https://github.com/Pyrrha-Platform/Pyrrha-Deployment-Configurations/blob/main/DOCKER_COMPOSE.md#pyrrha-mqttserver)
1. [Pyrrha Database Service](https://github.com/Pyrrha-Platform/Pyrrha-Database)
1. [Pyrrha Websocket Server](https://github.com/Pyrrha-Platform/Pyrrha-WebSocket-Server)

## MQTT Server integration

In order for the MQTT Client to communicate with the MQTT broker, information for the client should
be added to VerneMQ's database table. The instructions for this can be found
[here](https://github.com/Pyrrha-Platform/Pyrrha-Deployment-Configurations/blob/main/DOCKER_COMPOSE.md#pyrrha-mqttclient).

## Run locally with Node.js

You can run this solution locally as follows:

1. Copy `.env.sample` to `.env` and fill out the values. The following values can be obtained from
   the IBM IoT platform as explained under the `Connect an application to IBM Watson IoT Platform`
   section [here](https://github.com/Pyrrha-Platform/Pyrrha/blob/main/WATSON_IOT_SETUP.md). The
   `IOT_CLIENTID` needs to be of the format `a:{orgId}:{application_name}`. The `orgId` can be
   obtained from the IoT platform. The `application_name` can be any string.

   ```sh
    IOT_HOST=
    IOT_TOPIC=
    IOT_PROTOCOL=
    IOT_USERNAME=
    IOT_PASSWORD=
    IOT_SECURE_PORT=
    IOT_PORT=
    IOT_CLIENTID=
    IOT_PEM=
   ```

   The following values are used to store data in the database:

   ```sh
   MARIADB_HOST=
   MARIADB_USERNAME=
   MARIADB_PASSWORD=
   ```

   The following variables are used to send data to the WebSocket Server.

   ```sh
   WS_HOST=
   WS_PORT=
   ```

1. Install the dependencies

   ```sh
   npm install
   ```

1. Start the server

   ```sh
   npm start
   ```

## Run locally with Docker

1. Build the image

   ```sh
   docker build . -t mqttclient
   ```

1. Run the image and pass the .env file as environment variables

   ```sh
   docker run --env-file .env mqttclient
   ```

   You do not need to expose any port.

1. You should see the application logs

   ```sh
   > mqtt-client@1.0.0 start /home/upkarlidder/Documents/upkar-code/call-for-code/pyrrah/Pyrrha-MQTT-Client
   > node mqttclient.js

   Reading pem file from: messaging.pem
   Connecting to p0g2ka.messaging.internetofthings.ibmcloud.com as client id: a:p0g2ka:my_app-1626211745471
   creating mariadb connection pool on: localhost
   finished creating mariadb coonection pool
   2021-07-13 14:29:05 debug [mqttclient.js]: connecting to IoT platform ...
   2021-07-13 14:29:06 debug [mqttclient.js]: !!successfully connected to server p0g2ka.messaging.internetofthings.ibmcloud.com
   2021-07-13 14:29:06 debug [mqttclient.js]: !!successfully subscribed to topic: iot-2/type/+/id/+/evt/+/fmt/+
   ```

## Run on Kubernetes

You can run this application on Kubernetes using the charts provided in the `chart` directory. The
repository also provides a skaffold.yaml file that enables quick building and pushing for faster
development. Read more about Skaffold [here](https://skaffold.dev/). There are two profiles
provided, `test` and `default`. To run the solution on the `test` namespace use:
`skaffold dev -p test`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process
for submitting Pyrrha pull requests.

## License

This project is licensed under the Apache 2 License - see the [LICENSE](LICENSE) file for details.
