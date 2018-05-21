const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)))

const remove = item => array => array.slice((array.indexOf(item) + 1), array.length)

const split = sep => str => str.split(sep);

const slice = (start, end) => str => str.slice(start, end);

const spaceSplit = split(' ')

const newLineSplit = split('\n')

const join = sep => array => array.join(sep)

const spaceJoin = join(' ')

const purify = x => JSON.parse(JSON.stringify(x))

const push = (x, array) => array.push(x)

const prop = property => object => object[property]

const equalModifier = modifier => prop => prop = modifier

const modObjKickBack = (prop, value) => object => {
  let newObj = purify(object)
  newObj[prop] = value
  return newObj
}

const checkIfDMOrPublic = (msg) => msg.split(' ')[1] ? msg.split(' ')[1] : msg.split(' ')[0] // if in DM the mssge has an added 'doge' string -> this gets rid of it

module.exports = {
  remove,
  compose,
  split,
  slice,
  purify,
  modObjKickBack,
  prop,
  equalModifier,
  spaceSplit,
  spaceJoin,
  newLineSplit,
  checkIfDMOrPublic
}
