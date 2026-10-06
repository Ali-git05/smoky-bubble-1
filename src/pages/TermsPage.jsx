import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <Link to="/customer" className="text-gray-400 text-sm hover:text-gray-600 mb-8 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
      <div className="text-gray-700 space-y-4 text-base leading-relaxed mt-6">
        <p><strong>Program:</strong> Smoky Bubble Loyalty Rewards SMS Program</p>
        <p>You will receive recurring SMS messages about your points balance, rewards, birthday offers, and promotions.</p>
        <p>Message and data rates may apply.</p>
        <p>Message frequency varies.</p>
        <p>To opt out, reply STOP to any message.</p>
        <p>To get help, reply HELP or visit <span className="text-gray-900 font-medium">smokybubbles.com</span></p>
        <p>Mobile information and messaging consent will not be shared with third parties or affiliates for marketing or promotional purposes.</p>
      </div>
    </div>
  )
}
