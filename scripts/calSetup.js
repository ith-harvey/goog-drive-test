const rp = require('request-promise')


//cal setup script
module.exports = (robot) => {
let awaitingUrl = false, awaitingWorkHours = false, calSetupDone = false


    robot.respond(/(cal setup)/i, function(msg) {
      msg.reply("Woof woof! Welcome to the cal setup wizard. \n \n Please enter your fastmail account’s free/busy calendar URL so I can share your availability upon request.\n\n (To access your free/busy calendar URL visit www.fastmail.com/calendar/ while logged in.\n Select the calendar dropdown > settings > calendars > Edit&share > check free/busy information > copy the url > hit save up top > paste URL in chat and hit enter)")
     awaitingUrl = true
    })

    robot.hear(/^(http|https)/i ,function(msg) {
       if (awaitingUrl) {
	  robot.brain.set(msg.message.user.id, {busyCalUrl: msg.message.text})
	  msg.reply("Woof woof! URL was received... \n \n Excellent, now I need to know your preferred working hours when you will be available for meetings. \n \n Please enter them in the following format: <hr:min>-<hr:min> (e.g. 9:00-5:00)")
          awaitingUrl = false
          awaitingWorkHours = true
      }
    })

   robot.hear(/([0-9]|[0-9][0-9]):[0-5][0-9]-([0-9]|[0-9][0-9]):[0-5][0-9]/i ,function(msg) {
     if (awaitingWorkHours) {
         robot.brain.set(msg.message.user.id, {busyCalUrl: robot.brain.get(msg.message.user.id).busyCalUrl, workHrs: msg.message.text})
         msg.reply("Woof woof! Thank you for completing the cal setup wizard!, you may now use the `@doge cal suggest` feature.")
         awaitingWorkHours = false
         calSetupDone = true
     }
   })


   robot.respond(/(cal suggest)/i ,function(msg) {
     if (!calSetupDone) {
	msg.reply("Woof woof! To use the `@doge cal suggest` feature you must first go through the setup wizard. Do so by typing the command `@doge cal setup`.")
     } else {
         rp(robot.brain.get(msg.message.user.id).busyCalUrl)
         .then((response)=> {
           msg.reply("in response")
           msg.reply(response)
         }).catch((err)=> {
           msg.reply("in err")
           msg.reply(err)
         })
       }
   })
}

