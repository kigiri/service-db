const service = require('netcall')
const redis = require('redis')
const client = redis.createClient({ password: process.env.REDIS_PASSWORD })

const events = ['connect', 'reconnecting', 'ready', 'end', 'error', 'warning']
  .forEach(e => client.on(e, err => {
    console.info(`[Redis] ${e}`)
    if (err) {
      console.error(err)
      process.exit(1)
    }
  }))

const setMemo = new WeakSet()
const db = Object.keys(client.constructor.prototype)
  .filter(key => typeof client.constructor.prototype[key] === 'function')
  .filter(key => /^[a-z]+$/.test(key))
  .filter(key => !setMemo.has(client.constructor.prototype[key])
    && setMemo.add(client.constructor.prototype[key]))
  .reduce((acc, key) => {
    acc[key] = a => new Promise((s, f) =>
      client[key](...(Array.isArray(a) ? a : [ a ]), (e, r) => e ? f(e) : s(r)))
    return acc
  }, Object.create(null))

service.handle(db)
