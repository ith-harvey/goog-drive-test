const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)))

const remove = item => array => array.slice((array.indexOf(item) + 1), array.length)

const split = sep => str => str.split(sep);

const spaceSplit = split(' ')

const join = sep => array => array.join(sep)

const spaceJoin = join(' ')


module.exports = {
  remove,
  compose,
  split,
  spaceSplit,
  spaceJoin
}
