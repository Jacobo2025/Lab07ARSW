import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  selectTop5,
  deleteBlueprintThunk,
  updateBlueprintThunk,
  appendPoint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import InteractiveCanvas from '../components/InteractiveCanvas.jsx'
import {
  connectSocketIO,
  disconnectSocketIO,
  joinRoom,
  sendPoint,
  onBlueprintUpdate,
  offBlueprintUpdate,
} from '../services/realtimeService.js'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { byAuthor, current, fetchByAuthorStatus, fetchBlueprintStatus, error } = useSelector(
    (s) => s.blueprints,
  )
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [editingBp, setEditingBp] = useState(null)
  const [lastOpenedBp, setLastOpenedBp] = useState(null)
  const [rtMode, setRtMode] = useState('none')
  const items = byAuthor[selectedAuthor] || []
  const top5 = useSelector((state) => selectTop5(state, selectedAuthor))

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  useEffect(() => {
    if (rtMode === 'socketio') {
      connectSocketIO(import.meta.env.VITE_IO_BASE)
    } else {
      disconnectSocketIO()
    }
    return () => disconnectSocketIO()
  }, [rtMode])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = () => {
    if (!authorInput.trim()) return
    setSelectedAuthor(authorInput.trim())
    dispatch(fetchByAuthor(authorInput.trim()))
  }

  const openBlueprint = (bp) => {
    setLastOpenedBp(bp)
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))

    if (rtMode === 'socketio') {
      offBlueprintUpdate()
      joinRoom(bp.author, bp.name)
      onBlueprintUpdate((upd) => {
        dispatch(appendPoint({
          author: upd.author,
          name: upd.name,
          point: upd.points.at(-1),
        }))
      })
    }
  }

  const handleDelete = (bp) => {
    if (!confirm(`¿Eliminar "${bp.name}"?`)) return
    dispatch(deleteBlueprintThunk({ author: bp.author, name: bp.name }))
  }

  const handleEditStart = (bp) => {
    setEditingBp(bp)
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      {/* left: input + table */}
      <section className="grid" style={{ gap: 16 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <div className="search-bar">
            <input
              className="input"
              placeholder="Author"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && getBlueprints()}
            />
            <button className="btn primary" onClick={getBlueprints}>
              Get blueprints
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">
            {selectedAuthor ? `${selectedAuthor}'s blueprints` : 'Results'}
          </h3>
          {fetchByAuthorStatus === 'loading' && <p>Cargando blueprints...</p>}
          {fetchByAuthorStatus === 'failed' && (
            <div className="error-banner" role="alert">
              <span>Error: {error}</span>
              <button className="btn-retry" onClick={() => dispatch(fetchByAuthor(selectedAuthor))}>
                Reintentar
              </button>
            </div>
          )}

          {!items.length && fetchByAuthorStatus !== 'loading' && <p>Sin resultados.</p>}
          {!!items.length && (
            <div className="table-wrapper">
              <table className="bp-table">
                <thead>
                  <tr>
                    <th>Blueprint name</th>
                    <th className="text-right">Points</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => (
                    <tr key={bp.name}>
                      <td className="bp-name">{bp.name}</td>
                      <td className="text-right">
                        <span className="badge">{bp.points?.length || 0}</span>
                      </td>
                      <td className="text-right" style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm primary" onClick={() => openBlueprint(bp)}>
                          Open
                        </button>
                        <button className="btn btn-sm" onClick={() => handleEditStart(bp)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ color: '#f87171' }}
                          onClick={() => handleDelete(bp)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="total-points">
            Total user points: <strong>{totalPoints}</strong>
          </p>

          {top5.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Top 5 blueprints por puntos:</h4>
              {top5.map((bp, i) => (
                <p key={bp.name} style={{ margin: '4px 0' }}>
                  {i + 1}. {bp.name} — {bp.points?.length || 0} puntos
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* right: selector RT + nombre + canvas */}
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Current Blueprint</h3>

        <div className="field-group" style={{ marginBottom: 12 }}>
          <label className="field-label">Tecnología RT</label>
          <select
            className="input"
            value={rtMode}
            onChange={e => setRtMode(e.target.value)}
          >
            <option value="none">None</option>
            <option value="socketio">Socket.IO</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="current-bp-name">
            Blueprint name
          </label>
          <input
            id="current-bp-name"
            type="text"
            className="input current-blueprint-input"
            readOnly
            value={current?.name ?? ''}
            placeholder="No blueprint selected"
          />
        </div>

        {fetchBlueprintStatus === 'loading' && <p>Cargando plano...</p>}
        {fetchBlueprintStatus === 'failed' && (
          <div className="error-banner" role="alert">
            <span>Error al cargar el plano</span>
            {lastOpenedBp && (
              <button
                className="btn-retry"
                onClick={() =>
                  dispatch(fetchBlueprint({ author: lastOpenedBp.author, name: lastOpenedBp.name }))
                }
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <BlueprintCanvas id="blueprintCanvas" points={current?.points || []} />
        </div>

        {editingBp && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>Editando: {editingBp.name}</h4>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Haz clic en el canvas para agregar puntos
            </p>
            <InteractiveCanvas
              initialPoints={editingBp.points || []}
              author={editingBp.author}
              name={editingBp.name}
              rtMode={rtMode}
              onSave={(points) => {
                dispatch(
                  updateBlueprintThunk({ author: editingBp.author, name: editingBp.name, points }),
                )
                dispatch(fetchBlueprint({ author: editingBp.author, name: editingBp.name }))
                setEditingBp(null)
              }}
            />
            <button className="btn" style={{ marginTop: 8 }} onClick={() => setEditingBp(null)}>
              Cancelar
            </button>
          </div>
        )}
      </section>
    </div>
  )
}