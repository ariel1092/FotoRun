// Normalizar API URL para evitar doble barra
const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8004"
  // Remover barra final si existe
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const API_URL = getApiUrl()

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message)
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("jerpro_token")
}

export const apiClient = {
  async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any,
    options?: { includeAuth?: boolean },
  ): Promise<T> {
    const includeAuth = options?.includeAuth !== false
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (includeAuth) {
      const token = getAuthToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    // Asegurar que endpoint empiece con /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    let response: Response
    try {
      response = await fetch(`${API_URL}${normalizedEndpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo realizar la solicitud. Verificá tu conexión."
      throw new ApiError(
        0,
        `Error de red: ${message}`,
        { cause: message },
      )
    }

    let responseData: any
    try {
      responseData = await response.json()
    } catch (error) {
      // Si no hay JSON en la respuesta, crear un mensaje de error básico
      responseData = {
        message: response.status === 401 
          ? 'Credenciales inválidas. Verificá tu email y contraseña.'
          : response.status === 404
          ? 'Endpoint no encontrado'
          : `Error ${response.status}: ${response.statusText}`,
      }
    }

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error?.message || `${method} ${endpoint} failed`
      throw new ApiError(response.status, errorMessage, responseData)
    }

    return responseData
  },

  get<T>(endpoint: string, options?: { includeAuth?: boolean }) {
    return this.request<T>("GET", endpoint, undefined, options)
  },

  post<T>(endpoint: string, data: any, options?: { includeAuth?: boolean }) {
    return this.request<T>("POST", endpoint, data, options)
  },

  put<T>(endpoint: string, data: any, options?: { includeAuth?: boolean }) {
    return this.request<T>("PUT", endpoint, data, options)
  },

  delete<T>(endpoint: string, options?: { includeAuth?: boolean }) {
    return this.request<T>("DELETE", endpoint, undefined, options)
  },
}

export const authApi = {
  register(email: string, password: string, name: string) {
    return apiClient.post("/auth/register", { email, password, name }, { includeAuth: false })
  },

  registerPhotographer(email: string, password: string, name: string) {
    return apiClient.post("/auth/register/photographer", { email, password, name }, { includeAuth: false })
  },

  login(email: string, password: string) {
    return apiClient.post("/auth/login", { email, password }, { includeAuth: false })
  },

  getProfile() {
    return apiClient.get("/auth/profile")
  },
}

export const adminApi = {
  getAllUsers() {
    return apiClient.get("/users")
  },

  getUserById(id: string) {
    return apiClient.get(`/users/${id}`)
  },

  updateUserRole(userId: string, role: string) {
    return apiClient.put(`/users/${userId}/role`, { role })
  },

  deleteUser(userId: string) {
    return apiClient.delete(`/users/${userId}`)
  },
}

export const racesApi = {
  getAll() {
    return apiClient.get("/races", { includeAuth: false })
  },

  getActive() {
    return apiClient.get("/races/active", { includeAuth: false })
  },

  getById(id: string) {
    return apiClient.get(`/races/${id}`, { includeAuth: false })
  },

  create(raceData: { name: string; date: string; location?: string; discipline?: string }) {
    return apiClient.post("/races", raceData)
  },

  delete(id: string, hardDelete: boolean = false) {
    const queryParam = hardDelete ? "?hardDelete=true" : ""
    return apiClient.delete(`/races/${id}${queryParam}`)
  },
}

export const photosApi = {
  searchByBibNumber(bibNumber: string, raceId?: string) {
    const params = new URLSearchParams({ bibNumber })
    if (raceId) {
      params.append('raceId', raceId)
    }
    return apiClient.get(`/photos/search?${params.toString()}`, { includeAuth: false })
  },

  getByRaceId(raceId: string) {
    return apiClient.get(`/photos/race/${raceId}`, { includeAuth: false })
  },

  getById(id: string) {
    return apiClient.get(`/photos/${id}`, { includeAuth: false })
  },

  async uploadMultiple(files: File[], raceId: string): Promise<{ photos: any[]; message: string }> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("photos", file)
    })
    formData.append("raceId", raceId)

    const token = getAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/photos/upload-multiple`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error al subir fotos" }))
      throw new ApiError(response.status, errorData.message || "Error al subir fotos", errorData)
    }

    return await response.json()
  },

  getStats() {
    return apiClient.get("/photos/stats")
  },

  getAll() {
    return apiClient.get("/photos")
  },

  delete(id: string) {
    return apiClient.delete(`/photos/${id}`)
  },
}
