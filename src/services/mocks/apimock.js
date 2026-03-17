const mockData = [
    { author: 'hemingway', name: 'El viejo y el mar', points: [{x: 10, y: 10}, {x: 100, y: 150}, {x: 200, y: 80}] }, 
    { author: 'hemingway', name: 'Adiós a las armas', points: [{x:50, y: 50}, {x: 300, y: 200}] },
    { author: 'kafka', name: 'La metamorfosis', points: [{x: 20, y: 30}, {x: 150, y: 100}, {x:400, y: 250}] },
]

export const getAll = async () => mockData

export const getByAuthor = async (author) => {
    const result = mockData.filter(item => item.author === author)
    if (!result.length) {
        throw new Error(`No se encontraron obras para el autor ${author}`)
    }
    return result
}

export const getByAuthorAndName = async (author, name) => {
    const result = mockData.find(item => item.author === author && item.name === name)
    if (!result) {
        throw new Error(`No se encontró la obra ${name} del autor ${author}`)
    } 
    return result
}  

export const create = async (blueprint) => {
    mockData.push(blueprint)
    return blueprint
}

export const deleteBlueprint = async (author, name) => {    
    const index = mockData.findIndex(item => item.author === author && item.name === name)
    if (index === -1) throw new Error(`No se encontró la obra ${name} del autor ${author}`)
    mockData.splice(index, 1)
}

export const updateBlueprint = async (author, name, points) => {
    const bp = mockData.find(item => item.author === author && item.name === name)
    if (!bp) throw new Error(`No se encontró la obra ${name} del autor ${author}`)
    bp.points = points
    return bp
}