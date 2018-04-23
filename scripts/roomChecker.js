

module.exports = (robot) => {
  robot.receiveMiddleware((context, next, done) => {

    if (context.response.message.user.roomType ==='p' || context.response.message.user.roomType ==='d' ) {
      //if the room is Private or a DM pass next()
      next(done)
    } else {
      context.response.reply('I\'m only availabile through DM or a private channel. Please try your request again in a direct message with me.')
    }
  })
}
