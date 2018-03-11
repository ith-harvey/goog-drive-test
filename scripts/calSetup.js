const momentTZ = require('moment-timezone');
const moment = require('moment');
const rp = require('request-promise')
const ical2json = require('ical2json')

//cal setup script



    function getTodaysDate(currentTimeZone) {
      return moment.utc()
    }

  function formatDate(icalStr) {
    var strYear = icalStr.substr(0,4);
    var strMonth = parseInt(icalStr.substr(4,2),10) - 1;
    var strDay = icalStr.substr(6,2);
    var strHour = icalStr.substr(9,2);
    var strMin = icalStr.substr(11,2);
    var strSec = icalStr.substr(13,2);
    let dateNeedsFormat = new Date(strYear,strMonth, strDay, strHour, strMin, strSec)
    return  moment(dateNeedsFormat, "YYYY-MM-DD HH:mm:ss Z")
  }

  function wrkHrsParse(wrkHrs, timeZone) {
	console.log('wrkHours coming in', wrkHrs)
	console.log('things', momentTZ.tz(timeZone).utcOffset())

	let start = {
	  Hrs: wrkHrs.slice(0,2),
	  Min: wrkHrs.slice(3,5)
        }

	let end = {
          Hrs: wrkHrs.slice(8,10),
          Min: wrkHrs.slice(11,13)
        }


	console.log('start hours', start.Min)
	console.log('end hours', end.Min)	

    return {
      start: moment(wrkHrs.slice(0, wrkHrs.indexOf('-')),'hh:mm a').tz(timeZone).hours(start.Hrs).minutes(start.Min).utc(),
      end: moment(wrkHrs.slice(wrkHrs.indexOf('-') + 1 ,wrkHrs.length),'hh:mm A').hours(end.Hrs).minutes(end.Min).utc()
    }
   }


  //
  //
  //
  //
  function findAvailabilityOverTime (dateArr, wrkHrs, dateAvailRequested, timeWindow) {
  	console.log('dateArr', dateArr)
  	console.log('wrkHrs', wrkHrs)
  	console.log('dateAvail', dateAvailRequested)
  	console.log('timeWindow', timeWindow)

     if (timeWindow === 'day') {

        dateArr.forEach(date => {

		console.log('date1',formatDate(date.DTSTART).date())
		console.log('date2', dateAvailRequested.date())
		console.log('wrkHrs',wrkHrs)

	 if (formatDate(date.DTSTART).date() === dateAvailRequested.date()) {

	   console.log('date in while', formatDate(date.DTSTART).date())

         }

	})
     }
  }




module.exports = (robot) => {
let awaitingUrl = false, awaitingWorkHours = false, calSetupDone = false


    robot.respond(/(cal setup)/i, function(msg) {
      msg.reply("Woof woof! Welcome to the cal setup wizard. \n \n Please enter your fastmail account’s free/busy calendar URL so I can share your availability upon request.\n\n (To access your free/busy calendar URL visit www.fastmail.com/calendar/ while logged in.\n Select the calendar dropdown > settings > calendars > Edit&share > check free/busy information > copy the url > hit save up top > paste URL in chat and hit enter)")
     awaitingUrl = true
    })

    robot.hear(/^(http|https)/i ,function(msg) {
       if (awaitingUrl) {
	  robot.brain.set(msg.message.user.id, {busyCalUrl: msg.message.text})
	  msg.reply("Woof woof! URL was received... \n \n Excellent, now I need to know your preferred working hours when you will be available for meetings. \n \n Please enter them in the following format: <hr:min(am || pm)>-<hr:min(am || pm)> (e.g. 9:00am-5:00)")
          awaitingUrl = false
          awaitingWorkHours = true
      }
    })

robot.hear(/([0-9]|[0-9][0-9]):[0-5][0-9](a|p)m-([0-9]|[0-9][0-9]):[0-5][0-9](a|p)m/i, function(msg) {
     if (awaitingWorkHours) {
		console.log('in save', robot.brain.get(msg.message.user.id))
         robot.brain.set(msg.message.user.id, {busyCalUrl: robot.brain.get(msg.message.user.id).busyCalUrl, workHrs: msg.message.text})
	console.log('in save', robot.brain.get(msg.message.user.id))
         msg.reply("Woof woof! Thank you for completing the cal setup wizard!, you may now use the `@doge cal suggest` feature.")
         awaitingWorkHours = false
         calSetupDone = true
     }
   })


   robot.respond(/(cal suggest)/i ,function(msg) {
     //if (!calSetupDone) {
	//msg.reply("Woof woof! To use the `@doge cal suggest` feature you must first go through the setup wizard. Do so by typing the command `@doge cal setup`.")
     //} else {
         rp(robot.brain.get(msg.message.user.id).busyCalUrl)
         .then((response)=> {
           let output = ical2json.convert(response);

           let data = {
             dateArr : output.VCALENDAR[0].VEVENT,
	     timeZone : output.VCALENDAR[0]["X-WR-TIMEZONE"]
           }

           msg.reply("YOUR TIMEZONE: " + data.timeZone)

	   // takes dates/day you want to find availability for && array of dates

	 let wrkHrsInUTC =  wrkHrsParse(robot.brain.get(msg.message.user.id).workHrs, data.timeZone)

	console.log('start',wrkHrsInUTC.start)
	console.log('end',wrkHrsInUTC.end)	

           findAvailabilityOverTime(data.dateArr, wrkHrsInUTC, getTodaysDate(), 'day')

         }).catch((err)=> {
           msg.reply("in err")
		console.log('ERROR: ',err)
           msg.reply(err)
         })
       //}
   })
}

