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
	}

	createNode(x, y) {
		const name = this.generateNewNodeName()
		this.nodes.push(new Node(name, x, y, this))
		draw()
		return this
	}

	generateNewNodeName () {
		this.nodeNamesGiven ++
		return Network.nodeNamesList[this.nodeNamesGiven - 1]
	}

	static nodeNamesList = GLOBALS.namesList
		.map(name => ({ name, score: Math.random() }))
		.sort((a, b) => a.score - b.score)
		.map(obj => obj.name)

  generateFakeDelay () { return Math.random() * 400 + 200 }

	async findPeersNamesOf (inputNode) {
		const { posX: inputX, posY: inputY } = inputNode
		return new Promise((resolve, reject) => {
			const fakeDelay = this.generateFakeDelay()
			setTimeout(() => {
				resolve([...this.nodes.filter(node => {
					if (node.name === inputNode.name) return false
					const distanceX = Math.abs(node.posX - inputX)
					const distanceY = Math.abs(node.posY - inputY)
					const distance = Math.sqrt(Math.pow(distanceX, 2)+ Math.pow(distanceY, 2))
					return distance < 110
				})].map(node => node.name))
			}, fakeDelay)
		}) 
	}

	async fetch ({ requester, recipient, subject, data }) {
		console.log(requester, subject, '->', recipient, ':', data)
		const foundRecipient = this.nodes.filter(node => node.name === recipient)
		return new Promise((resolve, reject) => {
			const fakeDelay = this.generateFakeDelay()
			setTimeout(() => {
				const response = foundRecipient.receive({ requester, recipient, subject, data })
				resolve(response)
			}, fakeDelay)
		})
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
		this.peersRegister = []
		this.keysRegister = []
		this.init()
	}

	async init () {
		this.generateKeys()
		const peersNames = await network.findPeersNamesOf(this)
		this.peersRegister.push(...peersNames.map(name => ({ name })))
		const allSaluted = Promise.all(this.peersRegister.map(peer => this.salute(peer.name)))
		draw()
		return this
	}

	generateKeys () {
		const pub = Math.random().toString(36).slice(2)
		const priv = pub.split('').reverse().join('')
		const gen = Date.now()
		this.keysRegister.push({ public: pub, private: priv, generatedOn: gen })
		return this
	}

	get keys () {
		return this.keysRegister[this.keysRegister.length - 1]
	}

	get publicKey () { return this.keys.public }
	get privateKey () { return this.keys.private }
	get keysGeneratedOn () { return this.keys.generatedOn }

	async salute(peerName) {
		const response = await network.fetch({
			requester: this.name,
			recipient: peerName,
			subject: 'new-key',
			data: {
				public: this.publicKey,
				generatedOn: this.keysGeneratedOn
				signature: null
			}
		})
		console.log(response)
		// [WIP] now we have a connexion (or not)
	}

	receive ({ requester, recipient, subject, data } => {
		switch (subject) {
			case 'new-key':
				const success = this.trySaveKeyLog({
					peer: requester,
					public: data.public,
					signature: data.signature,
					generatedOn: data.generatedOn
				})
				if (success) return {
					status: 200,
					data: {
						public: this.publicKey,
						generatedOn: this.generatedOn
					}
				} else return {
					status: 500,
					err: 'Key not accepted.'
				}
			default return { err: '' }
		}
	})

	trySaveKeyLog ({ peer, public, signature, generatedOn }) {
		if (!signature && !this.isNeighbourOf(peer)) {

		}
		if (!signature && this.isNeighbourOf(peer)) {
			const 
		}
	}
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
	network.nodes.forEach(node => {
		const { posX, posY, name } = node
		drawCircle(posX, posY, 100, 0, 'rgba(0, 0, 0, .2)', 'rgba(0, 0, 0, 0)')
		drawCircle(posX, posY, 6, 0, '#ff0000', '#ff0000')
		printName(posX + 10, posY + 4, name)
	})
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

const printName = (x, y, name) => {
	context.font = '12px Arial'
	context.fillText(name, x, y)
}
