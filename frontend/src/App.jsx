import { Routes, Route, Link } from 'react-router-dom'
import CreatePoll from './pages/CreatePoll.jsx'
import VotePage from './pages/VotePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-border px-6 py-4">
        <Link to="/" className="font-display text-xl tracking-tight">
          Ballot<span className="text-ink-amber">.</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<VotePage />} />
          <Route path="/poll/:id/results" element={<ResultsPage />} />
        </Routes>
      </main>

      <footer className="px-6 py-4 text-xs text-ink-textMuted border-t border-ink-border">
        Live results refresh automatically — no login required to vote.
      </footer>
    </div>
  )
}
