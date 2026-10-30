import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getActivity } from '../lib/api'
import { isCamping, isViewing } from '../lib/pricing'
import { peso } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import { Loading, ErrorState, Empty } from '../components/StateView'
import RockActivities from '../components/RockActivities'

export default function ActivityDetail() {
  const { code } = useParams()
  const [activity, setActivity] = useState(undefined) // undefined = loading, null = not found
  const [error, setError] = useState('')

  function load() {
    setError('')
    setActivity(undefined)
    getActivity(code).then(setActivity).catch((e) => setError(friendlyError(e)))
  }
  useEffect(load, [code])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (activity === undefined) return <Loading />
  if (activity === null) return <Empty text="This activity isn't available. It may have been removed." />

  const camping = isCamping(activity)
  const viewing = isViewing(activity)

  return (
    <div className="detail">
      <Link to="/" className="back">← All activities</Link>
      <h1>{camping ? `Camping area ${activity.code}` : activity.name}</h1>
      {camping && (activity.category || activity.area_group) && <p className="muted">{activity.category || activity.area_group}</p>}
      {activity.image_url && <img className="detail-photo" src={activity.image_url} alt={camping ? `Camping area ${activity.code}` : activity.name} />}

      {!camping && !viewing && <RockActivities />}
      <div className="card">
        {camping && activity.description && <p className="description">{activity.description}</p>}

        <dl className="facts">
          {camping ? (
            <>
              <dt>Area price</dt><dd>{peso(activity.price)} per night</dd>
              <dt>Per person</dt><dd>{peso(activity.per_person_price)} per person per night</dd>
              <dt>Check-in</dt><dd>1:00–6:00 PM · check-out 12:00 noon</dd>
              <dt>Tents</dt><dd>For rent: good for 4 ₱350, good for 2 ₱250, per stay</dd>
              <dt>Discount</dt><dd>20% off the per-person fee for seniors, PWDs, children 7 and below, and Atok locals</dd>
            </>
          ) : viewing ? (
            <>
              <dt>Price</dt><dd>{peso(activity.price)} per person, all ages</dd>
              <dt>Discount</dt><dd>20% for seniors, PWDs, children 7 and below, Atok locals, or groups of 6 or more</dd>
            </>
          ) : (
            <>
              <dt>Package</dt><dd>{peso(activity.price)} per person</dd>
              {activity.viewing_price != null && <><dt>Viewing only</dt><dd>{peso(activity.viewing_price)} per person (open to all ages)</dd></>}
              {activity.min_age && <><dt>Minimum age</dt><dd>{activity.min_age} years old for the package</dd></>}
              <dt>Group discount</dt><dd>20% off the package for groups of 6 or more</dd>
              <dt>Good to know</dt><dd>Weather dependent. Arrive early.</dd>
            </>
          )}
          <dt>Down payment</dt><dd>50% to confirm your booking</dd>
          <dt>Advance notice</dt><dd>Book at least {activity.advance_notice_days ?? 2} days ahead</dd>
        </dl>

        <Link to={`/book/${activity.code}`} className="btn-primary block">
          {camping ? 'Book this area' : viewing ? 'Book viewing' : 'Book the package'}
        </Link>
      </div>
    </div>
  )
}
