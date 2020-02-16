import reduce from './reducers'
import {
  TURN_ON,
  TURN_OFF,
  LOG_REQUEST
} from './actions/actionTypes'

import firstNames from './utils/first-names.json'
import lastNames from './utils/last-names.json'
import emojiFaces from './utils/emoji-faces'
import { pick } from './utils'

class NodeCore {
  constructor (props) {
    this.props = { ...props }
    this.name = `${pick(firstNames)} ${pick(lastNames)}`
    this.face = pick(emojiFaces)
    this.state = {
      is_up: false,
      up_since: undefined,
      pub_key: null,
      priv_key: null,
      out_requests_log: []
    }
    this.boot()
    this.dispatch = this.dispatch.bind(this)
    this.boot = this.boot.bind(this)
    this.shutDown = this.shutDown.bind(this)
    this.emit = this.emit.bind(this)
    this.receive = this.receive.bind(this)
  }

  async boot () {
    // console.log(this.face, 'booting...')
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_ON)
        this.emit('broadcast://', {
          id: Math.random().toString().slice(2),
          message: `Hi, I'm ${this.name}`
        })
        resolve()
      }, delay)
    })
  }

  async shutDown () {
    // console.log(this.face, 'shutting down...')
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_OFF)
        resolve()
      }, delay)
    })
  }

  dispatch (action, payload) {
    // console.log(this.face, 'dispatch', action, (payload || ''))
    this.state = reduce(this.state, action, payload)
    this.props.dispatch(this.props.uuid, action, payload)
  }

  async emit (method, body) {
    const fullRequest = {
      id: Math.random().toString(36).slice(2),
      sent_on: Date.now(),
      method,
      body
    }
    this.dispatch(LOG_REQUEST, fullRequest)

    const strRequest = JSON.stringify(fullRequest)
    const byteSize = Math.ceil(strRequest.length / 8)
    const readableSize = (byteSize / 10e9) > 1
      ? `${byteSize / 10e9} GB`
      : (byteSize / 10e6) > 1
      ? `${byteSize / 10e6} MB`
      : (byteSize / 10e3) > 1
      ? `${byteSize / 10e3} kB`
      : `${byteSize} B`

    console.log(this.face, 'emit', readableSize, method, body || '')
    return this.props.emit(strRequest)
  }

  receive (jsonReq) {
    let req 
    try { req = JSON.parse(jsonReq) } catch (e) { return }
    switch (req.method) {
      case 'broadcast://':
        this.emit('propagate://')
        return 
      case 'propagate://':
        if (Math.random() > 0.99) return this.emit('propagate://')
        return
      default:
        return
    }
    console.log(this.face, 'recieved', jsonReq)
  }
}

export default NodeCore
