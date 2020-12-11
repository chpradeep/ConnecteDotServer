const mqtt = require('mqtt');
const logger = require('../config/logger');
const { dh } = require('../config/config');

const authdata = {
  action: 'authenticate',
  token: dh.token,
  requestId: '12345',
};

const client = mqtt.connect(dh.mqttUrl);

client.on('message', (topic, message) => {
  const messageObject = JSON.parse(message.toString());
  if (messageObject.requestId === '12345') {
    if (messageObject.status === 'success') {
      logger.info('loggedin');
    }
  }
});

client.on('connect', () => {
  client.subscribe(`dh/response/authenticate@${client.options.clientId}`);
  logger.info(`mqtt client connected with id ${client.options.clientId}`);
  client.publish('dh/request', JSON.stringify(authdata));
});

client.on('error', () => {
  logger.info('failed to connect to dhmqtt ');
});
