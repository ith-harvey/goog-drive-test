

// @doge calendar setup and calendar feature script

/* First things first set your environment variables:
* export ROCKETCHAT_ROOM=''
* export LISTEN_ON_ALL_PUBLIC=true
* export ROCKETCHAT_USER=doge
* export ROCKETCHAT_PASSWORD=doge
* export ROCKETCHAT_URL=159.65.101.16:3000
* export NODE_VERSION=default
*
* To setup doge run:
* @doge cal setup - and follow the remaining prompts
*
* Once @doge is setup run:
* @doge cal suggest - receive 3 meeting suggestions for the current day
*
* 
*/


const momentTZ = require('moment-timezone');
const moment = require('moment');
const rp = require('request-promise')
const ical2json = require('ical2json')

function getTodaysDate(currentTimeZone) {
  return moment.utc()
}

function formatDate(icalStr) {
  let strYear = icalStr.substr(0,4);
  let strMonth = parseInt(icalStr.substr(4,2),10) - 1;
  let strDay = icalStr.substr(6,2);
  let strHour = icalStr.substr(9,2);
  let strMin = icalStr.substr(11,2);
  let strSec = icalStr.substr(13,2);
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

  let test = moment(wrkHrs.slice(0, wrkHrs.indexOf('-')),'HH:mm')
  .tz(timeZone).hours(start.Hrs).minutes(start.Min)

  let returnObj = {
    start: moment(wrkHrs.slice(0, wrkHrs.indexOf('-')),'HH:mm')
    .tz(timeZone).hours(start.Hrs).minutes(start.Min).utc(),

    end: moment(wrkHrs.slice(wrkHrs.indexOf('-') + 1 , wrkHrs.length),'HH:mm')
    .tz(timeZone).hours(end.Hrs).minutes(end.Min).utc(),

    timeZone: timeZone
  }

  return returnObj
}


function  minutesOfDay(m) {
  return m.minutes() + m.hours() * 60;
}


function randomStartTimesArray(wrkHrs, dateAvailRequested) {

  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random()* ( max-min + 1) + min)
  }

  let startTime = {
      Obj : {},
      Arr : []
  }

  let stagingStartTime = randomIntFromInterval(wrkHrs.start.hour(),wrkHrs.end.hour())

  startTime.Obj[stagingStartTime] = true
  startTime.Arr.push(moment(dateAvailRequested).hours(stagingStartTime).minutes(00).seconds(00))

  let currStartTime

  while (Object.keys(startTime.Obj).length <= 2) {

    currStartTime = randomIntFromInterval(wrkHrs.start.hour(),wrkHrs.end.hour())

    if (!startTime.Obj[currStartTime]) {
      startTime.Obj[currStartTime] = true
      startTime.Arr.push(moment(dateAvailRequested).hours(currStartTime).minutes(00).seconds(00))
    }

  }

  return startTime.Arr
}


class RecordAvailability {

	constructor() {
	  this.lastEventEndTime = 'undefined'
    this.suggestions = []
 	}

  set (wrkHrs, eventEnd, eventStart) {

	  if (eventStart === undefined) { // event started before working hours
			this.lastEventEndTime = eventEnd
      return
    }

	  if (this.lastEventEndTime === 'undefined') {
      // first event that day && there is gap time between wrkHrs start and eventStart
      this.lastEventEndTime = wrkHrs.start
    }

	  this.findAvailability(wrkHrs, eventStart)
	  this.lastEventEndTime = eventEnd
  }

	setUntilEndOfWorkDay(wrkHrs) {
	  this.findAvailability(wrkHrs, wrkHrs.end)
	}

	dayIsFree(wrkHrs, dateAvailRequested) {
    let endTime

	  randomStartTimesArray(wrkHrs, dateAvailRequested).forEach( startTime => {
      endTime = moment(startTime).add(1,'hours')
      this.createSuggestion(wrkHrs, startTime, endTime)
    })

	}

