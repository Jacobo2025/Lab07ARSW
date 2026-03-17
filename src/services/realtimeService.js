import { io } from 'socket.io-client'

let socket = null

export function connectSocketIO(baseUrl) {
  if (socket) socket.disconnect()
  socket = io(baseUrl, { transports: ['websocket'] })
  socket.on('connect', () => console.log('[RT] conectado:', socket.id))
  socket.on('disconnect', () => console.log('[RT] desconectado'))
}

export function disconnectSocketIO() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinRoom(author, name) {
  if (!socket) return
  const room = `blueprints.${author}.${name}`
  socket.emit('join-room', room)
  console.log('[RT] join-room:', room)
}

export function sendPoint(author, name, point) {
  if (!socket) return
  socket.emit('draw-event', {
    room: `blueprints.${author}.${name}`,
    author, name, point
  })
}

export function onBlueprintUpdate(callback) {
  if (!socket) return
  socket.on('blueprint-update', callback)
}

export function offBlueprintUpdate() {
  if (!socket) return
  socket.off('blueprint-update')
}