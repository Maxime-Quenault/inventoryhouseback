var DataTypes = require("sequelize").DataTypes;
var _house_members = require("./house_members");
var _houses = require("./houses");
var _items = require("./items");
var _stock_categories = require("./stock_categories");
var _stock_movements = require("./stock_movements");
var _users = require("./users");

function initModels(sequelize) {
  var house_members = _house_members(sequelize, DataTypes);
  var houses = _houses(sequelize, DataTypes);
  var items = _items(sequelize, DataTypes);
  var stock_categories = _stock_categories(sequelize, DataTypes);
  var stock_movements = _stock_movements(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);


  return {
    house_members,
    houses,
    items,
    stock_categories,
    stock_movements,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
