import * as mock from './apimock.js'
import * as client from './apiclient.js'

const service = import.meta.env.VITE_USE_MOCK === 'true' ? mock : client

export const getAll = service.getAll
export const getByAuthor = service.getByAuthor
export const getByAuthorAndName = service.getByAuthorAndName
export const create = service.create
export const updateBlueprint = service.updateBlueprint
export const deleteBlueprint = service.deleteBlueprint  
