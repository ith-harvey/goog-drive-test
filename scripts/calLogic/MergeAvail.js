
const momentTZ = require('moment-timezone');
const moment = require('moment');

const Time = require('./Time.js')
const CreateAvailability = require('./RecordAvailability.js')



class Merge {

  static determLongerAvailWindows(arr1, arr2) {

    if (arr1.length > arr2.length) {
      return arr1.length
    } else {
      return arr2.length
    }
  }

  static availability(user1, user2) {

    let mergedAvailArr = []

    // PROBLEM IS HERE

    if (user1[0][0] === undefined) {
      console.log('in availability day');
      // only have a day to merge Availability for

      let largerNumOfAvailWindows = this.determLongerAvailWindows(user1, user2)

      let Availability = new CreateAvailability()

      // issue here in day vs week. Day doesn't have the extra array where as week will....
      let compare = this.prepEventsForComparison(largerNumOfAvailWindows, user1[0], user1, user2[0], user2)

      return this.compareAvailability(compare, Availability)

    } else {
      // Have a week to merge Availability for
      console.log('running availability week');

      for (let i = 0; i < user1.length; i++) {

        let largerNumOfAvailWindows = this.determLongerAvailWindows(user1[i], user2[i])

        let Availability = new CreateAvailability()

        // issue here in day vs week. Day doesn't have the extra array where as week will....
        let compare = this.prepEventsForComparison(largerNumOfAvailWindows, user1[i][0], user1[i], user2[i][0], user2[i])

        mergedAvailArr.push(this.compareAvailability(compare, Availability))
      }

      return mergedAvailArr
    }

  }

  static prepEventsForComparison(largerNumOfAvailWindows, user1FirstWindow, user1EventArr, user2FirstWindow, user2EventArr) {
    // console.log('in prep events', user1FirstWindow);
    // console.log('in prep events', user2FirstWindow);
    // console.log('in prep events', user1EventArr);
    // console.log('in prep events', user2EventArr);

    function buildCompare (windowToUse, additionalParam) {
      let returnObj = {
        start: windowToUse.availStart,
        end: windowToUse.availEnd,
      }
      if (additionalParam) returnObj[additionalParam] = true
      return returnObj
    }

    let compareArr = []

    for (let j = 0; j < largerNumOfAvailWindows; j++) {
      let compare = {}

      if (user1FirstWindow.dayIsFree && user2FirstWindow.dayIsFree) {
        // both days are entirely free -> run comparison
        compare.user1Event = buildCompare(user1FirstWindow, 'dayIsFree')
        compare.user2Event = buildCompare(user2FirstWindow, 'dayIsFree')


      } else if (user1FirstWindow.dayIsBooked || user2FirstWindow.dayIsBooked) {
        // both days are entirely Booked -> run comparison

        compare.user1Event = buildCompare(user1FirstWindow, 'dayIsBooked')
        compare.user2Event = buildCompare(user2FirstWindow, 'dayIsBooked')

      } else if (user1FirstWindow.dayIsFree) {
        // just the first user's day is free
        compare.user1Event = buildCompare(user1FirstWindow, 'dayIsFree')
        compare.user2Event = buildCompare(user2EventArr[j])

      } else if (user2FirstWindow.dayIsFree) {
        // just the second user's day is free
        compare.user2Event = buildCompare(user2FirstWindow, 'dayIsFree')
        compare.user1Event = buildCompare(user1EventArr[j])

      } else {
        compare.user1Event = buildCompare(user1EventArr[j])
        compare.user2Event = buildCompare(user2EventArr[j])
      }
      compareArr.push(compare)
    }

    return compareArr
  }

  static compareAvailability (compareArr, Availability) {

    let mergeEventToPush = {}

    for (let j = 0; j < compareArr.length; j++) {

      let user1Ev = compareArr[j].user1Event
      let user2Ev = compareArr[j].user2Event

      if (user1Ev.dayIsBooked || user2Ev.dayIsBooked) {
        Availability.wholeDayIsBooked(user1Ev)
        return Availability.get()
      }

      // determine start of window
      if(user1Ev.start.isSameOrBefore(user2Ev.start, 'minutes')) {
        mergeEventToPush.start = user2Ev.start
      } else if (user1Ev.start.isSameOrAfter(user2Ev.start,'minutes')) {
        mergeEventToPush.start = user1Ev.start
      }

      // determine end of window
      if (user1Ev.end.isSameOrBefore(user2Ev.end, 'minutes')) {
        mergeEventToPush.end = user1Ev.end
      } else if (user1Ev.end.isSameOrAfter(user2Ev.end, 'minutes')) {
        mergeEventToPush.end = user2Ev.end
      }

      Availability.add(mergeEventToPush.start, mergeEventToPush.end)
    }

    return Availability.get()

  }

}



module.exports = Merge
