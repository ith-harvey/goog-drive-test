class Delegator {


  constructor() {
    this.delegatorObj = {
      requesterUserIds: [],
      datesRequested: [],
      requesterTimeZone: '',
      meetingLengthInMinutes: 60
    }
  }

  add (addTo, whatWeAdd) {

    if (addTo === 'error') {
      this.delegatorObj[addTo] = whatWeAdd
    } else if (addTo === 'meetingLengthInMinutes') {
      this.delegatorObj[addTo] = whatWeAdd
    } else if (addTo === 'requesterTimeZone') {
      this.delegatorObj[addTo] = whatWeAdd
    } else if (Array.isArray(whatWeAdd)) {
      this.delegatorObj[addTo] = whatWeAdd
    } else {
      this.delegatorObj[addTo].push(whatWeAdd)
    }
  }

  get() { return this.delegatorObj}

}

module.exports = Delegator
