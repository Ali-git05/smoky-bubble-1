import twilio from 'twilio'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, message } = req.body
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing to or message' })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from) {
    return res.status(500).json({ error: 'Twilio credentials not configured' })
  }

  // Normalize to E.164 — assume US if 10 digits
  const digits = to.replace(/\D/g, '')
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`

  try {
    const client = twilio(accountSid, authToken)
    const msg = await client.messages.create({ from, to: e164, body: message })
    return res.status(200).json({ sid: msg.sid })
  } catch (err) {
    console.error('Twilio error:', err)
    return res.status(500).json({ error: err.message })
  }
}
