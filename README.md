# Lab P4 — BluePrints en Tiempo Real (Sockets & STOMP)

> **Repositorio:** `DECSIS-ECI/Lab_P4_BluePrints_RealTime-Sokets`  
> **Front:** React + Vite (Canvas, CRUD, y selector de tecnología RT)  
> **Backends guía (elige uno o compáralos):**
> - **Socket.IO (Node.js):** https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md
> - **STOMP (Spring Boot):** https://github.com/DECSIS-ECI/example-backend-stopm/tree/main

## 🎯 Objetivo del laboratorio
Implementar **colaboración en tiempo real** para el caso de BluePrints. El Front consume la API CRUD de la Parte 3 (o equivalente) y habilita tiempo real usando **Socket.IO** o **STOMP**, para que múltiples clientes dibujen el mismo plano de forma simultánea.

Al finalizar, el equipo debe:
1. Integrar el Front con su **API CRUD** (listar/crear/actualizar/eliminar planos, y total de puntos por autor).
2. Conectar el Front a un backend de **tiempo real** (Socket.IO **o** STOMP) siguiendo los repos guía.
3. Demostrar **colaboración en vivo** (dos pestañas navegando el mismo plano).

---

## 🧩 Alcance y criterios funcionales
- **CRUD** (REST):
  - `GET /api/blueprints?author=:author` → lista por autor (incluye total de puntos).
  - `GET /api/blueprints/:author/:name` → puntos del plano.
  - `POST /api/blueprints` → crear.
  - `PUT /api/blueprints/:author/:name` → actualizar.
  - `DELETE /api/blueprints/:author/:name` → eliminar.
- **Tiempo real (RT)** (elige uno):
  - **Socket.IO** (rooms): `join-room`, `draw-event` → broadcast `blueprint-update`.
  - **STOMP** (topics): `@MessageMapping("/draw")` → `convertAndSend(/topic/blueprints.{author}.{name})`.
- **UI**:
  - Canvas con **dibujo por clic** (incremental).
  - Panel del autor: **tabla** de planos y **total de puntos** (`reduce`).
  - Barra de acciones: **Create / Save/Update / Delete** y **selector de tecnología** (None / Socket.IO / STOMP).
- **DX/Calidad**: código limpio, manejo de errores, README de equipo.

---

## 🏗️ Arquitectura (visión rápida)

```
React (Vite)
 ├─ HTTP (REST CRUD + estado inicial) ───────────────> Tu API (P3 / propia)
 └─ Tiempo Real (elige uno):
     ├─ Socket.IO: join-room / draw-event ──────────> Socket.IO Server (Node)
     └─ STOMP: /app/draw -> /topic/blueprints.* ────> Spring WebSocket/STOMP
```

**Convenciones recomendadas**  
- **Plano como canal/sala**: `blueprints.{author}.{name}`  
- **Payload de punto**: `{ x, y }`

---

## 📦 Repos guía (clona/consulta)
- **Socket.IO (Node.js)**: https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md  
  - *Uso típico en el cliente:* `io(VITE_IO_BASE, { transports: ['websocket'] })`, `join-room`, `draw-event`, `blueprint-update`.
- **STOMP (Spring Boot)**: https://github.com/DECSIS-ECI/example-backend-stopm/tree/main  
  - *Uso típico en el cliente:* `@stomp/stompjs` → `client.publish('/app/draw', body)`; suscripción a `/topic/blueprints.{author}.{name}`.

---

## ⚙️ Variables de entorno (Front)
Crea `.env.local` en la raíz del proyecto **Front**:
```bash
# REST (tu backend CRUD)
VITE_API_BASE=http://localhost:8080

# Tiempo real: apunta a uno u otro según el backend que uses
VITE_IO_BASE=http://localhost:3001     # si usas Socket.IO (Node)
VITE_STOMP_BASE=http://localhost:8080  # si usas STOMP (Spring)
```
En la UI, selecciona la tecnología en el **selector RT**.

---

## 🚀 Puesta en marcha

### 1) Backend RT (elige uno)

**Opción A — Socket.IO (Node.js)**  
Sigue el README del repo guía:  
https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md
```bash
npm i
npm run dev
# expone: http://localhost:3001
# prueba rápida del estado inicial:
curl http://localhost:3001/api/blueprints/juan/plano-1
```

**Opción B — STOMP (Spring Boot)**  
Sigue el repo guía:  
https://github.com/DECSIS-ECI/example-backend-stopm/tree/main
```bash
./mvnw spring-boot:run
# expone: http://localhost:8080
# endpoint WS (ej.): /ws-blueprints
```

### 2) Front (este repo)
```bash
npm i
npm run dev
# http://localhost:5173
```
En la interfaz: selecciona **Socket.IO** o **STOMP**, define `author` y `name`, abre **dos pestañas** y dibuja en el canvas (clics).

