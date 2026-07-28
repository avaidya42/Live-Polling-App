import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getResults } from '../lib/api.js'
import LiveBadge from '../components/LiveBadge.jsx'

const POLL_INTERVAL_MS = 2500

export default function ResultsPage() {
  const { id } = useParams()
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchResults() {
      try {
        const data = await getResults(id)
        if (cancelled) return
        setResults(data)
        setError(null)

        // Stop polling once the poll has closed — nothing left to refresh.
        if (data.is_closed && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } catch (err) {
        if (!cancelled) setError(err.status === 404 ? 'Poll not found.' : err.message)
      }
    }

    fetchResults()
    intervalRef.current = setInterval(fetchResults, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalRef.current)
    }
  }, [id])

  if (error && !results) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <p className="text-ink-danger">{error}</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <p className="text-ink-textMuted">Loading results…</p>
      </div>
    )
  }

  const winnerVotes = Math.max(...results.options.map((o) => o.vote_count), 0)
  const chartData = results.options.map((o) => ({
    text: o.text,
    votes: o.vote_count,
    pct: results.total_votes > 0 ? Math.round((o.vote_count / results.total_votes) * 100) : 0,
    isWinner: o.vote_count === winnerVotes && winnerVotes > 0,
  }))

  const chartHeight = Math.max(chartData.length * 64, 160)

  const winners = chartData.filter((o) => o.isWinner)
  let closedMessage = null
  if (results.is_closed) {
    if (results.total_votes === 0) {
      closedMessage = 'Poll closed — no votes were cast.'
    } else if (winners.length > 1) {
      const names = winners.map((w) => w.text).join(' and ')
      closedMessage = `It's a tie — ${names} are neck and neck.`
    } else {
      closedMessage = `Verdict's in — we're doing ${winners[0].text}.`
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-textMuted">Results</p>
          <LiveBadge active={!results.is_closed} />
        </div>

        <h1 className="font-display text-2xl mb-1">{results.question}</h1>
        <p className="text-sm text-ink-textMuted font-mono mb-8">
          {results.total_votes} vote{results.total_votes === 1 ? '' : 's'}
        </p>

        {closedMessage && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-ink-surface border border-ink-amber/40">
            <p className="font-display text-lg text-ink-amber">{closedMessage}</p>
          </div>
        )}

        <div style={{ width: '100%', height: chartHeight }} className="mb-8">
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="text"
                width={140}
                tick={{ fill: '#F1EEE6', fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  background: '#1B1E27',
                  border: '1px solid #2C303C',
                  borderRadius: 8,
                  color: '#F1EEE6',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                }}
                formatter={(value, name, props) => [
                  `${props.payload.votes} votes (${value}%)`,
                  'Result',
                ]}
              />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.isWinner ? '#E3A23C' : '#4FC9B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Link to={`/poll/${id}`} className="text-sm text-ink-amber font-medium">
          ← Back to ballot
        </Link>
      </div>
    </div>
  )
}
