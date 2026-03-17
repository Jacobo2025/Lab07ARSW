import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createSelector } from 'reselect'
import { getAll, getByAuthor, getByAuthorAndName, create, deleteBlueprint, updateBlueprint } from '../../services/mocks/blueprintsService.js'

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
  const blueprints = await getAll()
  return [...new Set(blueprints.map(bp => bp.author))]
})

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
  const items = await getByAuthor(author)
  return { author, items }
})

export const fetchBlueprint = createAsyncThunk('blueprints/fetchBlueprint', async ({ author, name }) => {
  return await getByAuthorAndName(author, name)
})

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
  return await create(payload)
})

export const deleteBlueprintThunk = createAsyncThunk(
  'blueprints/deleteBlueprint',
  async ({ author, name }, { getState, rejectWithValue }) => {
    const state = getState()
    const prevItems = state.blueprints.byAuthor[author] || []
    try {
      await deleteBlueprint(author, name)
      return { author, name }
    } catch (e) {
      return rejectWithValue({ author, prevItems })
    }
  }
)

export const updateBlueprintThunk = createAsyncThunk(
  'blueprints/updateBlueprint',
  async ({ author, name, points }, { getState, rejectWithValue }) => {
    const state = getState()
    const prevBlueprint = state.blueprints.byAuthor[author]?.find(bp => bp.name === name)
    try {
      const updated = await updateBlueprint(author, name, points)
      return { author, name, updated }
    } catch (e) {
      return rejectWithValue({ author, name, prevBlueprint })
    }
  }
)

const slice = createSlice({
  name: 'blueprints',
  initialState: {
    authors: [],
    byAuthor: {},
    current: null,
    fetchAuthorsStatus: 'idle',
    fetchByAuthorStatus: 'idle',
    fetchBlueprintStatus: 'idle',
    createBlueprintStatus: 'idle',
    error: null,
  },
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthors.pending, (s) => { s.fetchAuthorsStatus = 'loading' })
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        s.fetchAuthorsStatus = 'succeeded'
        s.authors = a.payload
      })
      .addCase(fetchAuthors.rejected, (s, a) => {
        s.fetchAuthorsStatus = 'failed'
        s.error = a.error.message
      })

      .addCase(fetchByAuthor.pending, (s) => { s.fetchByAuthorStatus = 'loading' })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.fetchByAuthorStatus = 'succeeded'
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.fetchByAuthorStatus = 'failed'
        s.error = a.error.message
      })

      .addCase(fetchBlueprint.pending, (s) => { s.fetchBlueprintStatus = 'loading' })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.fetchBlueprintStatus = 'succeeded'
        s.current = a.payload
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.fetchBlueprintStatus = 'failed'
        s.error = a.error.message
      })

      .addCase(deleteBlueprintThunk.pending, (s, a) => {
        const { author, name } = a.meta.arg
        s.byAuthor[author] = (s.byAuthor[author] || []).filter(bp => bp.name !== name)
      })
      .addCase(deleteBlueprintThunk.rejected, (s, a) => {
        const { author, prevItems } = a.payload
        s.byAuthor[author] = prevItems
        s.error = 'Error al eliminar el blueprint'
      })

      .addCase(updateBlueprintThunk.pending, (s, a) => {
        const { author, name, points } = a.meta.arg
        const bp = (s.byAuthor[author] || []).find(bp => bp.name === name)
        if (bp) bp.points = points
      })
      .addCase(updateBlueprintThunk.fulfilled, (s, a) => {
        const { author, name, updated } = a.payload
        const idx = (s.byAuthor[author] || []).findIndex(bp => bp.name === name)
        if (idx !== -1) s.byAuthor[author][idx] = updated
      })
      .addCase(updateBlueprintThunk.rejected, (s, a) => {
        const { author, name, prevBlueprint } = a.payload
        const idx = (s.byAuthor[author] || []).findIndex(bp => bp.name === name)
        if (idx !== -1) s.byAuthor[author][idx] = prevBlueprint
        s.error = 'Error al actualizar el blueprint'
      })
  },
})

const selectByAuthor = (state) => state.blueprints.byAuthor
const selectSelectedAuthor = (_, author) => author

export const selectTop5 = createSelector(
  [selectByAuthor, selectSelectedAuthor],
  (byAuthor, author) => {
    const items = byAuthor[author] || []
    return [...items]
      .sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0))
      .slice(0, 5)
  }
)

export const { appendPoint } = slice.actions  

export default slice.reducer