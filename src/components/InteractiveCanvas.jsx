import { useEffect, useRef, useState } from 'react'
import { sendPoint } from '../services/realtimeService.js'
export default function InteractiveCanvas({ initialPoints = [], onSave, width = 520, height = 360, author, name, rtMode }) {
  const ref = useRef(null)
  const [points, setPoints] = useState(initialPoints)

  // Redibujar cada vez que cambian los puntos
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fondo
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Cuadrícula
    ctx.strokeStyle = 'rgba(148,163,184,0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    // Segmentos
    if (points.length > 1) {
      ctx.strokeStyle = '#93c5fd'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
      ctx.stroke()
    }

    // Puntos
    ctx.fillStyle = '#fbbf24'
    for (const p of points) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [points])

  // Sincronizar si cambian los puntos iniciales desde afuera
  useEffect(() => {
    setPoints(initialPoints)
  }, [initialPoints])

  const handleClick = (e) => {
    const canvas = ref.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    const point = { x, y }
    setPoints(prev => [...prev, point])

    if (rtMode === 'socketio') {
      sendPoint(author, name, point) //  enviar punto nuevo a través de Socket.IO
    }
  }

  const handleClear = () => setPoints([])

  return (
    <div>
      <canvas
        ref={ref}
        width={width}
        height={height}
        onClick={handleClick}
        style={{
          background: '#0b1220',
          border: '1px solid #334155',
          borderRadius: 12,
          width: '100%',
          maxWidth: width,
          cursor: 'crosshair',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn primary" onClick={() => onSave(points)}>
          Guardar
        </button>
        <button className="btn" onClick={handleClear}>
          Limpiar
        </button>
      </div>
    </div>
  )
}