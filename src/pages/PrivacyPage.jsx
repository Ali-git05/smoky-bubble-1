import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <Link to="/customer" className="text-gray-400 text-sm hover:text-gray-600 mb-8 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="text-gray-700 space-y-4 text-base leading-relaxed">
        <p>We collect your name, phone number, and date of birth to operate our loyalty rewards program.</p>
        <p>Your information is used solely to track loyalty points, send rewards, and communicate program updates via SMS.</p>
        <p>Mobile information and messaging consent will not be shared with third parties or affiliates for marketing or promotional purposes.</p>
        <p>We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes.</p>
        <p>To opt out of SMS messages at any time, reply STOP to any message.</p>
        <p>For questions contact us at <span className="text-gray-900 font-medium">smokybubbles.com</span></p>
      </div>
    </div>
  )
}
