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

  function localTime(time, timeZone) {
	let timeClone = moment(time)
	return timeClone.tz(timeZone).format("DD-MM-YYYY hh:mm:ss")
  }

  function wrkHrsParse(wrkHrs, timeZone) {
	let start = {
	  Hrs: wrkHrs.slice(0,2),
	  Min: wrkHrs.slice(3,5)
        }

	let end = {
          Hrs: wrkHrs.slice(8,10),
          Min: wrkHrs.slice(11,13)
        }

    return {
      start: moment(wrkHrs.slice(0, wrkHrs.indexOf('-')),'HH:mm').tz(timeZone).hours(start.Hrs).minutes(start.Min).utc(),
      end: moment(wrkHrs.slice(wrkHrs.indexOf('-') + 1 , wrkHrs.length),'HH:mm').tz(timeZone).hours(end.Hrs).minutes(end.Min).utc(),
      timeZone: timeZone
    }
   }


  function  minutesOfDay(m) {
    return m.minutes() + m.hours() * 60;
  }

  class RecordAvailability {
	constructor() {
		this.lastEventEndTime = 'undefined'
        	this.suggestions = []
 	}

	set (wrkHrs, eventEnd, eventStart) {
		console.log('set is running')

		if (eventStart === undefined) { // event started before working hours
			this.lastEventEndTime = eventEnd
        	        return
        	}

		if (this.lastEventEndTime === 'undefined') {   // first event that day && there is gap time between wrkHrs start and eventStart
                       this.lastEventEndTime = wrkHrs.start
                }


		this.createAvailSuggestions(wrkHrs, eventStart)
		this.lastEventEndTime = eventEnd 
        }

	setUntilEndOfWorkDay(wrkHrs) {
		this.createAvailSuggestions(wrkHrs, wrkHrs.end)
	}

	createAvailSuggestions(wrkHrs, eventStart) {

		let availTime =  moment.duration(eventStart.diff(this.lastEventEndTime))

		availTime = availTime.asMinutes()

       		 let suggestionStartPoint = this.lastEventEndTime


       		for (let i = 1; i <= (availTime / 60); i++) { // only create 60 min suggestions

               		this.suggestions.push( {
                        	start: `${wrkHrs.timeZone}: ${localTime(suggestionStartPoint, wrkHrs.timeZone)} UTC: ${suggestionStartPoint}`,
                       		 end: `${wrkHrs.timeZone}: ${localTime(moment(suggestionStartPoint).add(1,'hours'),wrkHrs.timeZone)} UTC: ${moment(suggestionStartPoint).add(1,'hours')}`
               		 })
                  suggestionStartPoint = moment(suggestionStartPoint).add(1, 'hours')

          	 }
	}


	get() {
                return this.suggestions // function call with no args -> just return suggestions
	}

  }

  //
  //
  //
  //

  function findAvailabilityOverTime (eventArr, wrkHrs, dateAvailRequested, timeWindow, Availability) {

     if (timeWindow === 'day') {

        eventArr.forEach(date => { // loop over event dates


	 if (formatDate(date.DTSTART).date() === dateAvailRequested.date()) { // events that happen on selected day

		if (minutesOfDay(formatDate(date.DTSTART)) <= minutesOfDay(wrkHrs.start)) { // event start happens before || same time as wrkhrs start

			if (minutesOfDay(formatDate(date.DTEND)) <= minutesOfDay(wrkHrs.start)) { // event end happens before || same time as wrkhrs start
			// the entire event happens before working hours
			// do nothing -> go to next event
			} else {
				//event ends during working hours
				Availability.set(wrkHrs, formatDate(date.DTEND))
			}
		} else { // event start happens after wrkhrs start

			if (minutesOfDay(formatDate(date.DTSTART)) > minutesOfDay(wrkHrs.end)) { // event start happens before  wrkhrs end
				Availability.set(wrkHrs, formatDate(date.DTEND), formatDate(date.DTSTART)) // 2 Args (record whole chunk of availability from start || last event end - end)
                        } else {
			// the entire event happens after working hours
                        // do nothing -> go to next event

                        }

		}

         } 

	})
	Availability.setUntilEndOfWorkDay(wrkHrs)
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

		let dayRequested = getTodaysDate()

           msg.reply("Your current Timezone (set at fastmail.com): " + data.timeZone)

	   // takes dates/day you want to find availability for && array of dates

	   let wrkHrsInUTC =  wrkHrsParse(robot.brain.get(msg.message.user.id).workHrs, data.timeZone)

	   let Availability = new RecordAvailability()
           findAvailabilityOverTime(data.dateArr, wrkHrsInUTC, dayRequested, 'day', Availability)

		let suggestString = ''
		Availability.get().forEach((suggestion, index) => {

		suggestString += `${index+1}) ${suggestion.start} \n ${suggestion.end} \n \n`

		})

	msg.reply(`Woof woof! Here are some meeting suggestions for ${dayRequested.format('LL')}:  \n \n` + suggestString)
         }).catch((err)=> {
           msg.reply("in err")
		console.log('ERROR: ',err)
           msg.reply(err)
         })
       //}
   })
}

