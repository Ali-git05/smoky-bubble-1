import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const DEFAULTS = {
  maxPunches: 7,
  rewardTiers: [
    { name: 'Free vape under $20', threshold: 1 },
    { name: 'Free premium vape', threshold: 6 },
  ],
  rewardMessage: 'Congratulations! You earned a reward!',
  vipThreshold: 200,
  vipMessage: 'Welcome back, VIP ⭐',
  giftTiers: [
    { threshold: 300, message: 'You have earned a special gift! Ask staff for details.' },
    { threshold: 500, message: 'You have earned an exclusive VIP gift! Ask staff for details.' },
  ],
  shopName: 'Smoky Bubble',
  vapeTiers: { threshold: 20, tier1: 'Free vape under $20', tier2: 'Free premium vape' },
  pointsTiers: [{ threshold: 100, message: 'You earned a special reward — ask staff to redeem!' }],
  qrCodeUrl: '',
  managerPassword: '',
  rewards: [],
  pointsPerDollar: 1,
  vapeThreshold: 7,
  googleReviewUrl: '',
  vapeCardTitle: 'Vape Punch Card',
  vapeUnder20Label: 'Under $20 vapes',
  vapeOver20Label: 'Over $20 vapes',
}

function tryParse(str, fallback) {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function tryParseObj(str, fallback) {
  try {
    const parsed = JSON.parse(str)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const parseSettings = useCallback((rows) => {
    if (!rows?.length) return
    const map = {}
    rows.forEach(r => { map[r.key] = r.value })
    setSettings({
      maxPunches: Number(map.max_punches) || DEFAULTS.maxPunches,
      rewardTiers: tryParse(map.reward_tiers, DEFAULTS.rewardTiers),
      rewardMessage: map.reward_message ?? DEFAULTS.rewardMessage,
      vipThreshold: Number(map.vip_threshold) || DEFAULTS.vipThreshold,
      vipMessage: map.vip_message ?? DEFAULTS.vipMessage,
      giftTiers: tryParse(map.gift_tiers, DEFAULTS.giftTiers),
      shopName: map.shop_name ?? DEFAULTS.shopName,
      vapeTiers: tryParseObj(map.vape_tiers, DEFAULTS.vapeTiers),
      pointsTiers: tryParse(map.points_tiers, DEFAULTS.pointsTiers),
      qrCodeUrl: map.qr_code_url ?? DEFAULTS.qrCodeUrl,
      managerPassword: map.manager_password ?? DEFAULTS.managerPassword,
      rewards: tryParse(map.rewards, DEFAULTS.rewards),
      pointsPerDollar: Number(map.points_per_dollar) || DEFAULTS.pointsPerDollar,
      vapeThreshold: Number(map.vape_threshold) || DEFAULTS.vapeThreshold,
      googleReviewUrl: map.google_review_url ?? DEFAULTS.googleReviewUrl,
      vapeCardTitle: map.vape_card_title ?? DEFAULTS.vapeCardTitle,
      vapeUnder20Label: map.vape_under20_label ?? DEFAULTS.vapeUnder20Label,
      vapeOver20Label: map.vape_over20_label ?? DEFAULTS.vapeOver20Label,
    })
  }, [])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('settings').select('*')
      if (!error) parseSettings(data)
    } finally {
      setLoading(false)
    }
  }, [parseSettings])

  useEffect(() => {
    fetchSettings()
    const ch = supabase
      .channel('settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchSettings])

  return { ...settings, loading, refetch: fetchSettings }
}
