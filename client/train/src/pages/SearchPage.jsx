import { useEffect, useMemo, useState } from 'react'
import { HiArrowsRightLeft } from 'react-icons/hi2'
import { FaClock, FaMapMarkerAlt, FaDirections, FaInfoCircle, FaTrain, FaSearch, FaCalendarAlt, FaRoute, FaLocationArrow, FaSms } from 'react-icons/fa'

const isTrainMissed = (departureTimeStr, selectedDateStr) => {
  if (!departureTimeStr || !departureTimeStr.includes(':')) return false;
  
  const now = new Date();
  
  if (selectedDateStr) {
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    if (selectedDateStr < todayStr) return true;
    if (selectedDateStr > todayStr) return false;
  }
  
  const [hours, minutes] = departureTimeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return false;
  
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  if (currentHours > hours) return true;
  if (currentHours === hours && currentMinutes >= minutes) return true;
  
  return false;
};

const formatTime = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function SearchPage() {
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
    <div className="mx-auto max-w-5xl px-4 py-12 text-slate-800">
      
      {/* Hero Section */}
      <div className="mb-12 text-center text-slate-900">
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-slate-900">
          Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-gradient">Journey</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Discover seamless train schedules across Bangladesh. Modern, accurate, and lightning fast. 
        </p>
      </div>

      {/* Search Container */}
      <section className="glass-panel mx-auto max-w-4xl rounded-3xl p-6 shadow-xl shadow-blue-900/5 md:p-8 relative z-10">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
          
          <label className="relative block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FaMapMarkerAlt className="text-blue-500" /> Origin
            </span>
            <input
              type="text"
              value={fromStation}
              onChange={(event) => setFromStation(event.target.value)}
              onFocus={() => setActiveField('from')}
              onBlur={() => setTimeout(() => setActiveField(''), 150)}
              placeholder="e.g. Dhaka"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-4 py-3.5 text-base transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              disabled={loadingStations}
            />
            {activeField === 'from' && fromSuggestions.length > 0 && (
              <ul className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                {fromSuggestions.map((station) => (
                  <li key={station}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setFromStation(station)
                        setActiveField('')
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      {station}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>

          <button
            type="button"
            onClick={swapStations}
            className="group flex h-12 w-12 items-center justify-center self-end rounded-2xl bg-slate-900 text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-600 hover:shadow-blue-500/25 active:scale-95 md:mb-[3px]"
            title="Swap stations"
          >
            <HiArrowsRightLeft className="h-5 w-5 transition-transform group-hover:rotate-180" />
          </button>

          <label className="relative block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FaMapMarkerAlt className="text-indigo-500" /> Destination
            </span>
            <input
              type="text"
              value={toStation}
              onChange={(event) => setToStation(event.target.value)}
              onFocus={() => setActiveField('to')}
              onBlur={() => setTimeout(() => setActiveField(''), 150)}
              placeholder="e.g. Chittagong"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-4 py-3.5 text-base transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              disabled={loadingStations}
            />
            {activeField === 'to' && toSuggestions.length > 0 && (
              <ul className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                {toSuggestions.map((station) => (
                  <li key={station}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setToStation(station)
                        setActiveField('')
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {station}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2">
           <label className="relative block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FaCalendarAlt className="text-slate-400" /> Travel Date <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </span>
              <input
                type="date"
                value={travelDate}
                onChange={(event) => setTravelDate(event.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-4 py-3.5 text-base transition-all placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-500/10"
              />
            </label>
        </div>
        
        {/* Status Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium">
          {loadingStations && (
            <span className="animate-pulse rounded-full bg-slate-200 px-3 py-1 text-slate-600">Loading stations...</span>
          )}
          {isSameStation && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Stations must be different</span>
          )}
          {!loadingStations && fromStation && !fromIsValid && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Invalid Origin</span>
          )}
          {!loadingStations && toStation && !toIsValid && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Invalid Destination</span>
          )}
        </div>

        {recentRoutes.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent</span>
              {recentRoutes.map((route) => (
                <button
                  key={route.key}
                  type="button"
                  onClick={() => {
                    setFromStation(route.from)
                    setToStation(route.to)
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  {route.from} &rarr; {route.to}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="mx-auto mt-12 max-w-4xl relative z-0">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaRoute className="text-blue-500" /> Available Trains
          </h2>
          <span className="rounded-full bg-slate-200/50 px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur">
            {canSearch && !isSameStation ? trains.length : 0} found
          </span>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="font-medium flex items-center gap-2"><FaInfoCircle /> {errorMessage}</p>
          </div>
        ) : !canSearch ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-16 text-center backdrop-blur-sm">
            <FaSearch className="mb-4 text-4xl text-slate-300" />
            <p className="text-lg font-medium text-slate-500">Pick your stations to see schedules</p>
          </div>
        ) : isSameStation ? (
          null
        ) : loadingTrains ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-200/60 w-full" />
            ))}
          </div>
        ) : trains.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-16 text-center backdrop-blur-sm">
            <FaTrain className="mb-4 text-4xl text-slate-300" />
            <p className="text-lg font-medium text-slate-500">No trains scheduled for this route</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {trains.map((train) => {
              const routeStopCount = Math.max((train.route || []).length - 2, 0)
              const isAvailable = train.offDay.toLowerCase() !== new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()
              const hasPassed = isTrainMissed(train.departure, travelDate)
                
              return (
                <li
                  key={train.id}
                  className={`group relative overflow-hidden rounded-3xl border p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${!isAvailable ? 'border-amber-200 bg-amber-50/50 grayscale-[20%]' : hasPassed ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 z-0"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center p-5 gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-inner">
                          <FaTrain className="text-lg" />
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{train.trainName}</h3>
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{train.trainNo} &bull; {train.type}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-4 text-sm font-medium flex-wrap">
                          <span className={`${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} rounded-full px-3 py-1`}>
                            {train.offDay === 'None' ? 'Runs Daily' : `Off: ${train.offDay}`}
                          </span>
                          {isAvailable && hasPassed && (
                            <span className="bg-rose-100 text-rose-700 rounded-full px-3 py-1 border border-rose-200">
                              Departed
                            </span>
                          )}
                          <span className="text-slate-500"><FaClock className="inline mr-1 text-slate-400"/> {routeStopCount} intermediate stops</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-between items-center md:items-end gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatTime(train.departure)} <span className="text-sm font-semibold text-slate-400 uppercase">DEP</span></div>
                        <div className="text-sm font-semibold text-slate-500 mt-1">{formatTime(train.arrival)} <span className="text-xs uppercase">ARR</span></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTrain(train)}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 hover:shadow-blue-500/25 active:scale-95"
                      >
                         <FaInfoCircle /> Route Details
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Modal */}
      {selectedTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 transition-opacity" onClick={() => setSelectedTrain(null)}></div>
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
               <h3 className="text-2xl font-bold">{selectedTrain.trainName}</h3>
               <p className="mt-1 font-medium text-blue-100">Train No. {selectedTrain.trainNo}</p>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Departure</div>
                  <div className="text-xl font-bold text-slate-900">{formatTime(selectedTrain.departure)}</div>
                  <div className="text-sm font-medium text-slate-600 mt-1">{selectedTrain.from}</div>
                </div>
                <div className="flex-1 px-4 flex items-center justify-center text-slate-300">
                  <div className="h-0.5 w-full bg-slate-200 rounded"></div>
                  <FaDirections className="mx-2 text-xl shrink-0" />
                  <div className="h-0.5 w-full bg-slate-200 rounded"></div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Arrival</div>
                  <div className="text-xl font-bold text-slate-900">{formatTime(selectedTrain.arrival)}</div>
                  <div className="text-sm font-medium text-slate-600 mt-1">{selectedTrain.to}</div>
                </div>
              </div>

              <div className="mt-2">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Selected Route Stops</h4>
                {(() => {
                  const stops = getRouteStopsWithin(selectedTrain.route || [], fromStation, toStation)
                  if (stops.length === 0) {
                    return <div className="rounded-xl bg-blue-50 p-4 text-center text-sm font-medium text-blue-800 border border-blue-100">Non-stop between {fromStation} and {toStation}</div>
                  }

                  return (
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 p-2 custom-scrollbar">
                      <ul className="space-y-1">
                        {stops.map((station, i) => (
                          <li key={station} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">{i + 1}</span>
                            {station}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 w-full sm:w-auto">
                  <div className="flex items-start gap-3">
                    <FaSms className="text-indigo-500 text-lg mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900 uppercase">Live Tracking</p>
                      <p className="text-xs font-medium text-indigo-700 mt-0.5">Send SMS <strong className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-900">TR {selectedTrain.trainNo}</strong> to <strong className="text-indigo-900">16318</strong></p>
                      <a href={`sms:16318?body=TR%20${selectedTrain.trainNo}`} className="inline-block mt-2 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition sm:hidden">
                        Open SMS App
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTrain(null)}
                  className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 w-full sm:w-auto"
                >
                  Close Route View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
