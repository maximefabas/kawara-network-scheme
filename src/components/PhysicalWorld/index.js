import React, { Component } from 'react'
import {
  LayerGroup,
  Circle,
  CircleMarker,
  Tooltip
} from 'react-leaflet'
import haversine from 'haversine-distance'
import uuid from 'uuid'
import RasterMap from '../RasterMap'
import NodeCore from '../NodeCore'
import {
  TURN_ON,
  TURN_OFF
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
    console.log('🌏 handle click on map', e.latlng)
    const newNode = this.generateNode(e.latlng)
    this.setState({ nodes: [...this.state.nodes, newNode] })
  }

  /* * * * * * * * * * * * * * * *
   *
   * GENERATE NOTE
   *
   * * * * * * * * * * * * * * * */
  generateNode (latlng) {
    const newNodeUuid = uuid.v4()
    console.log('🌏 generate node', newNodeUuid)
    const newNodeCore = new NodeCore({
      uuid: newNodeUuid,
      dispatch: this.handleNodeUpdate,
      getWifiSignals: () => this.giveWifiSignalsToNode(newNodeUuid),
      request: () => this.handleNodeRequest(newNodeUuid)
    })
    return {
      uuid: newNodeUuid,
      latlng: latlng,
      core: newNodeCore,
      wifi_signal_reach: Math.sin(Math.random() * Math.PI) * 100 + 100,
    }
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLE NODE UPDATES
   *
   * * * * * * * * * * * * * * * */
  handleNodeUpdate (uuid, action, payload) {
    console.log('🌏 handle update', uuid)
    switch (action) {
      case TURN_ON:
      case TURN_OFF:
        return this.forceUpdate()
      default:
    }
  }

  /* * * * * * * * * * * * * * * *
   *
   * GIVE WIFI SIGNALS TO NODE
   *
   * * * * * * * * * * * * * * * */
  giveWifiSignalsToNode (uuid) {
    console.log('🌏 give signals to node', uuid)
    const thisNode = this.state.nodes.find(node => node.uuid === uuid)
    if (!thisNode) return
    const signals = this.state.nodes
      .filter(node => node.core.state.is_up)
      .filter(node => node.uuid !== uuid)
      .filter(node => {
        const distance = haversine(
          { lat: thisNode.latlng.lat, lng: thisNode.latlng.lng },
          { lat: node.latlng.lat, lng: node.latlng.lng }
        )
        console.log(distance, node.wifi_signal_reach)
        return distance <= node.wifi_signal_reach
        // [WIP] Some logic about signal quality here
      })
      .map(node => ({ uuid: node.uuid }))
    return signals
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
