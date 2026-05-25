const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const moment = require('moment-timezone')

const bot = new TelegramBot(
  '8949237246:AAFrvEQ_h9kU_G3-lPnSI3oTYannjned7SI',
  { polling: true }
)

const FILE = './users.json'
const ADMIN_ID = '5993350382'

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, '{}')
}

function loadUsers() {
  return JSON.parse(
    fs.readFileSync(FILE)
  )
}

function saveUsers(data) {
  fs.writeFileSync(
    FILE,
    JSON.stringify(data, null, 2)
  )
}

function getUser(users, msg) {

  if (!users[msg.from.id]) {

    users[msg.from.id] = {
      id: msg.from.id,
      username: msg.from.username || '-',
      name: msg.from.first_name,
      money: 300,
      lastDaily: null
    }

    saveUsers(users)

  }

  return users[msg.from.id]

}

function randomFruit() {

  const buah = [
    '🍊',
    '🍑',
    '🍅'
  ]

  return buah[
    Math.floor(
      Math.random() * buah.length
    )
  ]

}

function generateBoard() {

  return [
    [randomFruit(), randomFruit(), randomFruit()],
    [randomFruit(), randomFruit(), randomFruit()],
    [randomFruit(), randomFruit(), randomFruit()]
  ]

}

function countLines(board) {

  let lines = 0

  // horizontal
  for (let row of board) {

    if (
      row[0] === row[1] &&
      row[1] === row[2]
    ) {
      lines++
    }

  }

  // vertical
  for (let i = 0; i < 3; i++) {

    if (
      board[0][i] === board[1][i] &&
      board[1][i] === board[2][i]
    ) {
      lines++
    }

  }

  // diagonal
  if (
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  ) {
    lines++
  }

  if (
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  ) {
    lines++
  }

  return lines

}

function boardText(board) {

  return `
${board[0].join('')}
${board[1].join('')}
${board[2].join('')}`

}

// START
bot.onText(/\/start/, (msg) => {

  const users = loadUsers()

  const user = getUser(users, msg)

  bot.sendMessage(
    msg.chat.id,

`🎰 Selamat datang di Bot Casino Telegram Ter gacorr Ter aman, dijamin menang banyakkk tanpa deposit 🎰

💰 Total uang : Rp${user.money}
🆔 ID akun : ${msg.from.id}`,

{
  reply_markup: {

    inline_keyboard: [[

      {
        text: '🔥 Ayoo Mulai Spin Sekarang 🔥',
        callback_data: 'spin'
      }

    ]]

  }
}

  )

})

// DAILY
bot.onText(/\/daily/, (msg) => {

  const users = loadUsers()

  const user = getUser(users, msg)

  const now = moment()
    .tz('Asia/Jakarta')

  const today = now.format('YYYY-MM-DD')

  if (user.lastDaily === today) {

    return bot.sendMessage(
      msg.chat.id,
      '😭 Kamu sudah claim daily hari ini'
    )

  }

  user.money += 50
  user.lastDaily = today

  saveUsers(users)

  bot.sendMessage(
    msg.chat.id,

`✅ Check harian telah berhasil

💰 uang kamu +Rp50

⏰ Kembali lagi jam 02.00 WIB`

  )

})

// PROFILE
bot.onText(/\/profile/, (msg) => {

  const users = loadUsers()

  const user = getUser(users, msg)

  bot.sendMessage(
    msg.chat.id,

`👤 ${user.name}

🆔 ${user.id}
👤 @${user.username}
💰 Rp${user.money}`

  )

})

// LEADERBOARD
bot.onText(/\/leaderboard/, (msg) => {

  const users = loadUsers()

  const sorted = Object.values(users)
    .sort((a, b) => b.money - a.money)
    .slice(0, 10)

  let text = '🏆 LEADERBOARD CASINO\n\n'

  sorted.forEach((u, i) => {

    text +=
`${i + 1}. ${u.name}
🆔 ${u.id}
👤 @${u.username}
💰 Rp${u.money}\n\n`

  })

  bot.sendMessage(
    msg.chat.id,
    text
  )

})

