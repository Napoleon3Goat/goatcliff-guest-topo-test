import { Link } from 'react-router-dom'
import aerial from '../assets/goatcliff-aerial.jpg'

// Goatcliff's own aerial photo with the camping areas marked on it.
// Each marked area is a link to that area's page. Boxes are in % of the photo,
// so they stay in place at any screen size. Under the Tree (UT) isn't in this photo.
const SPOTS = {
  LA1: [80.8, 77.4, 12.5, 17.3], LA2: [68.3, 79.4, 12.2, 17.0], LA3: [56.0, 81.5, 12.0, 17.0], LA4: [47.5, 85.9, 9.5, 14.0],
  UA3: [14.3, 78.8, 10.2, 11.2], UA4: [13.3, 73.7, 8.5, 7.4], UA5: [22.0, 59.7, 25.8, 15.6],
  CA1: [83.0, 55.0, 7.5, 13.9], CA2: [75.5, 56.7, 7.7, 13.9], CA3: [79.0, 41.1, 8.0, 13.9], CA4: [71.3, 44.5, 7.7, 13.0],
}

export default function AerialMap({ areas }) {
  return (
    <figure className="aerial">
      <img src={aerial} alt="Aerial photo of Goatcliff showing the camping areas, emergency rooms and parking" />
      {areas.map((a) => {
        const s = SPOTS[a.code]
        if (!s) return null
        return (
          <Link key={a.id} to={`/activity/${a.code}`} className="spot" aria-label={`Camping area ${a.code}`}
            style={{ left: s[0] + '%', top: s[1] + '%', width: s[2] + '%', height: s[3] + '%' }}>
            <span>{a.code}</span>
          </Link>
        )
      })}
    </figure>
  )
}
