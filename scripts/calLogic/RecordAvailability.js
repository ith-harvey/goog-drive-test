const momentTZ = require('moment-timezone');
const moment = require('moment');

const Time = require('./Time.js')
const Misc = require('./Misc.js')

class RecordAvailability {
  constructor() {
    this.lastEventEndTime = 'undefined'
    this.availabilityArr = []
  }

  set(wrkHrs, eventEnd, eventStart) {
    if (eventStart === undefined) { //event started before working hours
      console.log('settting event end')
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
    let dateRequestedWrkHrs = Time.chngWrkHrsToDateRequested(wrkHrs, dateAvailRequested)

    this.addAvailability(wrkHrs, dateRequestedWrkHrs.start, dateRequestedWrkHrs.end)
  }

  generateSuggestTimes(wrkHrs, dateAvailRequested) {
    let endTime

    Misc.randomStartTimesArray(
      wrkHrs.start.hour(),
      wrkHrs.end.hour(),
      dateAvailRequested).forEach(startTime =>  {

        endTime = moment(startTime).add(1, 'hours')
        this.addAvailability(wrkHrs, startTime, endTime)
      })
  }

  findAvailability(wrkHrs, eventStart) {

    let availTime =  moment.duration(eventStart.diff(this.lastEventEndTime)).asMinutes()

    let availabilityStartPoint = this.lastEventEndTime

    for (let i = 1; i <= (availTime / 60); i++) {
      // only create 60 min suggestions

      this.addAvailability(wrkHrs, availabilityStartPoint, moment(availabilityStartPoint).add(1, 'hours'))

      availabilityStartPoint = moment(availabilityStartPoint).add(1, 'hours') //bump suggestionStartPoint an hour
    }
  }

  wholeDayIsBooked(wrkHrs) {
    this.availabilityArr.push({
      booked: wrkHrs.start,
      bookedMsg: 'day is completely booked',
    })
  }

  addAvailability(wrkHrs, availStart, availEnd) {
    this.availabilityArr.push({

      start: `${wrkHrs.timeZone}: ${Time.localTime(availStart, wrkHrs.timeZone)} UTC: ${availStart}`,

      end: `${wrkHrs.timeZone}: ${Time.localTime(availEnd, wrkHrs.timeZone)} UTC: ${availEnd}`,

      rawStartTime: Time.localTime(availStart, wrkHrs.timeZone),

    })
  }

  get() { return this.availabilityArr}

}

module.exports = RecordAvailability
