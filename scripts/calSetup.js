
//cal setup script
module.exports = (robot) => {

  robot.respond(/(cal setup)/i, function(msg) {
    msg.reply("Woof woof! Welcome to the cal setup wizard.")
    msg.reply("Please enter your fastmail account’s free/busy calendar URL so I can share your availability upon request.")
  })

}
