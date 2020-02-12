import React, { useState, useEffect, useRef } from 'react'

function PhysicalWorld (props) {
  /* State & props */
  const [rawZoom, setRawZoom] = useState(0)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  /* Refs */
  const $root = useRef()
  
  /* Effects */
  useEffect(() => {
    setViewport({
      width: $root.current.clientWidth,
      height: $root.current.clientHeight
    })
    window.addEventListener('resize', e => {
      setViewport({
        width: $root.current.clientWidth,
        height: $root.current.clientHeight
      })
    })
  }, [])

  /* Handlers */
  function scrollHandler (e) {
    const direction = e.deltaY < 0
    if (rawZoom > 14 && direction) return
    if (rawZoom < -14 && !direction) return
    const increment = direction ? 1 : -1
    return setRawZoom(rawZoom + increment)
  }

  /* Inner logic */
  const zoom = (rawZoom + 15) / 30
  const scale = (1e2 - 1e-1) * Math.pow(zoom, 4) + 1e-1
  const readableScale = scale >= 1e3
    ? `${(scale / 1e3).toString().slice(0, 3)} km`
    : scale >= 1e0
    ? `${(scale).toString().slice(0, 3)} m`
    : `${(scale * 100).toString().slice(0, 3)} cm`
  const nb50cmVerticals = scale * (viewport.width / 50)
  const nb50cmHorizontals = scale * (viewport.height / 50)
  console.log(nb50cmVerticals, nb50cmHorizontals)

  /* Assign classes */
  const c = 'physical-world'
  const classes = [c]

  /* Render */
  return <div
    ref={$root}
    onWheel={scrollHandler}
    className={classes.join(' ')}>
    <div className={`${c}__distances-grid`}>
      Physical World
    </div>
  </div>
}

export default PhysicalWorld
