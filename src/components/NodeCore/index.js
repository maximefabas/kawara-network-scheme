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
    this.state = { is_up: false }
    this.boot()
    this.dispatch = this.dispatch.bind(this)
    this.boot = this.boot.bind(this)
    this.shutDown = this.shutDown.bind(this)
    this.request = this.request.bind(this)
    this.receive = this.receive.bind(this)
  }

  get wifiPeers () {
    return this.state.is_up
      ? this.props.getWifiPeers()
      : []
  }

  dispatch (action, payload) {
    console.log(this.face, 'dispatch', action, (payload || ''))
    this.state = reduce(this.state, action, payload)
    this.props.dispatch(this.props.uuid, action, payload)
  }

  async boot () {
    console.log(this.face, 'booting...')
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_ON)
        this.request('broadcast://', `Hi, I'm ${this.name}`)
        resolve()
      }, delay)
    })
  }

  async shutDown () {
    console.log(this.face, 'shutting down...')
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_OFF)
        resolve()
      }, delay)
    })
  }

  async request (method, body) {
    console.log(this.face, 'request', method, body || '')
    const fullRequest = {
      id: Math.random().toString(36).slice(2),
      sent_on: Date.now(),
      method,
      body
    }
    this.dispatch(LOG_REQUEST, fullRequest)
    return this.props.request(fullRequest)
  }

  receive (req) {
    console.log(this.face, 'recieved', req)
  }
}

export default NodeCore
