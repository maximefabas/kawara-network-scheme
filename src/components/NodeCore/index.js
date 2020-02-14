import reduce from './reducers'
import {
  TURN_ON,
  TURN_OFF
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
    window.setInterval(() => console.log(this.name, 'peers:', this.wifiPeers), 2000)
    this.boot()
  }

  get wifiPeers () {
    return this.state.is_up
      ? this.props.getWifiSignals()
      : []
  }

  dispatch (action, payload) {
    console.log(this.name, 'dispatch', action)
    this.state = reduce(this.state, action, payload)
    this.props.dispatch(this.props.uuid, action, payload)
  }

  async boot () {
    console.log(this.name, 'Booting...')
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_ON)
        // this.request('BROADCAST', this.name)
        resolve()
      }, delay)
    })
  }

  async shutDown () {
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_OFF)
        resolve()
      }, delay)
    })
  }

  async request (method, body) {
    console.log(this.name, method, body || '')
    const fullRequest = {
      id: Math.random().slice(2),
      method,
      body
    }
    return this.props.request()
  }
}

export default NodeCore
