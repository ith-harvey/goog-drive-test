
const rp = require('request-promise');


const ical2json = require('ical2json')
const Delegator = require('./Delegator')
const Time = require('./Time.js')
const Misc = require('./Misc.js')

class IncomingCommand {

  constructor() {
    this.timeFrameRequested = ''
    this.DelegatorObject = ''
  }

  monthQuery (text) {
    let regExp = /(may|february|january|august|september|october|november|december|march|april|july|june)/
    return regExp.test(text)
  }

  setTimeZone(timeZone) {
    this.DelegatorObject.add('requesterTimeZone', timeZone)
  }

  interpreter (robot, message) {

    let cmdArr = message.text.split(' ')

    this.DelegatorObject = new Delegator()
    let basicQuery = cmdArr.indexOf('suggest')

    // this.DelegatorObject.add('meetingLengthInMinutes', 60)
    this.DelegatorObject.add('requesterUserIds', message.user.id)

    if (cmdArr.length - 1 === basicQuery) {
      return this.dayQueryNoDates()
    }

    if (cmdArr[basicQuery + 1][0] === '@') {
      // adding users to query
      let uNamePosition = basicQuery + 1
      let userIdArr = []
      let currUser = cmdArr[uNamePosition]

      while (currUser && currUser[0] === '@') {
        currUser = currUser.substr(1)

        if (!robot.brain.usersForFuzzyName(currUser).length) {
          return this.errorHandler('Ruh ro, either the user you have requested has not run the `@doge cal suggest setup` wizard or that user does not exist! For now try running a query without ' + currUser + '\'s username.')
        }

        this.DelegatorObject.add('requesterUserIds', robot.brain.usersForFuzzyName(currUser)[0].id)

        uNamePosition ++
        currUser = cmdArr[uNamePosition]
      }

      if (!currUser) {
        return this.dayQueryNoDates()
      }

      cmdArr = cmdArr.splice(uNamePosition, cmdArr.length)
      return this.dateInterpreter(cmdArr)

    }

    return this.dateInterpreter(cmdArr.splice(basicQuery + 1, cmdArr.length))

  }

  dateInterpreter(cmdArr) {
    if (cmdArr[0] === 'week') {

      if (cmdArr.length === 1) {
        return this.weekQueryNoDates(cmdArr)
      } else if (cmdArr.length === 3) {
        return this.weekQueryWithDates(cmdArr[1], cmdArr[2])
      }

    } else if (this.monthQuery(cmdArr[0])) {
      return this.dayQueryWithDates(cmdArr[0], cmdArr[1])
    }
  }

  errorHandler(errMsg) {
    this.DelegatorObject.add('error', errMsg)
    return this.DelegatorObject.get()
  }

  setRequestedQuery(msg) {
    this.timeFrameRequested = msg
  }

  getRequestedQuery(msg) {
    return this.timeFrameRequested
  }

  weekQueryWithDates(month, day) {
    // week query with dates
    let dateRequested = Time.interpDate(month, day)

    let weeksWorkingDaysArr = Misc.setScopeOfWorkWeek(dateRequested)

    //if Query is weekend return error msg
    if (weeksWorkingDaysArr.err) return this.errorHandler(weeksWorkingDaysArr.err)

    this.setRequestedQuery(`week of ${dateRequested.format('LL')}`)
    this.DelegatorObject.add('datesRequested', weeksWorkingDaysArr)

    return this.DelegatorObject.get()
  }

  weekQueryNoDates() {
    // week query no dates
    let weeksWorkingDaysArr = Misc.setScopeOfWorkWeek(Time.getTodaysDate())

    if (weeksWorkingDaysArr.err) return this.errorHandler(weeksWorkingDaysArr.err)

    this.setRequestedQuery('this week')

    this.DelegatorObject.add('datesRequested', weeksWorkingDaysArr)

    return this.DelegatorObject.get()
  }

  dayQueryNoDates() {
    console.log('/// ///// what day it is!',Time.getTodaysDate());
    // day query without dates
    this.DelegatorObject.add('datesRequested', Time.getTodaysDate())

    this.setRequestedQuery(`today, ${Time.getTodaysDate().format('LL')}`)

    return this.DelegatorObject.get()
  }

  dayQueryWithDates(month, day) {
    // day query with dates
    let dateRequested = Time.interpDate(month, day)

    this.DelegatorObject.add('datesRequested', dateRequested)

    this.setRequestedQuery(`${dateRequested.format('LL')}`)

    return this.DelegatorObject.get()
  }

  getTimeZone() {
    return this.DelegatorObject.get()
  }




}

module.exports = IncomingCommand
