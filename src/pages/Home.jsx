import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivities } from '../lib/api'
import { isCamping } from '../lib/pricing'
import { pesoShort } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import { Loading, ErrorState, Empty } from '../components/StateView'
import AerialMap from '../components/AerialMap'
import RockActivities from '../components/RockActivities'

// Landing / browse page. Everything shown comes from the activities table, nothing is hardcoded.
export default function Home() {
  const [activities, setActivities] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    setActivities(null)
    getActivities()
      .then(setActivities)
      .catch((e) => setError(friendlyError(e)))
  }
  useEffect(load, [])

  // Group camping areas by area_group (Lower Area, Upper Area, ...), keeping database order.
  const camping = (activities || []).filter(isCamping)
  const groups = {}
  for (const a of camping) {
    const key = a.area_group || 'Camping areas'
    ;(groups[key] ||= []).push(a)
  }
  const ORDER = ['Lower Area', 'Upper Area', 'Under the Tree', 'Car Camping Area']
  const groupList = Object.entries(groups).sort(([a], [b]) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99)
  const rock = (activities || []).find((a) => !isCamping(a))
  const cheapest = camping.length ? Math.min(...camping.map((a) => a.price)) : null

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Camp under the pines. Climb the crag.</h1>
          <dl className="hero-facts">
            {rock && <div><dt>Rock package</dt><dd>{pesoShort(rock.price)}</dd><span>per person</span></div>}
            {cheapest != null && <div><dt>Camping</dt><dd>from {pesoShort(cheapest)}</dd><span>per area, per night</span></div>}
            <div><dt>Check-in</dt><dd>1 PM</dd><span>check-out 12 noon</span></div>
          </dl>
        </div>
        {activities && <AerialMap areas={camping} />}
      </section>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !activities && <Loading text="Loading activities…" />}
      {activities && activities.length === 0 && <Empty text="No activities are open for booking right now." />}

      {rock && (
        <section id="rock" className="section">
          <div className="section-head">
            <h2>{rock.name}</h2>
            <Link to={`/activity/${rock.code}`} className="route-price">
              <b>{pesoShort(rock.price)}</b><span>per person</span><span className="go">See dates →</span>
            </Link>
          </div>
          <RockActivities />
          <p className="route-meta">
            {rock.min_age ? `Ages ${rock.min_age} and up` : ''}
            {rock.viewing_price != null ? ` · Viewing only ${pesoShort(rock.viewing_price)}` : ''}
            {' · Safety gear and guide included'}
          </p>
        </section>
      )}

      {camping.length > 0 && (
        <section id="camping" className="section">
          <h2>Camping areas</h2>
          <p className="muted">Price is per area per night, plus {pesoShort(camping[0].per_person_price)} per person per night. One group per area.</p>
          <div className="area-groups">
            {groupList.map(([group, areas]) => (
              <div key={group} className="area-group">
                <h3>{group}</h3>
                <ul className="areas">
                  {areas.map((a) => (
                    <li key={a.id}>
                      <Link to={`/activity/${a.code}`} className="area-row">
                        <b className="area-code">{a.code}</b>
                        <span className="area-size">{a.description}</span>
                        <span className="area-price">{pesoShort(a.price)}<span>/night</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
