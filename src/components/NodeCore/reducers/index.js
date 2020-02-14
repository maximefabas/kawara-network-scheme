import {
  TURN_ON,
  TURN_OFF
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

    default:
      return state
  }
}

export default reducer
