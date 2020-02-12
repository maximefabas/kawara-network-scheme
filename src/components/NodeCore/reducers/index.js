import {
  TURN_ON,
  TURN_OFF,
  LOOK_FOR_WIFI_SIGNALS
} from '../actions/actionTypes'

function reducer (state, action, payload) {
  switch (action) {
    case TURN_ON:
      const up_since = Date.now()
      return {
        ...state,
        is_up: true,
        up_since,
        get_uptime: () => Date.now() - up_since
      }

    case TURN_OFF:
      return {
        ...state, 
        is_up: false,
        up_since: null,
        get_uptime: () => null
      }

    case LOOK_FOR_WIFI_SIGNALS:
      if (typeof payload !== 'boolean') return state
      return {
        ...state,
        look_for_wifi_signals: payload
      }

    default:
      return state
  }
}

export default reducer
