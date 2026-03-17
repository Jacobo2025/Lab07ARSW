import { describe, it, expect } from 'vitest'
import reducer, {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  deleteBlueprintThunk,
  updateBlueprintThunk,
  selectTop5,
} from '../src/features/blueprints/blueprintsSlice.js'

// ── Helpers ────────────────────────────────────────────────────────────────
const INITIAL = reducer(undefined, { type: '@@INIT' })

const bp = (name, pointCount) => ({
  author: 'hemingway',
  name,
  points: Array.from({ length: pointCount }, (_, i) => ({ x: i, y: i })),
})

// ── Initial state ──────────────────────────────────────────────────────────
describe('blueprints slice — initial state', () => {
  it('has empty authors array', () => {
    expect(INITIAL.authors).toEqual([])
  })
  it('has empty byAuthor map', () => {
    expect(INITIAL.byAuthor).toEqual({})
  })
  it('has null current', () => {
    expect(INITIAL.current).toBeNull()
  })
  it('has all statuses as idle', () => {
    expect(INITIAL.fetchAuthorsStatus).toBe('idle')
    expect(INITIAL.fetchByAuthorStatus).toBe('idle')
    expect(INITIAL.fetchBlueprintStatus).toBe('idle')
    expect(INITIAL.createBlueprintStatus).toBe('idle')
  })
  it('has null error', () => {
    expect(INITIAL.error).toBeNull()
  })
})

// ── fetchAuthors ────────────────────────────────────────────────────────────
describe('fetchAuthors', () => {
  it('pending → fetchAuthorsStatus = loading', () => {
    const state = reducer(INITIAL, fetchAuthors.pending('req'))
    expect(state.fetchAuthorsStatus).toBe('loading')
  })

  it('fulfilled → sets authors and status = succeeded', () => {
    const state = reducer(INITIAL, fetchAuthors.fulfilled(['hemingway', 'kafka'], 'req'))
    expect(state.fetchAuthorsStatus).toBe('succeeded')
    expect(state.authors).toEqual(['hemingway', 'kafka'])
  })

  it('rejected → fetchAuthorsStatus = failed and stores error', () => {
    const state = reducer(INITIAL, fetchAuthors.rejected(new Error('net error'), 'req'))
    expect(state.fetchAuthorsStatus).toBe('failed')
    expect(state.error).toBe('net error')
  })
})

// ── fetchByAuthor ───────────────────────────────────────────────────────────
describe('fetchByAuthor', () => {
  it('pending → fetchByAuthorStatus = loading', () => {
    const state = reducer(INITIAL, fetchByAuthor.pending('req', 'hemingway'))
    expect(state.fetchByAuthorStatus).toBe('loading')
  })

  it('fulfilled → stores blueprints for the author', () => {
    const items = [bp('plano1', 3), bp('plano2', 5)]
    const state = reducer(
      INITIAL,
      fetchByAuthor.fulfilled({ author: 'hemingway', items }, 'req', 'hemingway'),
    )
    expect(state.fetchByAuthorStatus).toBe('succeeded')
    expect(state.byAuthor['hemingway']).toEqual(items)
  })

  it('rejected → fetchByAuthorStatus = failed and stores error', () => {
    const state = reducer(INITIAL, fetchByAuthor.rejected(new Error('not found'), 'req', 'unknown'))
    expect(state.fetchByAuthorStatus).toBe('failed')
    expect(state.error).toBe('not found')
  })
})

// ── fetchBlueprint ──────────────────────────────────────────────────────────
describe('fetchBlueprint', () => {
  it('pending → fetchBlueprintStatus = loading', () => {
    const state = reducer(INITIAL, fetchBlueprint.pending('req', { author: 'a', name: 'b' }))
    expect(state.fetchBlueprintStatus).toBe('loading')
  })

  it('fulfilled → sets current blueprint', () => {
    const blueprint = bp('plano1', 4)
    const state = reducer(
      INITIAL,
      fetchBlueprint.fulfilled(blueprint, 'req', { author: 'hemingway', name: 'plano1' }),
    )
    expect(state.fetchBlueprintStatus).toBe('succeeded')
    expect(state.current).toEqual(blueprint)
  })

  it('rejected → fetchBlueprintStatus = failed and stores error', () => {
    const state = reducer(
      INITIAL,
      fetchBlueprint.rejected(new Error('no blueprint'), 'req', { author: 'a', name: 'b' }),
    )
    expect(state.fetchBlueprintStatus).toBe('failed')
    expect(state.error).toBe('no blueprint')
  })
})

