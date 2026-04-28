type ApiSuccess<T> = { success: true; traceId: string; data: T }
type ApiError = { success: false; traceId: string; error: { code: string; message: string } }
type ApiResponse<T> = ApiSuccess<T> | ApiError

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as ApiError
    return data.error?.message ?? `Request failed: ${response.status}`
  } catch {
    return `Request failed: ${response.status}`
  }
}

export const request = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const json = (await response.json()) as ApiResponse<T>
  return (json as ApiSuccess<T>).data
}
