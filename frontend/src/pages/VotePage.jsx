import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPoll, castVote } from '../lib/api.js'
import { getVoterFingerprint, hasVoted, markVoted, getVotedOption } from '../lib/fingerprint.js'

export default function VotePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [poll, setPoll] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getPoll(id)
        if (cancelled) return
        setPoll(data)
        setAlreadyVoted(hasVoted(id))
        setSelectedOption(getVotedOption(id))
      } catch (err) {
        if (!cancelled) setError(err.status === 404 ? 'Poll not found.' : err.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleVote() {
    if (!selectedOption) return
    setIsSubmitting(true)
    setError(null)

    try {
      await castVote(id, {
        optionId: selectedOption,
        voterFingerprint: getVoterFingerprint(),
      })
      markVoted(id, selectedOption)
      navigate(`/poll/${id}/results`)
    } catch (err) {
      if (err.status === 409) {
        markVoted(id, selectedOption)
        setAlreadyVoted(true)
      } else if (err.status === 410) {
        setError('This poll has closed.')
      } else {
        setError(err.message || 'Could not submit your vote. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <CenteredMessage text="Loading poll…" />
  }

  if (error && !poll) {
    return <CenteredMessage text={error} isError />
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-textMuted mb-3">
          {alreadyVoted ? 'Your vote' : 'Cast your vote'}
        </p>
        <h1 className="font-display text-2xl mb-8">{poll.question}</h1>

        <div className="space-y-3 mb-8">
          {poll.options.map((opt) => {
            const isSelected = selectedOption === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                disabled={alreadyVoted}
                onClick={() => setSelectedOption(opt.id)}
                className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-lg border transition ${
                  isSelected
                    ? 'border-ink-amber bg-ink-surfaceHover'
                    : 'border-ink-border bg-ink-surface'
                } ${alreadyVoted ? 'opacity-70' : 'hover:border-ink-amber/60'}`}
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-ink-amber' : 'border-ink-textMuted'
                  }`}
                >
                  {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-ink-amber" />}
                </span>
                <span className="text-ink-text">{opt.text}</span>
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-ink-danger mb-4">{error}</p>}

        {alreadyVoted ? (
          <Link
            to={`/poll/${id}/results`}
            className="block w-full py-3 rounded-lg bg-ink-amber text-ink-bg font-body font-medium text-center hover:brightness-110 transition"
          >
            View live results
          </Link>
        ) : (
          <button
            onClick={handleVote}
            disabled={!selectedOption || isSubmitting}
            className="w-full py-3 rounded-lg bg-ink-amber text-ink-bg font-body font-medium hover:brightness-110 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit vote'}
          </button>
        )}
      </div>
    </div>
  )
}

function CenteredMessage({ text, isError }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <p className={isError ? 'text-ink-danger' : 'text-ink-textMuted'}>{text}</p>
    </div>
  )
}
