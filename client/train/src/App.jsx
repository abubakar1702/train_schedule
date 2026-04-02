import { useEffect, useMemo, useState } from 'react'
import { HiArrowsRightLeft } from 'react-icons/hi2'
import { FaClock, FaMapMarkerAlt, FaDirections, FaInfoCircle } from 'react-icons/fa'
import { NavLink, Route, Routes } from 'react-router-dom'

function SearchPage() {
  const [stations, setStations] = useState([])
  const [trains, setTrains] = useState([])
  const [fromStation, setFromStation] = useState('')
  const [toStation, setToStation] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [loadingStations, setLoadingStations] = useState(true)
  const [loadingTrains, setLoadingTrains] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeField, setActiveField] = useState('')
  const [recentRoutes, setRecentRoutes] = useState([])
  const [selectedTrain, setSelectedTrain] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('recent-routes')
    if (saved) {
      try {
        setRecentRoutes(JSON.parse(saved))
      } catch {
        setRecentRoutes([])
      }
    }
  }, [])

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoadingStations(true)
        setErrorMessage('')
        const response = await fetch('/api/stations/')
        if (!response.ok) {
          throw new Error('Failed to load stations')
        }
        const data = await response.json()
        setStations(data.stations || [])
      } catch (error) {
        setErrorMessage('Could not load stations. Start Django server and try again.')
      } finally {
        setLoadingStations(false)
      }
    }

    loadStations()
  }, [])

  const fromIsValid = stations.includes(fromStation)
  const toIsValid = stations.includes(toStation)
  const canSearch = Boolean(fromIsValid && toIsValid)
  const isSameStation = Boolean(fromStation && toStation && fromStation === toStation)
  const routeLabel = canSearch ? `${fromStation} → ${toStation}` : 'Select route'
  const sortedStations = [...stations].sort((a, b) => a.localeCompare(b))

  const getRouteStopsWithin = (route, from, to) => {
    if (!Array.isArray(route) || !from || !to) {
      return []
    }

    const normalize = (value) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
    const fromValue = normalize(from)
    const toValue = normalize(to)

    const fromIndex = route.findIndex((station) => normalize(station) === fromValue)
    const toIndex = route.findIndex((station) => normalize(station) === toValue)

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return []
    }

    // Return only intermediate stops between from and to (exclusive)
    return route.slice(fromIndex + 1, toIndex)
  }

  const fromSuggestions =
    fromStation.trim().length >= 1
      ? sortedStations.filter((station) =>
        station.toLowerCase().includes(fromStation.toLowerCase()),
      )
      : []
  const toSuggestions =
    toStation.trim().length >= 1
      ? sortedStations.filter((station) =>
        station.toLowerCase().includes(toStation.toLowerCase()),
      )
      : []

  const swapStations = () => {
    if (!fromStation && !toStation) return
    setFromStation(toStation)
    setToStation(fromStation)
  }

  const saveRecentRoute = (fromValue, toValue) => {
    const key = `${fromValue}->${toValue}`
    const updated = [{ key, from: fromValue, to: toValue }, ...recentRoutes.filter((r) => r.key !== key)].slice(0, 5)
    setRecentRoutes(updated)
    localStorage.setItem('recent-routes', JSON.stringify(updated))
  }

  const searchTrains = async (fromValue, toValue, dateValue) => {
    try {
      setLoadingTrains(true)
      setErrorMessage('')
      const params = new URLSearchParams({ from: fromValue, to: toValue })
      if (dateValue) params.set('date', dateValue)
      const response = await fetch(`/api/trains/?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load trains')
      }
      const data = await response.json()
      setTrains(data.results || [])
      saveRecentRoute(fromValue, toValue)
    } catch (error) {
      setTrains([])
      setErrorMessage('Could not load trains. Check backend server and try again.')
    } finally {
      setLoadingTrains(false)
    }
  }

  useEffect(() => {
    if (!canSearch || isSameStation) {
      setTrains([])
      return
    }
    searchTrains(fromStation, toStation, travelDate)
  }, [fromStation, toStation, travelDate])

  return (
    <main className="px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <label className="relative block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                From
              </span>
              <input
                type="text"
                value={fromStation}
                onChange={(event) => {
                  setFromStation(event.target.value)
                }}
                onFocus={() => setActiveField('from')}
                onBlur={() => setTimeout(() => setActiveField(''), 120)}
                placeholder="Search departure station"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                disabled={loadingStations}
              />
              {activeField === 'from' && fromSuggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {fromSuggestions.map((station) => (
                    <li key={station}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setFromStation(station)
                          setActiveField('')
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {station}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>

            <button
              type="button"
              onClick={swapStations}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              title="Swap stations"
              aria-label="Swap stations"
            >
              <HiArrowsRightLeft className="h-4 w-4" />
            </button>

            <label className="relative block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                To
              </span>
              <input
                type="text"
                value={toStation}
                onChange={(event) => {
                  setToStation(event.target.value)
                }}
                onFocus={() => setActiveField('to')}
                onBlur={() => setTimeout(() => setActiveField(''), 120)}
                placeholder="Search destination station"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                disabled={loadingStations}
              />
              {activeField === 'to' && toSuggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {toSuggestions.map((station) => (
                    <li key={station}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setToStation(station)
                          setActiveField('')
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {station}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>

          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                Travel date
              </span>
              <input
                type="date"
                value={travelDate}
                onChange={(event) => setTravelDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-2.5 py-1">{routeLabel}</span>
            {isSameStation ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                From and To must be different
              </span>
            ) : null}
            {!loadingStations && fromStation && !fromIsValid ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                Select a valid From station
              </span>
            ) : null}
            {!loadingStations && toStation && !toIsValid ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                Select a valid To station
              </span>
            ) : null}
            {loadingStations ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Loading stations...
              </span>
            ) : null}
            {loadingTrains ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Searching...
              </span>
            ) : null}
          </div>
          {recentRoutes.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Recent:</span>
              {recentRoutes.map((route) => (
                <button
                  key={route.key}
                  type="button"
                  onClick={() => {
                    setFromStation(route.from)
                    setToStation(route.to)
                  }}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {route.from} to {route.to}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Available trains</h2>
            <span className="text-xs text-slate-500">
              {canSearch && !isSameStation ? trains.length : 0} results
            </span>
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : !canSearch ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Select both stations to view trains.
            </p>
          ) : isSameStation ? (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
              Please select different stations.
            </p>
          ) : loadingTrains ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Searching trains...
            </p>
          ) : trains.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              No train found for this route.
            </p>
          ) : (
            <ul className="space-y-3">
              {trains.map((train) => {
                const isAvailable = train.offDay.toLowerCase() !== new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()
                const statusColor = isAvailable ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                const routeStopCount = Math.max((train.route || []).length - 2, 0)

                return (
                  <li
                    key={train.id}
                    className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${isAvailable ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{train.trainName}</p>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <FaDirections /> Train {train.trainNo}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      <p className="inline-flex items-center gap-1"><FaMapMarkerAlt className="text-sky-500" /> {train.from}</p>
                      <p className="inline-flex items-center gap-1"><FaMapMarkerAlt className="text-rose-500" /> {train.to}</p>
                      <p className="inline-flex items-center gap-1"><FaClock className="text-slate-400" /> {train.departure} → {train.arrival}</p>
                    </div>

                    <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}>
                      <span>{train.offDay === 'None' ? 'Runs daily' : `Off ${train.offDay}`}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Intermediate stops: {routeStopCount}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTrain(train)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <FaInfoCircle /> Details
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {selectedTrain ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedTrain.trainName} route details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedTrain(null)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm"
                >
                  Close
                </button>
              </div>
              <p className="text-sm text-slate-600">From: {selectedTrain.from} → To: {selectedTrain.to}</p>
              <p className="text-sm text-slate-600">Departure: {selectedTrain.departure} • Arrival: {selectedTrain.arrival}</p>
              <p className="text-sm text-slate-600">Selected route: {fromStation} → {toStation}</p>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Stations on route:</p>
                {(() => {
                  const stops = getRouteStopsWithin(selectedTrain.route || [], fromStation, toStation)
                  if (stops.length === 0) {
                    return <p className="text-sm text-slate-500">No intermediate stops (non-stop between selected stations).</p>
                  }

                  return (
                    <ul className="space-y-1 text-sm text-slate-700">
                      {stops.map((station) => (
                        <li key={station} className="rounded-md bg-slate-50 px-2 py-1">
                          {station}
                        </li>
                      ))}
                    </ul>
                  )
                })()}
              </div>
            </div>
          </div>
        ) : null}

        <section className="mt-4 text-xs text-slate-500">
          Backend endpoints in use: <code>/api/stations/</code> and <code>/api/trains/</code>
        </section>
      </div>
    </main>
  )
}

function TrainTablePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const pageSize = 10

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
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">All Train Information</h2>
            <p className="mt-1 text-sm text-slate-600">Table view with pagination</p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search train, number, route"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-slate-600">Loading...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-3 py-2">Train</th>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Departure</th>
                    <th className="px-3 py-2">Arrival</th>
                    <th className="px-3 py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.trainId} className="border-t border-slate-200">
                      <td className="px-3 py-2">{row.trainName}</td>
                      <td className="px-3 py-2">{row.trainNo}</td>
                      <td className="px-3 py-2">{row.from}</td>
                      <td className="px-3 py-2">{row.to}</td>
                      <td className="px-3 py-2">{row.departure}</td>
                      <td className="px-3 py-2">{row.arrival}</td>
                      <td className="px-3 py-2">{row.type || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <p className="font-semibold">BD Train Schedule</p>
          <div className="flex gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              Search
            </NavLink>
            <NavLink
              to="/trains"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              All Trains
            </NavLink>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/trains" element={<TrainTablePage />} />
      </Routes>
    </div>
  )
}

export default App
