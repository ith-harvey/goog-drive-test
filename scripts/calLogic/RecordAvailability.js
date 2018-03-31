const momentTZ = require('moment-timezone');
const moment = require('moment');

const Time = require('./Time.js')
const Misc = require('./Misc.js')

class CreateAvailability {
  constructor() {
    this.lastEventEndTime = 'undefined'
    this.availabilityArr = []
  }

  set(wrkHrs, eventEnd, eventStart) {
    console.log('in set');
    if (eventStart === undefined) { //event started before working hours
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

  dayIsFreeAddAvail(wrkHrs, dateAvailRequested) {

    let dayIsFree = true

    this.add(wrkHrs, wrkHrs.start, wrkHrs.end, dayIsFree)
  }

  findAvailability(wrkHrs, eventStart) {
    let availTime =  moment.duration(eventStart.diff(this.lastEventEndTime)).asMinutes()

    let availabilityStartPoint = this.lastEventEndTime

    for (let i = 1; i <= (availTime / 60); i++) {
      // only create 60 min suggestions

      this.add(wrkHrs, availabilityStartPoint, moment(availabilityStartPoint).add(1, 'hours'))

      availabilityStartPoint = moment(availabilityStartPoint).add(1, 'hours') //bump suggestionStartPoint an hour
    }
  }

  wholeDayIsBooked(wrkHrs) {
    this.availabilityArr.push({
      booked: wrkHrs.start,
      bookedMsg: 'day is completely booked',
    })
  }

  add(wrkHrs, availStart, availEnd, dayIsFree) {
    console.log('making add', dayIsFree);

    let availabilityObj = {
      start: `${wrkHrs.timeZone}: ${Time.localTime(availStart, wrkHrs.timeZone)} UTC: ${availStart}`,

      end: `${wrkHrs.timeZone}: ${Time.localTime(availEnd, wrkHrs.timeZone)} UTC: ${availEnd}`,

      rawStartTime: availStart,

      rawEndTime: availEnd,
    }

    if (dayIsFree) availabilityObj.dayIsFree = true

    this.availabilityArr.push(availabilityObj)
  }

  get() { return this.availabilityArr}

}

module.exports = CreateAvailability
