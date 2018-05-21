function checkIfUserIsSetup(robot, userId) {
  // input validation function
  console.log('running input val!',robot.brain.get(userId));

  if (robot.brain.get(userId) === null) {
    //user has not started the setup process.
    return true

  } else if (robot.brain.get(userId).team === undefined) {
    //user has not provided a URL.
    return true

  } else if (robot.brain.get(userId).office === undefined) {
    //user has not provided working hours.
    return true
  }

  return false // user is already setup for cal suggest feature
}

module.exports = {
  checkIfUserIsSetup
}
