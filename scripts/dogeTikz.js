require('dotenv').config()
const rp = require('request-promise');
const fs = require('fs');
const {compose, spaceJoin, spaceSplit, remove} = require('./utils.js')
const {exec} = require('child_process')

const removeDoge = remove('doge')
const parseRemoveDoge = compose(spaceJoin, removeDoge, spaceSplit)

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

const cleanAndCreateFile = compose(createFile, addBoilerPlate, parseRemoveDoge)


const execPromise = cmd => new Promise( (resolve, reject) => {
  exec(cmd, function(err, stdout) {
    if (err) return reject(err);
    return resolve(stdout);
  });
});

module.exports = (robot) => {

  let awaitingTikzCode = false

  robot.respond(/(tikz create)/i, function (msg) {
    msg.reply('Hi there, just so you know I write all the boilerplate for you: ``` \\documentclass{standalone} \n \\usepackage{tikz-cd} \n \\begin{document} \n \\begin{tikzcd} \n\n //* your code here *// \n\n \\end{tikzcd} \n \\end{document}```\n Please provide me the tikZ code you would like to run:')
    awaitingTikzCode = true
  })

  robot.respond(/(.*)/i, function (msg) {
    if (awaitingTikzCode && (msg.message.text.split(' ')[1] !== 'tikz')) {
      msg.reply('processing...')
      cleanAndCreateFile(msg.message.text)

      let execCommands = ['pdflatex laTexFile.tex', 'convert -density 300 laTexFile.pdf laTexFile.jpg', 'openssl base64 -in laTexFile.jpg']

      const execCommandProm = execCommands.map( cmd => execPromise(cmd))

      Promise.all(execCommandProm).then(res => {
        console.log('here is the res', res);

      //   const options = {
      //     method: 'POST',
      //     uri: 'https://api.imgur.com/3/image',
      //     headers: {'Authorization': process.env.IMGUR_CLIENT_ID},
      //     body: { image: res, type: 'base64'},
      //     json: true
      //   }
      //
      //   rp(options).then(resp => {
      //     msg.reply(`Here is your tikZ rendering: ${resp.data.link}`)
      //   }).catch(error => {
      //     console.log('// request err //', error);
      //     msg.reply(error)
      //   })
      //
      //   awaitingTikzCode = false
      //
      // }).catch(error => {
      //   console.log('// cmd err //', error);
      //   msg.reply(error)
      // })

      // execPromise('pdflatex laTexFile.tex').then(res => {
      //   console.log('pdf to latex', res);
      //
      //   execPromise('convert -density 300 laTexFile.pdf laTexFile.jpg').then( res => {
      //     console.log('laTex trans to jpg', res);
      //
      //     execPromise('openssl base64 -in laTexFile.jpg').then(res => {
      //       console.log('base64 trans response', res);
      //
      //       const options = {
      //         method: 'POST',
      //         uri: 'https://api.imgur.com/3/image',
      //         headers: {'Authorization': process.env.IMGUR_CLIENT_ID},
      //         body: {
      //           image: res,
      //           type: 'base64'
      //         },
      //         json: true
      //       }
      //
      //       rp(options).then( resp => {
      //         msg.reply(`Here is your tikZ rendering: ${resp.data.link}`)
      //
      //       })
      //     })
      //   })
      // }).catch(error => {
      //   console.log('error', error);
      //   msg.reply(err)
      // })



    // }
  }).catch(error => {
    console.log('// cmd err //', error);
    msg.reply(error)
  })
}
})
}
