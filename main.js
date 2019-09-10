/* //////////////////////////////////////////////////////////////////////////////////////////
 * //////////////////////////////////////////////////////////////////////////////////////////
 *
 * 
 * OBJECTS
 *
 *
 * //////////////////////////////////////////////////////////////////////////////////////////
 * ////////////////////////////////////////////////////////////////////////////////////////// */

/* * * * * * * * * * * * * * * * *
 *
 * NETWORK
 *
 * * * * * * * * * * * * * * * * */
class Network {
	constructor () {
		this.nodes = []
		this.nodeNamesGiven = 0
		this.messagesCnt = 0
		this.bitsCnt = 0
	}

	createNode(x, y) {
		const name = this.generateNewNodeName()
		this.nodes.push(new Node(name, x, y, this))
		draw()
		return this
	}

	generateNewNodeName () {
		this.nodeNamesGiven ++
		return GLOBALS.namesList
			.map(name => ({ name, score: Math.random() }))
			.sort((a, b) => a.score - b.score)
			.map(obj => obj.name)[this.nodeNamesGiven - 1]
	}

  generateFakeDelay () { return Math.random() * 400 + 200 }

  async connect (name) {
  	return new Promise((resolve, reject) => {
  		setTimeout(() => {
  			const node = this.getNode(name)
  			const peersNames = this.findPeersNamesOf(node)
				if (!peersNames.length) {
					return resolve(peersNames)
				} else {
					this.getNode(name).connectTo(...peersNames)
  				peersNames.forEach(peerName => this.getNode(peerName).connectTo(name))
  				return resolve(peersNames)
				}
  		}, this.generateFakeDelay())
  	})
  }

  getNode (name) {
  	return this.nodes.filter(node => node.name === name)[0]
  }

	findPeersNamesOf (inputNode) {
		const { posX: inputX, posY: inputY } = inputNode
		const peersNames = [...this.nodes.filter(node => {
				if (node.name === inputNode.name) return false
				const distanceX = Math.abs(node.posX - inputX)
				const distanceY = Math.abs(node.posY - inputY)
				const distance = Math.sqrt(Math.pow(distanceX, 2)+ Math.pow(distanceY, 2))
				return distance < 110
			})].map(node => node.name)
		return peersNames
	}

	send (senderName, receiverName, message) {
		this.messagesCnt ++
		this.bitsCnt += JSON.stringify(message).length
		console.log(senderName, '>', receiverName, message)
		// console.log(this.nodes.length, this.messagesCnt, this.bitsCnt)
    setTimeout(() => {
    	const receiver = this.nodes.filter(node => node.name === receiverName)[0]
    	receiver.receiveBroadcast(senderName, JSON.parse(JSON.stringify(message)))
    } , this.generateFakeDelay())
	}
}

const network = new Network()

/* * * * * * * * * * * * * * * * *
 *
 * NODE
 *
 * * * * * * * * * * * * * * * * */
class Node {
	constructor (name, x, y, parentNetwork) {
		this.name = name
		this.posX = x
		this.posY = y
		this.peersNames = []
		this.inbox = {
			broadcasts: []
		}
		this.paths = []
		this.start()
	}

	print() { 
		//console.log(...arguments)
	}

	async start () {
		this.print(this.name, 'starting...')
		const connectResponse = await network.connect(this.name)
		if (this.peersNames.length) {
			this.print(this.name, 'peers:', this.peersNames)
			const message = this.prepareBroadcastMessage('hello world!')
			this.propagateBroadcast(message)
		} else this.print(this.name, 'no peers :(')
		draw()
		return this
	}

	connectTo (name) {
		const newPeersNames = [...this.peersNames]
		newPeersNames.push(name)
		this.peersNames = [...new Set(newPeersNames)]
		return this
	}

	prepareBroadcastMessage (message) {
		const id = Math.random().toString(36).slice(2, 10)
		const sent_on = Date.now()
		return {
			id,
			message,
			sender: this.name,
			sent_on,
			path: []
		}
	}

	propagateBroadcast (message, exceptions = []) {
		const broadcastList = this.peersNames.filter(peerName => exceptions.indexOf(peerName) === -1)
		if (!broadcastList.length) return this.print(this.name, 'everybody in my network received the message:', message)
		message.path.push(this.name)
		this.print(this.name, 'broadcasting:', message, 'to:', broadcastList)
		broadcastList.map(peerName => {
			network.send(this.name, peerName, message)
		})
	}

	receiveBroadcast (from, message) {
		this.print(this.name, 'receiving:', message, 'from:', from)
		this.storeBroadcast({ from, message })
		this.storePath({
			sent_on: message.sent_on,
			path: message.path,
			received_on: Date.now()
		})
		const alreadyReceived = this.inbox.broadcasts.filter(log => log.message.id === message.id).length > 1
		if (alreadyReceived) return this.print(this.name, 'already received this message, i\'m not fwding')
		else return this.propagateBroadcast(message, [from])
	}

