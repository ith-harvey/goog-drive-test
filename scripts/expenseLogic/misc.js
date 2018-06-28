function checkIfUserIsSetup(robot, userId) {
  // input validation function

  if (robot.brain.get(userId) === null) {
    //user has not started the setup process.
    return true

  } else if (robot.brain.get(userId).team === undefined) {
    //user has not provided a team.
    return true

  } else if (robot.brain.get(userId).office === undefined) {
    //user has not provided office.
    return true
  }

  return false // user is already setup for expensing
}

const objectToLowerCase = (expenseObj) => {
  for (let k in expenseObj) {
    expenseObj[k] = expenseObj[k].toLowerCase()
  }
  return expenseObj
}

module.exports = {
  checkIfUserIsSetup,
  objectToLowerCase
}
