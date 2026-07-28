const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    const error = new Error(detail)
    error.status = res.status
    throw error
  }

  if (res.status === 204) return null
  return res.json()
}

export function createPoll({ question, options, expiresInMinutes }) {
  return request('/polls', {
    method: 'POST',
    body: JSON.stringify({
      question,
      options,
      expires_in_minutes: expiresInMinutes || null,
    }),
  })
}

export function getPoll(pollId) {
  return request(`/polls/${pollId}`)
}

export function castVote(pollId, { optionId, voterFingerprint }) {
  return request(`/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      option_id: optionId,
      voter_fingerprint: voterFingerprint,
    }),
  })
}

export function getResults(pollId) {
  return request(`/polls/${pollId}/results`)
}