	storeBroadcast (log) {
		this.inbox.broadcasts.push(JSON.parse(JSON.stringify(log)))
	}

	storePath (log) {
		this.paths.push(JSON.parse(JSON.stringify(log)))
	}

	get knownAddresses () {
		const addresses = []
		this.paths.forEach(log => log.path.forEach(name => addresses.push(name)))
		return [...new Set(addresses)]
	}

	getPathsTo (name) {
		if (this.knownAddresses.indexOf(name) === -1) return []
		const pathsContainingName = [...this.paths].filter(log => {
			return log.path.indexOf(name) > -1
		})
		console.log(pathsContainingName)
	}



	// generateKeys () {
	// 	const pub = Math.random().toString(36).slice(2)
	// 	const priv = pub.split('').reverse().join('')
	// 	const gen = Date.now()
	// 	this.keysRegister.push({ public: pub, private: priv, generatedOn: gen })
	// 	return this
	// }

	// get keys () {
	// 	return this.keysRegister[this.keysRegister.length - 1]
	// }

	// get publicKey () { return this.keys.public }
	// get privateKey () { return this.keys.private }
	// get keysGeneratedOn () { return this.keys.generatedOn }

	// async salute(peerName) {
	// 	const response = await network.fetch({
	// 		requester: this.name,
	// 		recipient: peerName,
	// 		subject: 'new-key',
	// 		data: {
	// 			public: this.publicKey,
	// 			generatedOn: this.keysGeneratedOn
	// 			signature: null
	// 		}
	// 	})
	// 	console.log(response)
	// 	// [WIP] now we have a connexion (or not)
	// }

	// receive ({ requester, recipient, subject, data } => {
	// 	switch (subject) {
	// 		case 'new-key':
	// 			const success = this.trySaveKeyLog({
	// 				peer: requester,
	// 				public: data.public,
	// 				signature: data.signature,
	// 				generatedOn: data.generatedOn
	// 			})
	// 			if (success) return {
	// 				status: 200,
	// 				data: {
	// 					public: this.publicKey,
	// 					generatedOn: this.generatedOn
	// 				}
	// 			} else return {
	// 				status: 500,
	// 				err: 'Key not accepted.'
	// 			}
	// 		default return { err: '' }
	// 	}
	// })

	// trySaveKeyLog ({ peer, public, signature, generatedOn }) {
	// 	if (!signature && !this.isNeighbourOf(peer)) {

	// 	}
	// 	if (!signature && this.isNeighbourOf(peer)) {
	// 		const 
	// 	}
	// }
}

/* //////////////////////////////////////////////////////////////////////////////////////////
 * //////////////////////////////////////////////////////////////////////////////////////////
 *
 * 
 * SCREEN STUFF
 *
 *
 * //////////////////////////////////////////////////////////////////////////////////////////
 * ////////////////////////////////////////////////////////////////////////////////////////// */

let context

document.addEventListener('DOMContentLoaded', () => {
  var canvas = document.getElementById('canvas')
  var circles = []
  var radius = 50
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  context = canvas.getContext('2d')
}, false)

document.addEventListener('click', e => {
	network.createNode(e.clientX, e.clientY)
})

const draw = () => {
	context.clearRect(0, 0, canvas.width, canvas.height)
	// Reach areas of nodes
  network.nodes.forEach(node => {
	  const { posX, posY } = node
		drawCircle(posX, posY, 100, 0, 'rgba(0, 0, 0, .05)', 'rgba(0, 0, 0, 0)')
	})

	// Wifi connections
	network.nodes.forEach(node => {
		const { posX, posY, name } = node
		node.peersNames.forEach(peerName => {
			const { posX: peerPosX, posY: peerPosY } = network.getNode(peerName)
			drawLine(posX, posY, peerPosX, peerPosY, 2, 'rgba(0, 0, 0, 0.2)')
		})
	})

  // Nodes and names
	network.nodes.forEach(node => {
		const { posX, posY, name } = node
		const radius = 6 + node.knownAddresses.length / 2
		drawCircle(posX, posY, radius, 0, '#ff0000', '#ff0000')
		printName(posX + 10, posY + 4, name)
	})

	// [WIP] fill graphs of "who knows me?"
}

const drawCircle = (x, y, radius, border, borderColor, fillColour) => {
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
  context.strokeStyle = borderColor
  context.fillStyle = fillColour
  context.lineWidth = border
  context.closePath()
  context.fill()
  context.stroke()
}

const drawLine = (x1, y1, x2, y2, border, borderColor) => {
	context.beginPath()
	context.moveTo(x1, y1)
	context.lineTo(x2, y2)
	context.strokeStyle = borderColor
	context.lineWidth = border
	context.stroke()
}

const printName = (x, y, name) => {
	context.font = '12px Arial'
	context.fillText(name, x, y)
}
