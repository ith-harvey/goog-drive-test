const {spaceSplit, newLineSplit} = require('./utils.js')

module.exports = (robot) => {

  robot.receiveMiddleware((context, next, done) => {

    if (context.response.message.user.roomType ==='p' || context.response.message.user.roomType ==='d' ) {
      //if the room is Private or a DM pass next()
      next(done)
    } else {

      if (newLineSplit(context.response.message.text)[0] === '@doge tikz direct') {
        next(done)

      } else if (spaceSplit(context.response.message.text)[0] === '@doge') {
        context.response.reply('Hey there! That command is only availabile in a DM with me or in a private channel that I\'m included in. Try running `@doge help` in a DM with me to see a list of my functionalities.')
      }

    }
  })
}
