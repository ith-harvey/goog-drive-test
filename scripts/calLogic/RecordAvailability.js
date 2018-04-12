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
    // console.log('set until end of work day', wrkHrs);
    if (eventStart === undefined) { //event started before working hours
      this.lastEventEndTime = eventEnd
      return
    }

    if (this.lastEventEndTime === 'undefined') {
      // first event that day && there is gap time between wrkHrs start and eventStart
      this.lastEventEndTime = wrkHrs.start
    }

    // this.findAvailability(wrkHrs, eventStart)

    this.add(this.lastEventEndTime, eventStart)

    this.lastEventEndTime = eventEnd
  }

  setUntilEndOfWorkDay(wrkHrs) {
    // console.log('set until end of work day', wrkHrs);
    this.add(this.lastEventEndTime, wrkHrs.end)
  }

  dayIsFreeAddAvail(wrkHrs) {
    // console.log('day is free adda vil', wrkHrs);
    this.add(wrkHrs.start, wrkHrs.end, 'dayIsFree')
  }

  wholeDayIsBooked(wrkHrs) {
    this.add(wrkHrs.start, wrkHrs.end, 'dayIsBooked')
  }

  add (availStart, availEnd, dayIsFreeOrBooked) {
    // console.log('problem is here', availStart);
    let availabilityObj = {
      availStart: availStart,

      availEnd: availEnd,
    }

    if (dayIsFreeOrBooked) availabilityObj[dayIsFreeOrBooked] = true

    this.availabilityArr.push(availabilityObj)
  }

  get() { return this.availabilityArr}

}

module.exports = CreateAvailability
