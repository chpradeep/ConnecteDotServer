const { Client } = require('node-rest-client');
const logger = require('../config/logger');
const configs = require('../config/config');

const Plans = {};
const { dh } = configs;
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${dh.token}`,
};
const client = new Client();

client.registerMethod('login', `${dh.url}/token`, 'POST');
client.registerMethod('info', `${dh.url}/info`, 'GET');
client.registerMethod('createnetwork', `${dh.url}/network`, 'POST');
client.registerMethod('registerDevice', `${dh.url}/device/\${id}`, 'PUT');
client.registerMethod('listDevices', `${dh.url}/device`, 'GET');
client.registerMethod('unregisterDevice', `${dh.url}/device/\${id}`, 'DELETE');
client.registerMethod('deletenetwork', `${dh.url}/network/\${id}`, 'DELETE');
client.registerMethod('addDeveloper', `${dh.url}/user/`, 'POST');

function createDeveloper(developer, next) {
  const data = { ...developer, role: 1, status: 2, data: {} };
  client.methods.addDeveloper({ data, headers }, function (result, res) {
    next(result, res);
  });
}

function auth(next) {
  const req = client.methods.login(
    { data: dh.auth, headers: { 'Content-Type': 'application/json' } },
    function (data, response) {
      if (response.statusCode === 201) {
        next({
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.accessToken}`,
          },
        });
      } else if (response.statusCode === 404) {
        logger.error('IoT middleware username and password not correct. Kindly update env file ', dh.auth);
      } else {
        logger.error('Unexprected eroor with iot middleware');
      }
    }
  );
  req.on('error', (err) => {
    return { error: 401, message: err };
  });
}

function createDevice(args, deviceId, device) {
  client.methods.registerDevice({ ...args, data: device, path: { id: deviceId } }, function (data, response) {
    logger.info(data, response.statusCode);
  });
}

function deleteMyNetwork(args, networkId) {
  logger.info(networkId, ' deleting');
  const req = client.methods.deletenetwork({ ...args, path: { id: networkId } }, function (data, response) {
    logger.info(data);
    logger.info(response);
  });
  req.on('error', (err) => {
    logger.info(err);
    return { error: 401, message: err };
  });
}

async function deleteDevicesAndNetwork(args, list, networkId) {
  list.forEach((ele, index) => {
    client.methods.unregisterDevice({ ...args, path: { id: ele.id } }, function () {
      if (list.length === index + 1) {
        const { path, ...rest } = args;
        deleteMyNetwork(rest, networkId);
      }
    });
  });
}

function getDevicesOfMyNetwork(args, networkId, next) {
  client.methods.listDevices({ ...args, parameters: { networkId } }, function (data, response) {
    const { parameters, ...rest } = args;
    next(rest, data);
    logger.info(response.statusCode);
  });
}

function createnetwork(args, input, next) {
  client.methods.createnetwork({ ...args, data: { name: input.museumid } }, function (data, response) {
    if (data.id) next(args, data.id);
    logger.info(response.statusCode);
  });
}

function subscribe(input, next) {
  auth((args) => {
    createnetwork(args, input, (nwargs, networkId) => {
      Plans[input.plan].forEach((ele) => {
        for (let i = 0; i < ele.count; i += 1) {
          const device = {
            name: `${input.museum.toUpperCase()}_${ele.name}_${i + 1}`,
            data: { museum: input.museum, admin: input.admin },
            networkId,
            deviceTypeId: ele.DeviceTypeId,
            isBlocked: true,
          };
          const deviceId = `${input.museum}-${ele.DeviceTypeId}-${i + 1}`;
          createDevice(nwargs, deviceId, device);
        }
      });
      next(networkId);
    });
  });
}

function unsubscribe(networkId) {
  auth((args) => {
    getDevicesOfMyNetwork(args, networkId, (nwargs, list) => {
      deleteDevicesAndNetwork(nwargs, list, networkId);
    });
  });
}

function getMyDevices(networkId, next) {
  auth((args) => {
    getDevicesOfMyNetwork(args, networkId, (nwargs, list) => {
      logger.log(list.length);
      const newlist = { AACO: {}, IME: {}, TAGS: {}, SCAN: {} };
      list.forEach((ele, index) => {
        if (ele.deviceTypeId === 9) {
          newlist.AACO[ele.id] = ele;
        } else if (ele.deviceTypeId === 10) {
          newlist.IME[ele.id] = ele;
        } else if (ele.deviceTypeId === 11) {
          newlist.SCAN[ele.id] = ele;
        } else if (ele.deviceTypeId === 12) {
          newlist.TAGS[ele.id] = ele;
        }
        if (list.length === index + 1) {
          next(null, newlist);
        }
      });
    });
  });
}

function updateAllDeviceName(networkId, newname) {
  auth((args) => {
    getDevicesOfMyNetwork(args, networkId, (nwargs, list) => {
      list.forEach((ele) => {
        const res = ele.name.split('_');
        createDevice(nwargs, ele.id, {
          ...ele,
          name: `${newname.toUpperCase()}_${res[1]}_${res[2]}`,
          data: { museum: newname },
        });
      });
    });
  });
}

client.methods.info(function (data, response) {
  logger.info(data.webSocketServerUrl);
  logger.info(response.statusCode);
});

client.on('error', function (err) {
  logger.error('Something went wrong on the client', err);
});

auth((result) => {
  logger.info(result);
});

module.exports = { subscribe, unsubscribe, updateAllDeviceName, getMyDevices, createDeveloper };
