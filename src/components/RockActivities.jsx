import rappelling from '../assets/activities/rappelling.jpg'
import viaFerrata from '../assets/activities/via-ferrata.jpg'
import burmeseBridge from '../assets/activities/burmese-bridge.jpg'
import zipline from '../assets/activities/zipline.jpg'
import tyrolean from '../assets/activities/tyrolean-traverse.jpg'

// The five activities in the Rock Activities Package, with Goatcliff's photos.
// Rounds follow the package description; check them with Goatcliff.
export const ROCK_ACTIVITIES = [
  { name: 'Rappelling', rounds: '3 rounds', photo: rappelling },
  { name: 'Via Ferrata', rounds: 'Unlimited rounds', photo: viaFerrata },
  { name: 'Burmese Bridge', rounds: 'Unlimited rounds', photo: burmeseBridge },
  { name: 'Zipline', rounds: 'Unlimited rounds', photo: zipline },
  { name: 'Tyrolean Traverse', rounds: 'Unlimited rounds', photo: tyrolean },
]

export default function RockActivities() {
  return (
    <ul className="rock-list">
      {ROCK_ACTIVITIES.map((a) => (
        <li key={a.name}>
          <img src={a.photo} alt={a.name} loading="lazy" />
          <span className="rock-name">{a.name}</span>
          <span className="rock-rounds">{a.rounds}</span>
        </li>
      ))}
    </ul>
  )
}
