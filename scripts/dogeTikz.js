require('dotenv').config()
const rp = require('request-promise');
const fs = require('fs');
const Util = require('./utils.js')

const {exec} = require('child_process')


const removeDoge = Util.remove('doge')
const parseRemoveDoge = Util.compose(Util.spaceJoin, removeDoge, Util.spaceSplit)

const createFileCb = err => {
  if (err) throw err
  console.log('file has been created!');
}

const createFile = data => fs.writeFile('laTexFile.tex', data, createFileCb)

const addBoilerPlate = data => `\\documentclass{standalone}
\\usepackage{tikz-cd}
\\begin{document}
\\begin{tikzcd}
${data}
\\end{tikzcd}
\\end{document}`

const cleanAndCreateFile = Util.compose(createFile, addBoilerPlate, parseRemoveDoge)

const promiseConvrt = fn => new Promise( (res, rej) => res(fn))

const cmdExec = cmd => execSync(cmd)

const execCb = (err, stdout, stderr) => {
  if (err) {
    console.error(`exec error: ${err}`);
    return
  }
  return stdout
}

const execPromise = function(cmd) {
    return new Promise(function(resolve, reject) {
        exec(cmd, function(err, stdout) {
            if (err) return reject(err);
            return resolve(stdout);
        });
    });
}

module.exports = (robot) => {

  let awaitingTikzCode = false

  robot.respond(/(tikz create)/i, function (msg) {
    console.log('ready to receive tikz code', awaitingTikzCode);
    msg.reply('Hi there, just so you know I write all the boilerplate for you: ``` \\documentclass{standalone} \n \\usepackage{tikz-cd} \n \\begin{document} \n \\begin{tikzcd} \n\n //* your code here *// \n\n \\end{tikzcd} \n \\end{document}```\n Please provide me the tikZ code you would like to run:')
    awaitingTikzCode = true
  })

  robot.respond(/(.*)/i, function (msg) {
    if (awaitingTikzCode && (msg.message.text.split(' ')[1] !== 'tikz')) {
      msg.reply('processing...')
      cleanAndCreateFile(msg.message.text)
      execPromise('pdflatex laTexFile.tex').then(res => {

        execPromise('convert -density 300 laTexFile.pdf laTexFile.jpg').then( res => {

          execPromise('openssl base64 -in laTexFile.jpg').then(res => {

            const options = {
              method: 'POST',
              uri: 'https://api.imgur.com/3/image',
              headers: {'Authorization': process.env.IMGUR_CLIENT_ID},
              body: {
                image: res,
                type: 'base64'
              },
              json: true
            }

            rp(options).then( resp => {
              console.log('resp--', resp)
              msg.reply(`Here is your tikZ rendering: ${resp.data.link}`)
            })



          })
        })
      })


    awaitingTikzCode = false
    }
  })

}
