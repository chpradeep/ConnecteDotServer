const mqtt = require('mqtt');
const logger = require('../config/logger');

const client = mqtt.connect('mqtt://10.208.34.200:1883');
client.on('connect', () => {
  logger.info(client.options.clientId);
});

client.on('error', () => {
  logger.info('failed to connect to dhmqtt ');
});