// ADMIN MINES
bot.onText(
/\/mines (.+) (.+)/,
(msg, match) => {

  if (
    String(msg.from.id)
    !==
    ADMIN_ID
  ) {

    return bot.sendMessage(
      msg.chat.id,
      '❌ Khusus admin 😭'
    )

  }

  const target = match[1]
  const amount = Number(
    String(match[2])
      .replace('Rp', '')
      .replace(/\./g, '')
  )

  const users = loadUsers()

  if (!users[target]) {

    return bot.sendMessage(
      msg.chat.id,
      'User tidak ditemukan 😭'
    )

  }

  users[target].money -= amount

  saveUsers(users)

  bot.sendMessage(
    msg.chat.id,

`✅ Berhasil mengurangi uang user

🆔 ${target}
💸 -Rp${amount}`

  )

})

// SLOT COMMAND
bot.onText(/\/slot/, async (msg) => {

  playSlot(msg)

})

// BUTTON
bot.on(
'callback_query',
async (query) => {

  if (
    query.data === 'spin'
  ) {

    playSlot(query.message)

  }

})

async function playSlot(msg) {

  const users = loadUsers()

  const user = getUser(users, msg)

  user.money -= 5

  const cooldownFile = './jackpot.json'

  if (!fs.existsSync(cooldownFile)) {
    fs.writeFileSync(cooldownFile, '{}')
  }

  let jackpotData = JSON.parse(
    fs.readFileSync(cooldownFile)
  )

  const now = Date.now()

  let canJackpot = true

  if (jackpotData.lastJackpot) {

    const next =
      jackpotData.lastJackpot +
      (3 * 24 * 60 * 60 * 1000)

    if (now < next) {
      canJackpot = false
    }

  }

  let board
  let lines

  const chance = Math.random() * 100

  // kalah 60%
  if (chance < 60) {

    do {
      board = generateBoard()
      lines = countLines(board)
    }
    while (lines > 0)

  }

  // 1 baris 20%
  else if (chance < 80) {

    do {
      board = generateBoard()
      lines = countLines(board)
    }
    while (lines !== 1)

  }

  // 2 baris 15%
  else if (chance < 95) {

    do {
      board = generateBoard()
      lines = countLines(board)
    }
    while (lines !== 2)

  }

  // jackpot 5%
  else {

    if (canJackpot) {

      board = [
        ['🍊','🍊','🍊'],
        ['🍅','🍅','🍅'],
        ['🍑','🍑','🍑']
      ]

      lines = 3

      jackpotData.lastJackpot = now

      fs.writeFileSync(
        cooldownFile,
        JSON.stringify(jackpotData, null, 2)
      )

    }

    else {

      do {
        board = generateBoard()
        lines = countLines(board)
      }
      while (lines >= 3)

    }

  }

  let text

  // kalah
  if (lines === 0) {

    text =
`@${msg.from.username || msg.from.first_name}

${boardText(board)}

😭 Kurang beruntung
💸 uang kamu -Rp5`

  }

  // 1 baris
  else if (lines === 1) {

    user.money += 100

    text =
`@${msg.from.username || msg.from.first_name}

${boardText(board)}

🎉 Selamat kamu menang
💰 uang kamu +Rp100`

  }

  // 2 baris
  else if (lines === 2) {

    user.money += 200

    text =
`@${msg.from.username || msg.from.first_name}

${boardText(board)}

🔥 Gokill menang 2 baris
💰 uang kamu +Rp200`

  }

  // jackpot
  else {

    user.money += 10000

    text =
`@${msg.from.username || msg.from.first_name}

${boardText(board)}

🏆 JACKPOT GEDE NIH 😭🔥
💰 uang kamu +Rp10.000`

  }

  saveUsers(users)

  bot.sendMessage(
    msg.chat.id,
    text,

{
  reply_markup: {

    inline_keyboard: [[

      {
        text: '🔥 Putar Lagi 🔥',
        callback_data: 'spin'
      }

    ]]

  }
}

  )

}

console.log(
  'Casino Bot Aktif 😭🔥'
)