	findAvailability(wrkHrs, eventStart) {
    let availTime =  moment.duration(eventStart.diff(this.lastEventEndTime))
    availTime = availTime.asMinutes()
    let suggestionStartPoint = this.lastEventEndTime

    for (let i = 1; i <= (availTime / 60); i++) { // only create 60 min suggestions

      this.createSuggestion(wrkHrs, suggestionStartPoint, moment(suggestionStartPoint).add(1,'hours'))

      suggestionStartPoint = moment(suggestionStartPoint).add(1, 'hours') //bump suggestionStartPoint an hour
    }
	}

	createSuggestion(wrkHrs, suggestionStart, suggestionEnd) {
	  this.suggestions.push({

	    start: `${wrkHrs.timeZone}: ${localTime(suggestionStart, wrkHrs.timeZone)} UTC: ${suggestionStart}`,

	    end: `${wrkHrs.timeZone}: ${localTime(suggestionEnd, wrkHrs.timeZone)} UTC: ${suggestionEnd}`

	  })
	}

	get() {
    return this.suggestions
	}

}

/**
   * findAvailabilityOverTime()
   * @param {Array} eventArr - The event data retreived from fastmail.
   * @param {Object} wrkHrs - Users prefered working hours & timezone
   *    i.e: {start: XXXX, end: XXXX, timeZone: XXXX}
   * @param {String} dateAvailRequested - the date the user has requested avail * on
   * @param {String} timeWindow - time window that the user is requesting
   *  i.e day / week
   * @param {Class} Availability - instance of the RecordAvailability Class
   *
   * @returns Nothing - calls Availability.set() method
**/

function findAvailabilityOverTime (eventArr, wrkHrs, dateAvailRequested, timeWindow, Availability) {

  if (timeWindow === 'day') {
    eventArr.forEach(date => { // loop over event dates

      if (formatDate(date.DTSTART).date() === dateAvailRequested.date()) {
      // events that happen on selected day

        if (minutesOfDay(formatDate(date.DTSTART)) <= minutesOfDay(wrkHrs.start)) {
        // event start happens before || same time as wrkhrs start

    			if (minutesOfDay(formatDate(date.DTEND)) <= minutesOfDay(wrkHrs.start)) {
          // event end happens before || same time as wrkhrs start
    			// the entire event happens before working hours
    			// do nothing -> go to next event
    			} else {
    				//event ends during working hours
    				Availability.set(wrkHrs, formatDate(date.DTEND))
    			}

    		} else { // event start happens after wrkhrs start

    			if (minutesOfDay(formatDate(date.DTSTART)) > minutesOfDay(wrkHrs.end)) {
            // event start happens before  wrkhrs end
    				Availability.set(wrkHrs, formatDate(date.DTEND), formatDate(date.DTSTART))
            // 2 Args (record whole chunk of availability from start || last event end - end)
          } else {
    			// the entire event happens after working hours
          // do nothing -> go to next event
          }

    		}
      } else {
    	  console.log('this is in else when there are no events on that day')
    	 }

    })

    Availability.setUntilEndOfWorkDay(wrkHrs)

  	Availability.get().length ? '' : Availability.dayIsFree(wrkHrs, dateAvailRequested)

    console.log('suggestion arr', Availability.get())
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

      msg.reply("Woof woof! URL was received... \n \n Excellent, now I need to know your preferred working hours when you will be available for meetings. \n \n Please enter them in 24hr format: <HH:mm>-<HH:mm> (e.g. 09:00-17:00)")

      awaitingUrl = false
      awaitingWorkHours = true
    }
  })

  robot.hear(/[0-9][0-9]:[0-5][0-9]-[0-9][0-9]:[0-5][0-9]/i, function(msg) {
    if (awaitingWorkHours) {
      console.log('in save', robot.brain.get(msg.message.user.id))

      robot.brain.set(msg.message.user.id,{
        busyCalUrl:robot.brain.get(msg.message.user.id).busyCalUrl,
        workHrs: msg.message.text
      })


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
