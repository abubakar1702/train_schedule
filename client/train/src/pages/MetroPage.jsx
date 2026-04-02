import { useEffect, useState } from 'react'
import { FaTrain, FaClock, FaTicketAlt, FaInfoCircle, FaMapMarkedAlt, FaSubway } from 'react-icons/fa'

export default function MetroPage() {
  const [metroData, setMetroData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/metro/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load metro data')
        return res.json()
      })
      .then(data => {
        setMetroData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div></div>
  }

  if (error || !metroData) {
    return <div className="flex min-h-screen items-center justify-center p-4"><div className="rounded-2xl bg-rose-50 p-6 text-center font-medium text-rose-700">{error || 'Data unavailable'}</div></div>
  }

  const { metro_rail, schedule, stations, ticket_info } = metroData

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 animate-gradient">Dhaka Metro Rail</span> Info
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600">
          Complete guide, schedule, and ticket information for {metro_rail.line}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Info & Schedule */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-panel rounded-3xl p-5 shadow-lg shadow-emerald-900/5 transition hover:-translate-y-1">
                <FaSubway className="text-3xl text-emerald-500 mb-3" />
                <div className="text-2xl font-bold text-slate-900">{metro_rail.total_stations}</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Stations</div>
             </div>
             <div className="glass-panel rounded-3xl p-5 shadow-lg shadow-emerald-900/5 transition hover:-translate-y-1">
                <FaRouteIcon className="text-3xl text-teal-500 mb-3" />
                <div className="text-2xl font-bold text-slate-900">{metro_rail.total_length_km} <span className="text-sm">km</span></div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total Length</div>
             </div>
          </div>

          {/* About Card */}
          <div className="glass-panel overflow-hidden rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="border-b border-slate-100 bg-emerald-50 p-5">
              <h2 className="flex items-center gap-2 text-xl font-bold text-emerald-900">
                <FaInfoCircle className="text-emerald-500" /> General Info
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Line</div>
                <div className="font-semibold text-slate-800">{metro_rail.line}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Route</div>
                <div className="font-semibold text-slate-800">{metro_rail.route}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Operator</div>
                <div className="font-semibold text-slate-800">{metro_rail.operator}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</div>
                <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {metro_rail.status}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="glass-panel overflow-hidden rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="border-b border-slate-100 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 text-xl font-bold text-amber-900">
                <FaTicketAlt className="text-amber-500" /> Ticket Information
              </h2>
            </div>
            <div className="p-5 space-y-4 text-sm font-medium text-slate-700">
              <div className="flex flex-wrap gap-2 mb-2">
                 {ticket_info.types.map(t => (
                    <span key={t} className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-bold">{t}</span>
                 ))}
              </div>
              <div><strong className="text-slate-900">MRT Pass Cost:</strong> {ticket_info.mrt_pass_cost}</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><span className="font-bold text-emerald-600">{ticket_info.mrt_pass_discount}</span> using MRT Pass</li>
                <li>{ticket_info.pwd_discount}</li>
              </ul>
              <div className="mt-4 border-t border-slate-100 pt-3">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Free Travel For:</h4>
                 <ul className="list-disc pl-5 space-y-1">
                   {ticket_info.free_travel.map(f => <li key={f}>{f}</li>)}
                 </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Stations & Timing */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Operating Hours Summary */}
          <div className="grid gap-4 sm:grid-cols-2">
             <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-indigo-50 to-white">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <FaClock className="text-indigo-500"/> Weekday Schedule
                </h3>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between border-b border-indigo-100 pb-2">
                      <span className="font-medium text-slate-600">Uttara &rarr; Motijheel</span>
                      <span className="font-bold text-slate-900">{schedule.weekdays.uttara_north_to_motijheel.first_train} - {schedule.weekdays.uttara_north_to_motijheel.last_train}</span>
                   </div>
                   <div className="flex justify-between border-b border-indigo-100 pb-2">
                      <span className="font-medium text-slate-600">Motijheel &rarr; Uttara</span>
                      <span className="font-bold text-slate-900">{schedule.weekdays.motijheel_to_uttara_north.first_train} - {schedule.weekdays.motijheel_to_uttara_north.last_train}</span>
                   </div>
                   <div className="pt-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Headway</span>
                      <p className="font-medium text-slate-700 mt-1">{schedule.weekdays.headway.peak_hours} Peak</p>
                      <p className="font-medium text-slate-700">8-10 mins Off-Peak</p>
                   </div>
                </div>
             </div>

             <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-fuchsia-50 to-white">
                <h3 className="text-lg font-bold text-fuchsia-900 mb-4 flex items-center gap-2">
                  <FaClock className="text-fuchsia-500"/> Friday Schedule
                </h3>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between border-b border-fuchsia-100 pb-2">
                      <span className="font-medium text-slate-600">Uttara &rarr; Motijheel</span>
                      <span className="font-bold text-slate-900">{schedule.friday.uttara_north_to_motijheel.first_train} - {schedule.friday.uttara_north_to_motijheel.last_train}</span>
                   </div>
                   <div className="flex justify-between border-b border-fuchsia-100 pb-2">
                      <span className="font-medium text-slate-600">Motijheel &rarr; Uttara</span>
                      <span className="font-bold text-slate-900">{schedule.friday.motijheel_to_uttara_north.first_train} - {schedule.friday.motijheel_to_uttara_north.last_train}</span>
                   </div>
                   <div className="pt-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-400">Ticket Sales</span>
                      <p className="font-medium text-slate-700 mt-1">From {schedule.friday.uttara_north_to_motijheel.ticket_sales_from}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Station List */}
          <div className="glass-panel overflow-hidden rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="border-b border-slate-100 bg-white/50 p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <FaMapMarkedAlt className="text-blue-500" /> Station Map & First/Last Trains
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Standard operating times for each station.</p>
            </div>
            
            <div className="overflow-x-auto p-4">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 rounded-xl">
                  <tr>
                    <th colSpan="2" className="px-4 py-3 font-bold text-slate-500 rounded-tl-xl rounded-bl-xl">Station</th>
                    <th colSpan="2" className="px-4 py-3 font-bold text-center border-l border-slate-200 text-teal-700 bg-teal-50/50">To Motijheel &rarr;</th>
                    <th colSpan="2" className="px-4 py-3 font-bold text-center border-l border-slate-200 text-blue-700 bg-blue-50/50 rounded-tr-xl rounded-br-xl">&larr; To Uttara</th>
                  </tr>
                  <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">No.</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold text-center border-l border-slate-200">First</th>
                    <th className="px-4 py-2 font-bold text-center">Last</th>
                    <th className="px-4 py-2 font-bold text-center border-l border-slate-200">First</th>
                    <th className="px-4 py-2 font-bold text-center">Last</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {stations.map((st) => (
                    <tr key={st.number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-bold">{st.number}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        {st.role && <div className="text-xs text-slate-500">{st.role}</div>}
                      </td>
                      <td className="px-4 py-3 text-center border-l border-slate-100 bg-teal-50/10">{st.toward_motijheel.first_train || '-'}</td>
                      <td className="px-4 py-3 text-center bg-teal-50/10">{st.toward_motijheel.last_train || '-'}</td>
                      <td className="px-4 py-3 text-center border-l border-slate-100 bg-blue-50/10">{st.toward_uttara_north.first_train || '-'}</td>
                      <td className="px-4 py-3 text-center bg-blue-50/10">{st.toward_uttara_north.last_train || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

function FaRouteIcon({ className }) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
       <path d="M416 320h-81.82c-29.47-51.48-84.05-84.81-143.68-84.81H48V192h142.5C236.4 192 284.15 220 307.72 266.3c15.26 29.98 25.4 62.48 44.4 89.7h63.88L384 388h26.49l41.51-40-41.51-40H384l32-32zm-289.4 0c-26.54 0-47.49 19.38-47.49 44.4S100.06 408 126.6 408c26.55 0 49.33-19.38 49.33-44.4S153.15 320 126.6 320zm149.3 0c-26.54 0-47.49 19.38-47.49 44.4s20.95 43.6 47.49 43.6c26.55 0 49.34-18.49 49.34-43.6S302.45 320 275.9 320z"/>
    </svg>
  );
}
