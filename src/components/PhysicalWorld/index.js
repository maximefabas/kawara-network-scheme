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
    this.generateNode = this.generateNode.bind(this)
    this.handleNodeUpdate = this.handleNodeUpdate.bind(this)
    this.findNode = this.findNode.bind(this)
    this.findNodeWifiPeers = this.findNodeWifiPeers.bind(this)
    this.handleNodeRequest = this.handleNodeRequest.bind(this)
    this.sendRequestToNode = this.sendRequestToNode.bind(this)
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLERS
   *
   * * * * * * * * * * * * * * * */
  handleMapClick (e) {
    console.log('🌏 handle click on map', `[${e.latlng.lat.toString().slice(0, 8)},${e.latlng.lng.toString().slice(0, 8)}]`)
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
      request: req => this.handleNodeRequest(newNodeUuid, req)
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
    switch (action) {
      case TURN_ON:
      case TURN_OFF:
        return this.forceUpdate()
      default:
    }
  }

  /* * * * * * * * * * * * * * * *
   *
   * FIND NODE
   *
   * * * * * * * * * * * * * * * */
  findNode (uuid) {
    return this.state.nodes.find(node => node.uuid === uuid)
  }

  /* * * * * * * * * * * * * * * *
   *
   * GIVE WIFI SIGNALS TO NODE
   *
   * * * * * * * * * * * * * * * */
  findNodeWifiPeers (uuid) {
    console.log('🌏 find node wifi peers', uuid)
    const thisNode = this.findNode(uuid)
    if (!thisNode) return
    const peers = this.state.nodes
      .filter(node => node.core.state.is_up)
      .filter(node => node.uuid !== uuid)
      .map(node => {
        const distance = haversine(
          { lat: thisNode.latlng.lat, lng: thisNode.latlng.lng },
          { lat: node.latlng.lat, lng: node.latlng.lng }
        )
        return { node, distance }
      })
      .filter(peer => {
        return peer.distance <= thisNode.wifi_signal_reach
      })
    return peers
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLE NODE REQUEST
   *
   * * * * * * * * * * * * * * * */
  handleNodeRequest (uuid, req) {
    console.log(`🌏 handle request ${req.id} from`, uuid)
    // Be careful with JSON objects
    const jsonRequest = JSON.stringify(req)
    const peers = this.findNodeWifiPeers(uuid)
    return peers.forEach(peer => {
      this.sendRequestToNode(peer.node.uuid, jsonRequest)
    })
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLE NODE REQUEST
   *
   * * * * * * * * * * * * * * * */
  sendRequestToNode (uuid, jsonReq) {
    // Be careful with JSON objects
    const req = JSON.parse(jsonReq)
    console.log(`🌏 send request ${req.id} to`, uuid)
    const node = this.findNode(uuid)
    if (!node) return
    // [WIP] Work on delay better
    const delay = Math.random() * 200 + 100
    window.setTimeout(() => node.core.receive(req), delay)
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
