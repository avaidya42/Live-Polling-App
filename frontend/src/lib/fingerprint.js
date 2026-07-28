// This is a lightweight duplicate-vote deterrent, not a security boundary.
// It's a random ID generated once per browser and stored in localStorage —
// clearing storage or voting from a different browser/device resets it.
// (Alternative would be server-side fingerprinting via IP/UA hashing or a
// library like FingerprintJS, which is harder to bypass casually but adds
// privacy/accuracy tradeoffs this project intentionally avoids.)

const FINGERPRINT_KEY = 'voter_fingerprint'
const VOTED_POLLS_KEY = 'voted_polls'

export function getVoterFingerprint() {
  let fingerprint = localStorage.getItem(FINGERPRINT_KEY)
  if (!fingerprint) {
    fingerprint = crypto.randomUUID()
    localStorage.setItem(FINGERPRINT_KEY, fingerprint)
  }
  return fingerprint
}

function getVotedPolls() {
  try {
    return JSON.parse(localStorage.getItem(VOTED_POLLS_KEY)) || {}
  } catch {
    return {}
  }
}

export function hasVoted(pollId) {
  return Boolean(getVotedPolls()[pollId])
}

export function markVoted(pollId, optionId) {
  const voted = getVotedPolls()
  voted[pollId] = optionId
  localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(voted))
}

export function getVotedOption(pollId) {
  return getVotedPolls()[pollId] || null
}
