import React, { Component } from 'react'
import {
  LayerGroup,
  Circle,
  CircleMarker,
  Tooltip,
  Polyline
} from 'react-leaflet'
import haversine from 'haversine-distance'
import uuid from 'uuid'
import RasterMap from '../RasterMap'
import NodeCore from '../NodeCore'
import {
  TURN_ON,
  TURN_OFF,
  LOG_REQUEST
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
    this.state = {
      nodes: [],
      data_transfers: []
    }
    this.handleMapClick = this.handleMapClick.bind(this)
    this.generateNode = this.generateNode.bind(this)
    this.handleNodeUpdate = this.handleNodeUpdate.bind(this)
    this.findNode = this.findNode.bind(this)
    this.findNodeWifiPeers = this.findNodeWifiPeers.bind(this)
    this.handleNodeCoreDataEmition = this.handleNodeCoreDataEmition.bind(this)
    this.emitDataToNodeCore = this.emitDataToNodeCore.bind(this)
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
      emit: req => this.handleNodeCoreDataEmition(newNodeUuid, req)
    })
    return {
      uuid: newNodeUuid,
      latlng: latlng,
      core: newNodeCore,
      wifi_signal_reach: Math.sin(Math.random() * Math.PI) * 50 + 50,
      max_wifi_bits_per_sec: Math.random() * (500e6 - 1e6) + 1e6
    }
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLE NODE UPDATES
   *
   * * * * * * * * * * * * * * * */
  handleNodeUpdate (uuid, action, payload) {
    const node = this.findNode(uuid)
    if (!node) return
    node.state_footprint = Math.random().toString().slice(2)
    switch (action) {
      case TURN_ON:
      case TURN_OFF:
        return this.forceUpdate()
      case LOG_REQUEST:
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
    const thisNode = this.findNode(uuid)
    if (!thisNode || !thisNode.core.state.is_up) return
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
        return peer.distance <= peer.node.wifi_signal_reach
      })
    return peers
  }

  /* * * * * * * * * * * * * * * *
   *
   * HANDLE NODE CORE DATA EMITION
   *
   * * * * * * * * * * * * * * * */
  handleNodeCoreDataEmition (uuid, data) {
    if (typeof data !== 'string') return
    const node = this.findNode(uuid)
    const peers = this.findNodeWifiPeers(uuid)
    if (!peers || !node) return
    peers.forEach(peer => {
      const dataTransfer = {
        id: Math.random().toString().slice(2),
        data,
        emited_on: Date.now(),
        size_in_bytes: Math.ceil(data.length / 8),
        route: {
          from: peer.node.uuid,
          to: node.uuid,
          from_latlng: peer.node.latlng,
          to_latlng: node.latlng,
          bits_per_sec: peer.node.max_wifi_bits_per_sec
        }
      }
      this.setState((prev, props) => ({
        data_transfers: [
          ...prev.data_transfers,
          dataTransfer
        ]
      }))
      this.emitDataToNodeCore(peer.node.uuid, dataTransfer)
    })
  }

  /* * * * * * * * * * * * * * * *
   *
   * EMIT DATA TRANSFER TO NODE CORE
   *
   * * * * * * * * * * * * * * * */
  emitDataToNodeCore (uuid, dataTransfer) {
    const node = this.findNode(uuid)
    if (!node) return
    const delay = Math.random() * 1500 + 500
    window.setTimeout(
      () => {
        this.setState((prev, props) => ({
          data_transfers: [
            ...prev.data_transfers.filter(d => d.id !== dataTransfer.id)
          ]
        }))
        node.core.receive(dataTransfer.data)
      },
      delay
    )
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
    const routes = this.state.nodes.map(node => {
      const peers = this.findNodeWifiPeers(node.uuid)
      if (!peers) return []
      return peers.map(peer => ({
        from: peer.node.uuid,
        to: node.uuid,
        from_latlng: peer.node.latlng,
        to_latlng: node.latlng,
        bits_per_sec: peer.node.max_wifi_bits_per_sec
      }))
    }).flat()

    /* Assign classes */
    const classes = [this.c]

    /* Render */
    return <div
      className={classes.join(' ')}>
      <RasterMap
        onClick={this.handleMapClick}
        center={[48.870812, 2.376566]}
        tilesUrl={'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'}
        zoom={17}>
        <LayerGroup>{
          // Wifi ranges
          nodes
            .filter(node => node.is_up)
            .map(node => {
              return <Circle
                className={'node-wifi-reach'}
                key={node.state_footprint}
                center={node.latlng}
                stroke={false}
                fillColor={'cornflowerblue'}
                fillOpacity={0.02}
                radius={node.wifi_signal_reach} />
            })
        }</LayerGroup>

        <LayerGroup>{
          // Wifi routes
          routes
            .map(route => {
              return <Polyline
                className={'route'}
                key={`${route.from_latlng}_${route.to_latlng}`}
                positions={[route.from_latlng, route.to_latlng]}
                color={'white'}
                opacity={0.02}
                weight={route.bits_per_sec / 1e6 / (500 / 40)} />
            })
        }</LayerGroup>

        <LayerGroup>{
          // Data transfers
          this.state.data_transfers
            .map(dataTransfer => {
              return <Polyline
                className={'data-transfer'}
                key={dataTransfer.id}
                positions={[dataTransfer.route.from_latlng, dataTransfer.route.to_latlng]}
                color={'orange'}
                opacity={0.7}
                weight={dataTransfer.route.bits_per_sec / 1e6 / (500 / 20)} />
            })
        }</LayerGroup>

        <LayerGroup>{
          // Nodes
          nodes.map(node => {
            return <CircleMarker
              className={'node'}
              key={node.state_footprint}
              radius={3}
              fill={true}
              fillColor={node.is_up ? '#0f0' : 'red'}
              fillOpacity={1}
              stroke={false}
              center={node.latlng}>
              <Tooltip>
                {node.face} {node.name}<br/>
                out_requests: {node.state.out_requests_log.length}
              </Tooltip>
            </CircleMarker>
          })
        }</LayerGroup>

      </RasterMap>
    </div>
  }
}

export default PhysicalWorld
