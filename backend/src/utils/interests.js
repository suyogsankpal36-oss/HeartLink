const interests = require("../../../shared/interests.json");

module.exports = {
  INTERESTS: interests,
  INTEREST_SET: new Set(interests),
};
