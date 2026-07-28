import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createPoll } from '../lib/api.js'
import QRCode from '../components/QRCode.jsx'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 10

export default function CreatePoll() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [expiresInMinutes, setExpiresInMinutes] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState(null) // { id, share_url }

  function updateOption(index, value) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)))
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return
    setOptions((prev) => [...prev, ''])
  }

  function removeOption(index) {
    if (options.length <= MIN_OPTIONS) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const trimmedQuestion = question.trim()
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean)

    if (!trimmedQuestion) {
      setError('Give your poll a question.')
      return
    }
    if (trimmedOptions.length < MIN_OPTIONS) {
      setError(`Add at least ${MIN_OPTIONS} options.`)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createPoll({
        question: trimmedQuestion,
        options: trimmedOptions,
        expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : null,
      })
      setCreated(result)
    } catch (err) {
      setError(err.message || 'Something went wrong creating the poll.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (created) {
    const voteUrl = `${window.location.origin}/poll/${created.id}`
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-amber mb-3">
            Poll created
          </p>
          <h1 className="font-display text-2xl mb-8">Share this to collect votes</h1>

          <div className="flex justify-center mb-8">
            <QRCode value={voteUrl} />
          </div>

          <div className="flex items-center gap-2 bg-ink-surface border border-ink-border rounded-lg px-4 py-3 mb-4">
            <input
              readOnly
              value={voteUrl}
              className="flex-1 bg-transparent font-mono text-sm text-ink-text outline-none truncate"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() => navigator.clipboard.writeText(voteUrl)}
              className="text-xs font-mono uppercase text-ink-amber shrink-0"
            >
              Copy
            </button>
          </div>

          <Link
            to={`/poll/${created.id}/results`}
            className="inline-block w-full py-3 rounded-lg bg-ink-amber text-ink-bg font-body font-medium text-center hover:brightness-110 transition"
          >
            View live results
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-textMuted mb-3">
          New poll
        </p>
        <h1 className="font-display text-2xl mb-8">What do you want to ask?</h1>

        <label className="block mb-6">
          <span className="text-sm text-ink-textMuted mb-2 block">Question</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Which framework should we use?"
            maxLength={280}
            className="w-full bg-ink-surface border border-ink-border rounded-lg px-4 py-3 text-ink-text placeholder:text-ink-textMuted/50 outline-none focus:border-ink-amber"
          />
        </label>

        <div className="mb-4">
          <span className="text-sm text-ink-textMuted mb-2 block">Options</span>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  maxLength={120}
                  className="flex-1 bg-ink-surface border border-ink-border rounded-lg px-4 py-2.5 text-ink-text placeholder:text-ink-textMuted/50 outline-none focus:border-ink-amber"
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-ink-textMuted hover:text-ink-danger px-2"
                    aria-label={`Remove option ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < MAX_OPTIONS && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-sm text-ink-amber font-medium"
            >
              + Add option
            </button>
          )}
        </div>

        <label className="block mb-6">
          <span className="text-sm text-ink-textMuted mb-2 block">
            Closes after (minutes) — optional
          </span>
          <input
            type="number"
            min="1"
            value={expiresInMinutes}
            onChange={(e) => setExpiresInMinutes(e.target.value)}
            placeholder="Leave blank to stay open"
            className="w-full bg-ink-surface border border-ink-border rounded-lg px-4 py-2.5 text-ink-text placeholder:text-ink-textMuted/50 outline-none focus:border-ink-amber"
          />
        </label>

        {error && <p className="text-sm text-ink-danger mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg bg-ink-amber text-ink-bg font-body font-medium hover:brightness-110 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create poll'}
        </button>
      </form>
    </div>
  )
}
