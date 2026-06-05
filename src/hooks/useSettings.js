import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_REWARDS = [
  { emoji: '🏷', name: '10% off purchase', pts: 150 },
  { emoji: '🎁', name: 'Free wrap', pts: 200 },
  { emoji: '💨', name: 'Free vape kit', pts: 500 },
  { emoji: '⭐', name: 'Premium bundle', pts: 750 },
]

export function useSettings() {
  const [pointsPerDollar, setPointsPerDollar] = useState(1)
  const [vapeThreshold, setVapeThreshold] = useState(7)
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [rewards, setRewards] = useState(DEFAULT_REWARDS)
  const [vapeCardTitle, setVapeCardTitle] = useState('Vape Punch Card')
  const [vapeUnder20Label, setVapeUnder20Label] = useState('Under $20 vapes')
  const [vapeOver20Label, setVapeOver20Label] = useState('Over $20 vapes')
  const [loading, setLoading] = useState(true)

  const parseSettings = useCallback((rows) => {
    if (!rows || rows.length === 0) return
    const map = {}
    rows.forEach((row) => { map[row.key] = row.value })
    if (map.points_per_dollar !== undefined) setPointsPerDollar(Number(map.points_per_dollar) || 1)
    if (map.vape_threshold !== undefined) setVapeThreshold(Number(map.vape_threshold) || 7)
    if (map.google_review_url !== undefined) setGoogleReviewUrl(map.google_review_url)
    if (map.rewards !== undefined) {
      try {
        const parsed = JSON.parse(map.rewards)
        if (Array.isArray(parsed)) setRewards(parsed)
      } catch { setRewards(DEFAULT_REWARDS) }
    }
    if (map.vape_card_title !== undefined) setVapeCardTitle(map.vape_card_title)
    if (map.vape_under20_label !== undefined) setVapeUnder20Label(map.vape_under20_label)
    if (map.vape_over20_label !== undefined) setVapeOver20Label(map.vape_over20_label)
  }, [])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      parseSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }, [parseSettings])

  useEffect(() => {
    fetchSettings()
    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => { fetchSettings() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchSettings])

  return {
    pointsPerDollar, vapeThreshold, googleReviewUrl, rewards,
    vapeCardTitle, vapeUnder20Label, vapeOver20Label,
    loading, refetch: fetchSettings,
  }
}
