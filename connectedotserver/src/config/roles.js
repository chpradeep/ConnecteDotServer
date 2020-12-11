const roles = ['user', 'admin', 'developer', 'master'];

const roleRights = new Map();
roleRights.set(roles[0], []);
roleRights.set(roles[1], ['getUsers', 'manageUsers']);
roleRights.set(roles[2], ['developer']);
roleRights.set(roles[3], ['manageDevs']);

module.exports = {
  roles,
  roleRights,
};
