const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { dhServices, userService } = require('../services');

/*
 * Developer account creation
 */
const createDeveloper = catchAsync((req, res) => {
  dhServices.createDHUser(req.body, function (data, response) {
    res.status(response.statusCode).send(data);
  });
});

/*
 * Developer Login
 */
const loginDeveloper = catchAsync((req, res) => {
  dhServices.loginDHUser(req.body, function (data, response) {
    res.status(response.statusCode).send(data);
  });
});

/*
 * Developer Change password
 */
const updateDeveloper = catchAsync((req, res) => {
  dhServices.updateDHUser(req.headers.authorization, req.body, function (data, response) {
    res.status(response.statusCode).send(data);
  });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createDeveloper,
  loginDeveloper,
  updateDeveloper,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
