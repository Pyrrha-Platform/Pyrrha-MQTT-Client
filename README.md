# Pyrrha MQTT client

This repository contains the [Pyrrha](https://github.com/Code-and-Response/Prometeo) solution MQTT client that sends [device](https://github.com/Code-and-Response/Prometeo-Firmware) readings from the [mobile app](https://github.com/Code-and-Response/Prometeo-Mobile-App).

[![License](https://img.shields.io/badge/License-Apache2-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0) [![Slack](https://img.shields.io/badge/Join-Slack-blue)](https://callforcode.org/slack)

## Setting up the solution

* To come

Create pem config file
```
kubectl create configmap ca-pemstore --from-file messaging.pem 
```

add to deployment.yaml
```
volume and volumemounts
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting Pyrrha pull requests.

## License

This project is licensed under the Apache 2 License - see the [LICENSE](LICENSE) file for details.
