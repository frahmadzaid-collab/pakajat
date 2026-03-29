import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const C = {
  orange: "#F26522", dark: "#D4521A",
  light: "#FFF4EE", white: "#FFFFFF",
  ink: "#111827", gray: "#6B7280",
  muted: "#F3F4F6", border: "#E5E7EB",
  green: "#16A34A", greenBg: "#F0FDF4",
  red: "#DC2626", redBg: "#FEF2F2",
  blue: "#2563EB", blueBg: "#EFF6FF",
}

const StatCard = ({ icon, label, value, color = C.orange, sub }) => (
  <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{value}</div>
    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
  </div>
)

export default function AdminDashboard() {
  const [page, setPage] = useState('overview')
  const [stats, setStats] = useState({ requests: 0, offers: 0, accepted: 0, companies: 0 })
  const [requests, setRequests] = useState([])
  const [offers, setOffers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [reqFilter, setReqFilter] = useState('all')
  const [offerFilter, setOfferFilter] = useState('all')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: reqs } = await supabase.from('trip_requests').select('*').order('created_at', { ascending: false })
    const { data: offs } = await supabase.from('offers').select('*, trip_requests(destination, travelers)').order('created_at', { ascending: false })
    const { data: comps } = await supabase.from('companies').select('*').order('created_at', { ascending: false })

    setRequests(reqs || [])
    setOffers(offs || [])
    setCompanies(comps || [])
    setStats({
      requests: reqs?.length || 0,
      offers: offs?.length || 0,
      accepted: offs?.filter(o => o.status === 'accepted').length || 0,
      companies: comps?.length || 0,
    })
    setLoading(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut() }

  const deleteRequest = async (id) => {
    if (!confirm('هل تريد حذف هذا الطلب؟')) return
    await supabase.from('trip_requests').delete().eq('id', id)
    fetchData()
  }

  const deleteOffer = async (id) => {
    if (!confirm('هل تريد حذف هذا العرض؟')) return
    await supabase.from('offers').delete().eq('id', id)
    fetchData()
  }

  const toggleRequestStatus = async (id, status) => {
    await supabase.from('trip_requests').update({ status: status === 'open' ? 'closed' : 'open' }).eq('id', id)
    fetchData()
  }

  const approveCompany = async (id) => {
    await supabase.from('companies').update({ approved: true }).eq('id', id)
    fetchData()
  }

  const deleteCompany = async (id) => {
    if (!confirm('هل تريد حذف هذه الشركة؟')) return
    await supabase.from('companies').delete().eq('id', id)
    fetchData()
  }

  const filteredRequests = requests.filter(r => {
    if (reqFilter === 'all') return true
    return r.status === reqFilter
  })

  const filteredOffers = offers.filter(o => {
    if (offerFilter === 'all') return true
    return o.status === offerFilter
  })

  const tabs = [
    { id: 'overview', icon: '📊', label: 'نظرة عامة' },
    { id: 'requests', icon: '📋', label: 'الطلبات' },
    { id: 'offers', icon: '💬', label: 'العروض' },
    { id: 'companies', icon: '🏢', label: 'الشركات' },
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={fetchData} style={{ background: C.light, color: C.orange, border: 'none', borderRadius: 8, padding: '7px 12px', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}>🔄 تحديث</button>
            <button onClick={handleLogout} style={{ background: C.redBg, color: C.red, border: `1px solid #FECACA`, borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>خروج 🚪</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 16px 80px', maxWidth: 800, margin: '0 auto' }}>

          {/* OVERVIEW */}
          {page === 'overview' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>📊 نظرة عامة</div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatCard icon="📋" label="إجمالي الطلبات" value={stats.requests} sub={`${requests.filter(r => r.status === 'open').length} مفتوحة`} />
                <StatCard icon="💬" label="إجمالي العروض" value={stats.offers} sub={`${stats.accepted} مقبولة`} color={C.green} />
                <StatCard icon="🏢" label="الشركات" value={stats.companies} sub={`${companies.filter(c => c.approved).length} موافق عليها`} color={C.blue} />
              </div>

              {/* معدل القبول */}
              <div style={{ background: C.white, borderRadius: 14, padding: '16px', border: `1px solid ${C.border}`, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 10 }}>📈 معدل قبول العروض</div>
                <div style={{ height: 8, background: C.muted, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${stats.offers > 0 ? Math.round((stats.accepted / stats.offers) * 100) : 0}%`, background: `linear-gradient(90deg,${C.orange},${C.dark})`, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 13, color: C.gray }}>
                  {stats.offers > 0 ? Math.round((stats.accepted / stats.offers) * 100) : 0}٪ من العروض تم قبولها
                </div>
              </div>

              {/* آخر الطلبات */}
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 12 }}>آخر الطلبات</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {requests.slice(0, 5).map((r) => (
                  <div key={r.id} style={{ background: C.white, borderRadius: 12, padding: '12px 16px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              {/* آخر العروض */}
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 12 }}>آخر العروض</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {offers.slice(0, 5).map((o) => (
                  <div key={o.id} style={{ background: C.white, borderRadius: 12, padding: '12px 16px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>🌍 {o.trip_requests?.destination}</div>
                      <div style={{ fontSize: 12, color: C.gray }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.orange }}>{o.price} ريال</div>
                      <span style={{ background: o.status === 'accepted' ? C.greenBg : C.muted, color: o.status === 'accepted' ? C.green : C.gray, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                        {o.status === 'accepted' ? 'مقبول ✓' : 'معلق'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* REQUESTS */}
          {page === 'requests' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 8 }}>📋 جميع الطلبات</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                {[['all', 'الكل'], ['open', 'مفتوحة'], ['closed', 'مغلقة']].map(([val, label]) => (
                  <button key={val} onClick={() => setReqFilter(val)} style={{ border: `1.5px solid ${reqFilter === val ? C.orange : C.border}`, background: reqFilter === val ? C.light : C.white, color: reqFilter === val ? C.orange : C.gray, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: reqFilter === val ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>
              {loading && <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>جاري التحميل...</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRequests.map((r) => (
                  <div key={r.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🌍 {r.destination}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>👥 {r.travelers} مسافرين</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                        {r.notes && <div style={{ fontSize: 12, color: C.gray, marginTop: 4, background: C.muted, borderRadius: 6, padding: '4px 8px' }}>{r.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span style={{ background: r.status === 'open' ? C.greenBg : C.muted, color: r.status === 'open' ? C.green : C.gray, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {r.status === 'open' ? 'مفتوح' : 'مغلق'}
                        </span>
                        <button onClick={() => toggleRequestStatus(r.id, r.status)} style={{ background: C.light, color: C.orange, border: 'none', borderRadius: 7, padding: '5px 10px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          {r.status === 'open' ? 'إغلاق' : 'فتح'}
                        </button>
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

          {/* OFFERS */}
          {page === 'offers' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 8 }}>💬 جميع العروض</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                {[['all', 'الكل'], ['pending', 'معلقة'], ['accepted', 'مقبولة'], ['rejected', 'مرفوضة']].map(([val, label]) => (
                  <button key={val} onClick={() => setOfferFilter(val)} style={{ border: `1.5px solid ${offerFilter === val ? C.orange : C.border}`, background: offerFilter === val ? C.light : C.white, color: offerFilter === val ? C.orange : C.gray, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: offerFilter === val ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOffers.map((o) => (
                  <div key={o.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🌍 {o.trip_requests?.destination}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>👥 {o.trip_requests?.travelers} مسافرين</div>
                        {o.description && <div style={{ fontSize: 12, color: C.gray, marginTop: 4, background: C.muted, borderRadius: 6, padding: '4px 8px' }}>{o.description}</div>}
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{o.price} ريال</div>
                        <span style={{ background: o.status === 'accepted' ? C.greenBg : o.status === 'rejected' ? C.redBg : C.muted, color: o.status === 'accepted' ? C.green : o.status === 'rejected' ? C.red : C.gray, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                          {o.status === 'accepted' ? 'مقبول ✓' : o.status === 'rejected' ? 'مرفوض' : 'معلق'}
                        </span>
                        <button onClick={() => deleteOffer(o.id)} style={{ background: C.redBg, color: C.red, border: 'none', borderRadius: 7, padding: '5px 10px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* COMPANIES */}
          {page === 'companies' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 8 }}>🏢 إدارة الشركات</div>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>{companies.length} شركة مسجلة · {companies.filter(c => c.approved).length} موافق عليها</div>
              {companies.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                  <div style={{ fontSize: 15, color: C.gray }}>لا توجد شركات مسجلة بعد</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {companies.map((c) => (
                  <div key={c.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${c.approved ? C.border : C.orange}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🏢 {c.company_name}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>📍 {c.city || 'غير محدد'}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span style={{ background: c.approved ? C.greenBg : C.light, color: c.approved ? C.green : C.orange, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {c.approved ? 'موافق عليها ✓' : 'قيد المراجعة'}
                        </span>
                        {!c.approved && (
                          <button onClick={() => approveCompany(c.id)} style={{ background: C.greenBg, color: C.green, border: `1px solid #86EFAC`, borderRadius: 7, padding: '5px 12px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                            ✓ موافقة
                          </button>
                        )}
                        <button onClick={() => deleteCompany(c.id)} style={{ background: C.redBg, color: C.red, border: 'none', borderRadius: 7, padding: '5px 10px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>
                          حذف
                        </button>
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
              <span style={{ fontSize: 20, opacity: page === t.id ? 1 : 0.5 }}>{t.icon}</span>
              <span style={{ fontSize: 11, fontWeight: page === t.id ? 700 : 400, color: page === t.id ? C.orange : C.gray }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}