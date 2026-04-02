import { useEffect, useMemo, useState } from 'react'
import { FaSearch, FaSms } from 'react-icons/fa'

const formatTime = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function TrainTablePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const pageSize = 12

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/schedules/')
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setRows(data.results || [])
      } catch {
        setError('Could not load train table.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [row.trainName, row.trainNo, row.from, row.to]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    )
  }, [rows, query])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="glass-panel overflow-hidden rounded-3xl shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-100 bg-white/50 p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">All Trains Database</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Comprehensive view of all active scheduled trains.</p>
            </div>
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, route, or number..."
                className="w-full rounded-full border-2 border-slate-200 bg-white px-11 py-3 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {loading ? (
             <div className="flex py-12 justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div></div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-6 text-center text-rose-700 font-medium">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 backdrop-blur">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="border-b border-slate-200 bg-slate-50/80 uppercase tracking-widest text-slate-500 text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Train Name</th>
                      <th className="px-6 py-4">No.</th>
                      <th className="px-6 py-4">Route</th>
                      <th className="px-6 py-4">Departure</th>
                      <th className="px-6 py-4">Arrival</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Track</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {pageRows.map((row) => (
                      <tr key={row.trainId || row.id} className="transition-colors hover:bg-blue-50/50">
                        <td className="px-6 py-4 text-slate-900 font-bold">{row.trainName}</td>
                        <td className="px-6 py-4">{row.trainNo}</td>
                        <td className="px-6 py-4">
                           <span className="text-slate-900">{row.from}</span> <span className="text-slate-400 mx-1">&rarr;</span> <span className="text-slate-900">{row.to}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{formatTime(row.departure)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{formatTime(row.arrival)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.offDay === 'None' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {row.offDay === 'None' ? 'Active' : `Off ${row.offDay.substring(0,3)}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="group relative inline-block">
                            <a href={`sms:16318?body=TR%20${row.trainNo}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white transition">
                              <FaSms />
                            </a>
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-900 p-3 text-xs text-white opacity-0 shadow-xl transition group-hover:opacity-100 pointer-events-none z-10">
                              <p className="font-semibold text-indigo-300 mb-1">Live Tracking</p>
                              Send <strong className="text-white">TR {row.trainNo}</strong> to <strong className="text-white">16318</strong>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredRows.length === 0 ? (
                 <div className="text-center py-10 text-slate-500 font-medium">No trains matched your search query.</div>
              ) : (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-500">
                    Showing <span className="text-slate-900">{((page - 1) * pageSize) + 1}</span> to <span className="text-slate-900">{Math.min(page * pageSize, filteredRows.length)}</span> of <span className="text-slate-900">{filteredRows.length}</span> results
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