---

## 🔌 Protocolos de Tiempo Real (detalle mínimo)

### A) Socket.IO
- **Unirse a sala**
  ```js
  socket.emit('join-room', `blueprints.${author}.${name}`)
  ```
- **Enviar punto**
  ```js
  socket.emit('draw-event', { room, author, name, point: { x, y } })
  ```
- **Recibir actualización**
  ```js
  socket.on('blueprint-update', (upd) => { /* append points y repintar */ })
  ```

### B) STOMP
- **Publicar punto**
  ```js
  client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
  ```
- **Suscribirse a tópico**
  ```js
  client.subscribe(`/topic/blueprints.${author}.${name}`, (msg) => { /* append points y repintar */ })
  ```

---

## 🧪 Casos de prueba mínimos
- **Estado inicial**: al seleccionar plano, el canvas carga puntos (`GET /api/blueprints/:author/:name`).  
- **Dibujo local**: clic en canvas agrega puntos y redibuja.  
- **RT multi-pestaña**: con 2 pestañas, los puntos se **replican** casi en tiempo real.  
- **CRUD**: Create/Save/Delete funcionan y refrescan la lista y el **Total** del autor.

---

## 📊 Entregables del equipo
1. Código del Front integrado con **CRUD** y **RT** (Socket.IO o STOMP).  
2. **Video corto** (≤ 90s) mostrando colaboración en vivo y operaciones CRUD.  
3. **README del equipo**: setup, endpoints usados, decisiones (rooms/tópicos), y (opcional) breve comparativa Socket.IO vs STOMP.

---

## 🧮 Rúbrica sugerida
- **Funcionalidad (40%)**: RT estable (join/broadcast), aislamiento por plano, CRUD operativo.  
- **Calidad técnica (30%)**: estructura limpia, manejo de errores, documentación clara.  
- **Observabilidad/DX (15%)**: logs útiles (conexión, eventos), health checks básicos.  
- **Análisis (15%)**: hallazgos (latencia/reconexión) y, si aplica, pros/cons Socket.IO vs STOMP.

---

## 🩺 Troubleshooting
- **Pantalla en blanco (Front)**: revisa consola; confirma `@vitejs/plugin-react` instalado y que `AppP4.jsx` esté en `src/`.  
- **No hay broadcast**: ambas pestañas deben hacer `join-room` al **mismo** plano (Socket.IO) o suscribirse al **mismo tópico** (STOMP).  
- **CORS**: en dev permite `http://localhost:5173`; en prod, **restringe orígenes**.  
- **Socket.IO no conecta**: fuerza transporte WebSocket `{ transports: ['websocket'] }`.  
- **STOMP no recibe**: verifica `brokerURL`/`webSocketFactory` y los prefijos `/app` y `/topic` en Spring.

---

## 🔐 Seguridad (mínimos)
- Validación de payloads (p. ej., zod/joi).  
- Restricción de orígenes en prod.  
- Opcional: **JWT** + autorización por plano/sala.

---

## 📄 Licencia
MIT (o la definida por el curso/equipo).


--- 

# INFORME DE LABORATORIO

**AUTORES:**
- *Jacobo Diaz Alvarado*
- *Santiago Carmona Pineda*

## Entendiendo Sockets.IO

Se eligió `Socket.IO(Node.js)` porque es más fácil de levantar; simplemente hay que ejecutar `npm i` y `npm run dev`sin tener que configurar *Spring WebSocket*. Además, `Socket.IO(Node.js)`tiene menos dependencias, reconexión automátoca y tiene menos latencia percibida en desarrollo.

### Comparativa breve: Socket.IO vs STOMP

| Criterio | Socket.IO (Node.js) | STOMP (Spring) |
|---|---|---|
| Dificultad de setup | Baja: `npm i` + `npm run dev` | Media: requiere configurar broker/endpoints WS en Spring |
| Integración con este front | Directa (ya implementada en `realtimeService.js`) | Requiere activar flujo STOMP en UI y suscripción por tópico |
| Latencia percibida en desarrollo | Baja y estable para broadcast por room | Similar, pero depende más de configuración del broker |
| Reconexión y ergonomía cliente | Muy simple, reconexión integrada en `socket.io-client` | Flexible y estándar, con más configuración inicial |
| Acoplamiento tecnológico | Más orientado a ecosistema JS/Node | Mejor interoperabilidad en ecosistemas enterprise |

#### Punto 3 — Conclusión de la comparativa

Para este laboratorio se seleccionó **Socket.IO** por velocidad de implementación, menor fricción en pruebas multi‑pestaña y una curva de configuración más corta.
Si el proyecto creciera hacia integración empresarial o mensajería más estandarizada entre plataformas, **STOMP** sería una opción más fuerte por su interoperabilidad y modelo de tópicos.

