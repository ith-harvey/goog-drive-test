class Delegator {
  constructor() {
    this.delegatorObj = {
      calGuests: [],
      datesRequested: [],
    }
  }

  add (addTo, whatWeAdd) {
    if (Array.isArray(whatWeAdd)) {
      this.delegatorObj[addTo] = whatWeAdd
    } else {
      this.delegatorObj[addTo].push(whatWeAdd)
    }
  }

  get() { return this.delegatorObj}

}

module.exports = Delegator
