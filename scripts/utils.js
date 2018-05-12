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


module.exports = {
  remove,
  compose,
  split,
  slice,
  purify,
  spaceSplit,
  spaceJoin,
  newLineSplit
}
