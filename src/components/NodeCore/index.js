import uuid from 'uuid'

import reduce from './reducers'
import {
  TURN_ON,
  TURN_OFF,
  LOOK_FOR_WIFI_SIGNALS
} from './actions/actionTypes'

import firstNames from './first-names.json'
import lastNames from './last-names.json'
const pickIn = list => {
  const pos = Math.floor(Math.random() * list.length)
  return list[pos]
}

class NodeCore {
  constructor (props) {
    this.props = { ...props }
    this.uuid = uuid.v4()
    this.name = `${pickIn(firstNames)} ${pickIn(lastNames)}`
    this.wifi_signal_reach = Math.sin(Math.random() * Math.PI) * 100 + 100
    this.state = {
      is_up: false,
      is_looking_for_wifi_signals: false
    }
    this.boot()
  }

  dispatch (action, payload) {
    this.state = reduce(this.state, action, payload)
    this.props.dispatch(this.uuid, action, payload)
  }

  async boot () {
    const delay = Math.random() * 1500 + 800
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        this.dispatch(TURN_ON)
        this.lookForWifiSignals()
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

  lookForWifiSignals () {
    this.dispatch(LOOK_FOR_WIFI_SIGNALS, true)
  }
}

export default NodeCore
