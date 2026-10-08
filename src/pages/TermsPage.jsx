import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <Link to="/customer" className="text-gray-400 text-sm hover:text-gray-600 mb-8 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
      <div className="text-gray-700 space-y-4 text-base leading-relaxed mt-6">
        <p><strong>Program:</strong> Smoky Bubble Loyalty Rewards SMS Program</p>
        <p>You will receive recurring SMS messages about your points balance, rewards, birthday offers, and promotions.</p>
        <p>Mobile information and messaging consent will not be shared with third parties or affiliates for marketing or promotional purposes.</p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">SMS Terms</h2>
        <p>Message and data rates may apply. Message frequency varies, max 4 per month. Reply STOP to cancel or HELP for help. Consent is not a condition of purchase. Smoky Bubble.</p>

        <p>To get help, reply HELP or visit <span className="text-gray-900 font-medium">smoky-bubble.vercel.app</span></p>
      </div>
    </div>
  )
}