// ── deleteBlueprintThunk ────────────────────────────────────────────────────
describe('deleteBlueprintThunk', () => {
  const withItems = {
    ...INITIAL,
    byAuthor: { hemingway: [bp('plano1', 2), bp('plano2', 3)] },
  }

  it('pending → optimistically removes blueprint from list', () => {
    const state = reducer(
      withItems,
      deleteBlueprintThunk.pending('req', { author: 'hemingway', name: 'plano1' }),
    )
    expect(state.byAuthor['hemingway'].map((b) => b.name)).toEqual(['plano2'])
  })

  it('rejected → reverts list to prevItems', () => {
    const prevItems = withItems.byAuthor['hemingway']
    const state = reducer(withItems, {
      type: deleteBlueprintThunk.rejected.type,
      payload: { author: 'hemingway', prevItems },
      error: { message: 'server error' },
    })
    expect(state.byAuthor['hemingway']).toEqual(prevItems)
    expect(state.error).toBe('Error al eliminar el blueprint')
  })
})

// ── updateBlueprintThunk ────────────────────────────────────────────────────
describe('updateBlueprintThunk', () => {
  const original = bp('plano1', 2)
  const withItems = {
    ...INITIAL,
    byAuthor: { hemingway: [original] },
  }
  const newPoints = [
    { x: 99, y: 99 },
    { x: 88, y: 88 },
    { x: 77, y: 77 },
  ]

  it('pending → optimistically updates points', () => {
    const state = reducer(
      withItems,
      updateBlueprintThunk.pending('req', {
        author: 'hemingway',
        name: 'plano1',
        points: newPoints,
      }),
    )
    expect(state.byAuthor['hemingway'][0].points).toEqual(newPoints)
  })

  it('fulfilled → replaces blueprint with server response', () => {
    const updated = { ...original, points: newPoints, extra: 'fromServer' }
    const state = reducer(
      withItems,
      updateBlueprintThunk.fulfilled({ author: 'hemingway', name: 'plano1', updated }, 'req', {
        author: 'hemingway',
        name: 'plano1',
        points: newPoints,
      }),
    )
    expect(state.byAuthor['hemingway'][0]).toEqual(updated)
  })

  it('rejected → reverts blueprint to prevBlueprint', () => {
    const state = reducer(withItems, {
      type: updateBlueprintThunk.rejected.type,
      payload: { author: 'hemingway', name: 'plano1', prevBlueprint: original },
      error: { message: 'server error' },
    })
    expect(state.byAuthor['hemingway'][0]).toEqual(original)
    expect(state.error).toBe('Error al actualizar el blueprint')
  })
})

// ── selectTop5 ─────────────────────────────────────────────────────────────
describe('selectTop5', () => {
  const makeState = (items) => ({
    blueprints: { ...INITIAL, byAuthor: { hemingway: items } },
  })

  it('returns empty array when author has no blueprints', () => {
    const state = makeState([])
    expect(selectTop5(state, 'hemingway')).toEqual([])
  })

  it('returns blueprints sorted by point count descending', () => {
    const items = [bp('a', 1), bp('b', 5), bp('c', 3)]
    const result = selectTop5(makeState(items), 'hemingway')
    expect(result.map((b) => b.name)).toEqual(['b', 'c', 'a'])
  })

  it('limits result to 5 even when more blueprints exist', () => {
    const items = [bp('a', 6), bp('b', 5), bp('c', 4), bp('d', 3), bp('e', 2), bp('f', 1)]
    const result = selectTop5(makeState(items), 'hemingway')
    expect(result).toHaveLength(5)
    expect(result[0].name).toBe('a')
  })

  it('returns empty array for unknown author', () => {
    const state = makeState([bp('x', 2)])
    expect(selectTop5(state, 'unknown')).toEqual([])
  })
})
