import React, { Component } from 'react'
import {
  LayerGroup,
  Circle,
  CircleMarker,
  Tooltip
} from 'react-leaflet'
import haversine from 'haversine-distance'
import RasterMap from '../RasterMap'
import NodeCore from '../NodeCore'
import {
  TURN_ON,
  TURN_OFF,
  LOOK_FOR_WIFI_SIGNALS
} from '../NodeCore/actions/actionTypes'

class PhysicalWorld extends Component {
  /* * * * * * * * * * * * * * * *
   *
   * CONSTRUCTOR
   *
   * * * * * * * * * * * * * * * */
  constructor (props) {
    super(props)
    this.c = 'physical-world'
    this.state = { nodes: [] }
    this.handleMapClick = this.handleMapClick.bind(this)
    this.handleNodeUpdate = this.handleNodeUpdate.bind(this)
    this.giveWifiSignalsToNode = this.giveWifiSignalsToNode.bind(this)
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLERS
   *
   * * * * * * * * * * * * * * * */
  handleMapClick (e) {
    const newNodeCore = new NodeCore({ dispatch: this.handleNodeUpdate })
    const newNode = {
      latlng: e.latlng,
      core: newNodeCore
    }
    this.setState({ nodes: [...this.state.nodes, newNode] })
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLE NODE UPDATES
   *
   * * * * * * * * * * * * * * * */
  handleNodeUpdate (uuid, action, payload) {
    switch (action) {
      case TURN_ON:
      case TURN_OFF:
        return this.forceUpdate()
      case LOOK_FOR_WIFI_SIGNALS:
        return this.giveWifiSignalsToNode(uuid)
      default:
    }
  }

  /* * * * * * * * * * * * * * * *
   *
   * GIVE WIFI SIGNALS TO NODE
   *
   * * * * * * * * * * * * * * * */
  async giveWifiSignalsToNode (uuid) {
    const thisNode = this.state.nodes.find(node => node.core.uuid === uuid)
    if (!thisNode) return
    const signals = this.state.nodes
      .filter(node => node.core.state.is_up)
      .map(node => {
        if (node.core.uuid === uuid) return
        const distance = haversine(
          { lat: thisNode.latlng.lat, lng: thisNode.latlng.lng },
          { lat: node.latlng.lat, lng: node.latlng.lng }
        )
        if (distance > node.core.wifi_signal_reach) return
        return { uuid: node.core.uuid }
      })
      .filter(signal => signal)
    // [WIP] GIVE THIS TO NODE
  }

  /* * * * * * * * * * * * * * * *
   *
   * RENDER
   *
   * * * * * * * * * * * * * * * */
  render () {
    /* Inner logic */
    const nodes = this.state.nodes.map(node => ({
      ...node,
      ...node.core,
      ...node.core.state
    }))

    /* Assign classes */
    const classes = [this.c]

    /* Render */
    return <div
      className={classes.join(' ')}>
      <RasterMap
        onClick={this.handleMapClick}
        center={[48.870812, 2.376566]}
        zoom={14}>
        <LayerGroup>{
          // Wifi ranges
          nodes
            .filter(node => node.is_up)
            .map(node => {
              return <Circle
                key={node.uuid}
                center={node.latlng}
                stroke={false}
                fillColor={'#333333'}
                fillOpacity={.05}
                radius={node.wifi_signal_reach} />
            })
        }</LayerGroup>
        <LayerGroup>{
          // Nodes
          nodes.map(node => {
            return <CircleMarker
              key={node.uuid}
              radius={6}
              fill={true}
              fillColor={node.is_up ? '#00FF00' : '#FF0000'}
              fillOpacity={1}
              stroke={false}
              center={node.latlng}>
              <Tooltip>
                {node.name}
              </Tooltip>
            </CircleMarker>
          })
        }</LayerGroup>
      </RasterMap>
    </div>
  }
}

export default PhysicalWorld
