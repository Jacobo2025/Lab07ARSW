import api from './apiClient'

// GET todos los planos
export const getBlueprints = async () => {
    const res = await api.get('/v1/blueprints')
    return res.data
}

// GET planos por autor

export const getBlueprintsByAuthor = async (author) => {
    const res = await api.get(`/v1/blueprints/${author}`)
    return res.data.data
}

// GET planos por autor
export const getBlueprint = async (author, name) => {
    const res = await api.get(`/v1/blueprints/${author}/${name}`)
    return res.data.data
}

// POST crear nuevo blueprint
export const createBlueprint = async (blueprint) => {
    const res = await api.post('/v1/blueprints', blueprint)
    return res.data.data
}

// PUT agregar un punto
export const addPoint = async (author, name, point) => {
    const res = await api.put(`/v1/blueprints/${author}/${name}/points`, point)
    return res.data.data
}