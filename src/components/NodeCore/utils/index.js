const pick = list => {
  const pos = Math.floor(Math.random() * list.length)
  return list[pos]
}

export { pick }
