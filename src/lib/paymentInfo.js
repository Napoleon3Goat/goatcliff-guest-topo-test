// Where guests send the down payment.
// SAMPLE VALUES for the demo. Replace them with Goat Cliff's real GCash / Maya
// name, number and QR codes before the site goes live.
export const WALLETS = [
  { id: 'gcash', name: 'GCash', accountName: 'GOAT CLIFF ROCK ADVENTURES (sample)', number: '0900 000 0001' },
  { id: 'maya', name: 'Maya', accountName: 'GOAT CLIFF ROCK ADVENTURES (sample)', number: '0900 000 0002' },
]

// The guest has 5 minutes to pay and send their proof (the database has the same rule).
export const MINUTES_TO_PAY = 5