## Decisiones RT

- **Sala/room:** `blueprints.{author}.{name}`
- **Payload de punto:** `{ x, y }`
- Cada plano tiene su propia sala — dibujar en `juan/plano-1` no afecta `ana/plano-2`


## PARTE I

### Creación de `realtimeService.js`

Encapsula toda la lógica de Socket.IO:
```js
import { io } from 'socket.io-client'

let socket = null

export function connectSocketIO(baseUrl) {
  if (socket) socket.disconnect()
  socket = io(baseUrl, { transports: ['websocket'] })
  socket.on('connect', () => console.log('[RT] conectado:', socket.id))
  socket.on('disconnect', () => console.log('[RT] desconectado'))
}

export function disconnectSocketIO() {
  if (socket) { socket.disconnect(); socket = null }
}

export function joinRoom(author, name) {
  if (!socket) return
  const room = `blueprints.${author}.${name}`
  socket.emit('join-room', room)
  console.log('[RT] join-room:', room)
}

export function sendPoint(author, name, point) {
  if (!socket) return
  socket.emit('draw-event', { room: `blueprints.${author}.${name}`, author, name, point })
}

export function onBlueprintUpdate(callback) {
  if (!socket) return
  socket.on('blueprint-update', callback)
}

export function offBlueprintUpdate() {
  if (!socket) return
  socket.off('blueprint-update')
}
```

### Refactorización de `InteractiveCanvas.jsx`

Se agregaron las props `author`, `name` y `rtMode`, y se emite el punto al servidor al hacer clic:
```js
import { sendPoint } from '../services/realtimeService.js'

export default function InteractiveCanvas({ initialPoints = [], onSave, 
  width = 520, height = 360, author, name, rtMode }) {

  const handleClick = (e) => {
    // ...cálculo de coordenadas
    const point = { x, y }
    setPoints(prev => [...prev, point])
    if (rtMode === 'socketio') {
      sendPoint(author, name, point)
    }
  }
}
```

### Refactorización de `BlueprintsPage.jsx`

Se agregó el selector RT, el `useEffect` de conexión y la lógica de `openBlueprint`:
```js
import { connectSocketIO, disconnectSocketIO, joinRoom,
         sendPoint, onBlueprintUpdate, offBlueprintUpdate } from '../services/realtimeService.js'

const [rtMode, setRtMode] = useState('none')

useEffect(() => {
  if (rtMode === 'socketio') {
    connectSocketIO(import.meta.env.VITE_IO_BASE)
  } else {
    disconnectSocketIO()
  }
  return () => disconnectSocketIO()
}, [rtMode])

const openBlueprint = (bp) => {
  setLastOpenedBp(bp)
  dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  if (rtMode === 'socketio') {
    offBlueprintUpdate()
    joinRoom(bp.author, bp.name)
    onBlueprintUpdate((upd) => {
      dispatch(appendPoint({ author: upd.author, name: upd.name, point: upd.points.at(-1) }))
    })
  }
}
```

Selector RT en el JSX:
```jsx
<select className="input" value={rtMode} onChange={e => setRtMode(e.target.value)}>
  None
  Socket.IO

```

### Refactorización de `blueprintsSlice.js`

Se agregó el reducer `appendPoint` para recibir puntos remotos y actualizar el estado:
```js
reducers: {
  appendPoint: (state, action) => {
    const { author, name, point } = action.payload
    const items = state.byAuthor[author]
    if (items) {
      const bp = items.find(b => b.name === name)
      if (bp) bp.points = [...(bp.points || []), point]
    }
    if (state.current?.author === author && state.current?.name === name) {
      state.current.points = [...(state.current.points || []), point]
    }
  },
},

export const { appendPoint } = slice.actions
```

### Creación de `.env.local`
```bash
VITE_API_BASE=http://localhost:8080
VITE_IO_BASE=http://localhost:3001
VITE_USE_MOCK=false
```

## PARTE II

## Casos de prueba

1. Abrir dos pestañas en `localhost:5173`
2. En ambas seleccionar **Socket.IO** y abrir el mismo plano
3. Dibujar en una pestaña → los puntos aparecen en la otra en < 1s
4. Verificar en consola: `[RT] join-room: blueprints.{autor}.{nombre}` igual en ambas

---

## Forma de ejecutarlo

1. Descomprimir `Lab05ARSW.zip` y ejecutar el backend CRUD con:
```bash
   cd Lab05ARSW
   mvn spring-boot:run
```

2. Descomprimir `example-backend-socketio-node-.zip` y ejecutar el backend de tiempo real con:
```bash
   cd example-backend-socketio-node-
   npm i
   npm run dev
```

3. Ejecutar el frontend con:
```bash
   npm i
   npm run dev
```
---

## PARTE III

**Video demostración de realtime**

Este se encuentra en la carpeta `video`.

