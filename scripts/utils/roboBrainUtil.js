const rp = require('request-promise')

const newUserCheckAndCreate = (robot, userId) => {
  if (robot.brain.get(userId))
    return

  return createUser(robot, userId)
}

const createUser = (robot, userId) => robot.brain.set(userId, {})

const getAuthToken = () => {
  const options = {
    method: 'POST',
    uri: `http://${process.env.ROCKETCHAT_URL}/api/v1/login`,
    headers: {
        'User-Agent': 'Request-Promise'
    },
    body: {
      username: process.env.ROCKETCHAT_USER,
      password: process.env.ROCKETCHAT_PASSWORD
    },
    json: true,
  }
  return rp(options)
}

const sendUserMessage = (message, robot, userName) => {
  console.log('msg', message);

  robot.adapter.chatdriver.getDirectMessageRoomId(userName).then(response => {
    robot.adapter.chatdriver.sendMessageByRoomId(message, response.rid)
  })
}

module.exports = {
  newUserCheckAndCreate,
  getAuthToken,
  sendUserMessage
}
