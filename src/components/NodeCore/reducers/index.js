import {
  TURN_ON,
  TURN_OFF,
  LOG_REQUEST
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

    case LOG_REQUEST:
      return {
        ...state,
        requests_log: state.requests_log
          ? [...state.requests_log, payload]
          : [payload]
      }

    default:
      return state
  }
}

export default reducer
