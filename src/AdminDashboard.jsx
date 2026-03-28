import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const C = {
  orange: "#F26522", dark: "#D4521A",
  light: "#FFF4EE", white: "#FFFFFF",
  ink: "#111827", gray: "#6B7280",
  muted: "#F3F4F6", border: "#E5E7EB",
  green: "#16A34A", greenBg: "#F0FDF4",
  red: "#DC2626", redBg: "#FEF2F2",
}

const StatCard = ({ icon, label, value }) => (
  <div style={{ background: C.white, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>{value}</div>
    <div style={{ fontSize: 13, color: C.gray }}>{label}</div>
  </div>
)

export default function AdminDashboard() {
  const [page, setPage] = useState('overview')
  const [stats, setStats] = useState({ requests: 0, offers: 0, users: 0 })
  const [requests, setRequests] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: reqs } = await supabase.from('trip_requests').select('*').order('created_at', { ascending: false })
    const { data: offs } = await supabase.from('offers').select('*, trip_requests(destination)').order('created_at', { ascending: false })
    
    setRequests(reqs || [])
    setOffers(offs || [])
    setStats({
      requests: reqs?.length || 0,
      offers: offs?.length || 0,
      users: 0,
    })
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const deleteRequest = async (id) => {
    await supabase.from('trip_requests').delete().eq('id', id)
    fetchData()
  }

  const tabs = [
    { id: 'overview', icon: '📊', label: 'نظرة عامة' },
    { id: 'requests', icon: '📋', label: 'الطلبات' },
    { id: 'offers', icon: '💬', label: 'العروض' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} body{font-family:'Tajawal',sans-serif;}`}</style>
      <div style={{ direction: 'rtl', background: C.muted, minHeight: '100vh', fontFamily: 'Tajawal,sans-serif' }}>

        {/* Header */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, borderRadius: 11, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: 900, fontSize: 17 }}>ب</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>بكجات — الإدارة</div>
              <div style={{ fontSize: 10, color: C.gray }}>لوحة تحكم المدير</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: C.redBg, color: C.red, border: `1px solid #FECACA`, borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            خروج 🚪
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 16px 80px', maxWidth: 800, margin: '0 auto' }}>

          {page === 'overview' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>📊 نظرة عامة</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <StatCard icon="📋" label="إجمالي الطلبات" value={stats.requests} />
                <StatCard icon="💬" label="إجمالي العروض" value={stats.offers} />
                <StatCard icon="✅" label="عروض مقبولة" value={offers.filter(o => o.status === 'accepted').length} />
              </div>

              {/* Recent Requests */}
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 12 }}>آخر الطلبات</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.slice(0, 5).map((r) => (
                  <div key={r.id} style={{ background: C.white, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>🌍 {r.destination}</div>
                      <div style={{ fontSize: 12, color: C.gray }}>👥 {r.travelers} مسافرين · {new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                    </div>
                    <span style={{ background: r.status === 'open' ? C.greenBg : C.muted, color: r.status === 'open' ? C.green : C.gray, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === 'requests' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>📋 جميع الطلبات</div>
              {loading && <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>جاري التحميل...</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.map((r) => (
                  <div key={r.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🌍 {r.destination}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>👥 {r.travelers} مسافرين</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                        {r.notes && <div style={{ fontSize: 12, color: C.gray, marginTop: 4, background: C.muted, borderRadius: 6, padding: '4px 8px' }}>{r.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span style={{ background: r.status === 'open' ? C.greenBg : C.muted, color: r.status === 'open' ? C.green : C.gray, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                        </span>
                        <button onClick={() => deleteRequest(r.id)} style={{ background: C.redBg, color: C.red, border: 'none', borderRadius: 7, padding: '5px 10px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === 'offers' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>💬 جميع العروض</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {offers.map((o) => (
                  <div key={o.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🌍 {o.trip_requests?.destination}</div>
                        <div style={{ fontSize: 13, color: C.gray }}>{o.description}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>{o.price}</div>
                        <div style={{ fontSize: 11, color: C.gray }}>ريال</div>
                        <span style={{ background: o.status === 'accepted' ? C.greenBg : C.muted, color: o.status === 'accepted' ? C.green : C.gray, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, display: 'block', marginTop: 4 }}>
                          {o.status === 'accepted' ? 'مقبول ✓' : 'معلق'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{ position: 'fixed', bottom: 0, right: 0, left: 0, background: C.white, borderTop: `1px solid ${C.border}`, display: 'flex', padding: '6px 0 8px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setPage(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>
              <span style={{ fontSize: 22, opacity: page === t.id ? 1 : 0.5 }}>{t.icon}</span>
              <span style={{ fontSize: 11, fontWeight: page === t.id ? 700 : 400, color: page === t.id ? C.orange : C.gray }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}