class Individual {
  constructor(userId) {
    this.userId = userId
    this.datesRequested = []
    this.timeZone = ''
    this.calBusyArr = []
    this.meetingLengthInMinutes = 60
  }

  add (addTo, whatWeAdd) {
    if (addTo === 'datesRequested') {
      this[addTo].push(whatWeAdd)
    } else {
      this[addTo] = whatWeAdd
    }
    return this
  }

  setDatesRequested(todayInTimeZone, Command) {
    if (Command.queryParsable[0] === 'DayQueryNoDates') {
      Command.dayQueryNoDates(this, todayInTimeZone)
    } else {
      Command.dateInterpreter(this, todayInTimeZone)
    }
    return this
  }

  get() { return this }

}


class UserArray {

  constructor() {
    this.arr = []
  }

  addUser (user) {
    this.arr.push(user)
  }

  get() { return this}

}

module.exports = {UserArray, Individual}
