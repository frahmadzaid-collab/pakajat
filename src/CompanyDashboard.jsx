import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const C = {
  orange: "#F26522", dark: "#D4521A",
  light: "#FFF4EE", white: "#FFFFFF",
  ink: "#111827", gray: "#6B7280",
  muted: "#F3F4F6", border: "#E5E7EB",
  green: "#16A34A", greenBg: "#F0FDF4",
  blue: "#2563EB", blueBg: "#EFF6FF",
}

const StatCard = ({ icon, label, value, color = C.orange }) => (
  <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, flex: 1, textAlign: 'center' }}>
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{value}</div>
    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{label}</div>
  </div>
)

const OfferForm = ({ requestId, onSent }) => {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const sendOffer = async () => {
    if (!price) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single()
    await supabase.from('offers').insert({
      request_id: requestId,
      company_id: company?.id || null,
      price: parseFloat(price),
      description: description,
      status: 'pending'
    })
    setLoading(false)
    setSent(true)
    setOpen(false)
    if (onSent) onSent()
  }

  if (sent) return (
    <div style={{ background: C.greenBg, border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 13, color: C.green, fontWeight: 700 }}>
      ✅ تم إرسال العرض بنجاح!
    </div>
  )

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ width: '100%', background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          إرسال عرض ←
        </button>
      ) : (
        <div style={{ background: '#FAFAFA', borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>📤 تفاصيل العرض</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 5 }}>السعر الإجمالي (ريال)</div>
            <input type="number" placeholder="مثال: 4200" value={price} onChange={e => setPrice(e.target.value)}
              style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
              onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 5 }}>تفاصيل العرض</div>
            <textarea placeholder="مثال: يشمل الطيران + فندق 4 نجوم + جولات يومية..." value={description} onChange={e => setDescription(e.target.value)} rows={3}
              style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'none', direction: 'rtl', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={sendOffer} disabled={loading} style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {loading ? 'جاري...' : '🚀 إرسال'}
            </button>
            <button onClick={() => setOpen(false)} style={{ background: C.muted, color: C.gray, border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanyDashboard() {
  const [page, setPage] = useState('requests')
  const [requests, setRequests] = useState([])
  const [myOffers, setMyOffers] = useState([])
  const [user, setUser] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0 })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setCompanyName(user?.user_metadata?.full_name || 'شركتي السياحية')

    // جلب الطلبات المفتوحة
    const { data: reqs } = await supabase
      .from('trip_requests').select('*').eq('status', 'open').order('created_at', { ascending: false })
    setRequests(reqs || [])

    // جلب عروضي
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single()

    if (company) {
      const { data: offs } = await supabase
        .from('offers')
        .select('*, trip_requests(destination, travelers)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      setMyOffers(offs || [])
      setStats({
        total: offs?.length || 0,
        accepted: offs?.filter(o => o.status === 'accepted').length || 0,
        pending: offs?.filter(o => o.status === 'pending').length || 0,
      })
    }
    setLoading(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut() }

  const saveName = async () => {
    await supabase.auth.updateUser({ data: { full_name: companyName } })
    setEditingName(false)
  }

  const tabs = [
    { id: 'requests', icon: '📬', label: 'الطلبات' },
    { id: 'offers', icon: '📤', label: 'عروضي' },
    { id: 'stats', icon: '📊', label: 'الإحصائيات' },
    { id: 'profile', icon: '🏢', label: 'شركتي' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} body{font-family:'Tajawal',sans-serif;}`}</style>
      <div style={{ direction: 'rtl', background: '#F3F4F6', minHeight: '100vh', fontFamily: 'Tajawal,sans-serif' }}>

        {/* Header */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, borderRadius: 11, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontWeight: 900, fontSize: 17 }}>ب</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>بكجات — الشركات</div>
              <div style={{ fontSize: 10, color: C.gray }}>{companyName}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            خروج 🚪
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 16px 80px', maxWidth: 700, margin: '0 auto' }}>

          {/* REQUESTS */}
          {page === 'requests' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 4 }}>📬 الطلبات الجديدة</div>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>{requests.length} طلبات مفتوحة — كن الأول للرد</div>
              {loading && <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>جاري التحميل...</div>}
              {!loading && requests.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 15, color: C.gray }}>لا توجد طلبات حالياً</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {requests.map((r) => (
                  <div key={r.id} style={{ background: C.white, borderRadius: 16, padding: '16px', border: `1.5px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🌍 {r.destination}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>👥 {r.travelers} مسافرين</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <span style={{ background: C.greenBg, color: C.green, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>مفتوح</span>
                    </div>
                    {r.notes && <div style={{ fontSize: 13, color: C.gray, background: C.muted, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>{r.notes}</div>}
                    {r.ai_translation && (
                      <div style={{ fontSize: 12, color: C.ink, background: C.light, border: `1px solid ${C.orange}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 10, direction: 'ltr', textAlign: 'left' }}>
                        <div style={{ fontSize: 10, color: C.orange, marginBottom: 4, direction: 'rtl', textAlign: 'right' }}>🤖 ترجمة AI</div>
                        {r.ai_translation}
                      </div>
                    )}
                    <OfferForm requestId={r.id} onSent={fetchAll} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* MY OFFERS */}
          {page === 'offers' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 4 }}>📤 عروضي المرسلة</div>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>{myOffers.length} عروض أرسلتها</div>
              {myOffers.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                  <div style={{ fontSize: 15, color: C.gray }}>لم ترسل أي عروض بعد</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myOffers.map((o) => (
                  <div key={o.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${o.status === 'accepted' ? C.green : o.status === 'rejected' ? '#FECACA' : C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>🌍 {o.trip_requests?.destination}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>👥 {o.trip_requests?.travelers} مسافرين</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                        {o.description && <div style={{ fontSize: 12, color: C.gray, marginTop: 6, background: C.muted, borderRadius: 6, padding: '4px 8px' }}>{o.description}</div>}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>{o.price}</div>
                        <div style={{ fontSize: 10, color: C.gray }}>ريال</div>
                        <span style={{
                          background: o.status === 'accepted' ? C.greenBg : o.status === 'rejected' ? '#FEF2F2' : C.light,
                          color: o.status === 'accepted' ? C.green : o.status === 'rejected' ? '#DC2626' : C.orange,
                          borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, display: 'block', marginTop: 4
                        }}>
                          {o.status === 'accepted' ? 'مقبول ✓' : o.status === 'rejected' ? 'مرفوض' : 'معلق ⏳'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STATS */}
          {page === 'stats' && (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>📊 إحصائياتي</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatCard icon="📤" label="إجمالي العروض" value={stats.total} />
                <StatCard icon="✅" label="عروض مقبولة" value={stats.accepted} />
                <StatCard icon="⏳" label="عروض معلقة" value={stats.pending} />
              </div>
              <div style={{ background: C.white, borderRadius: 14, padding: '16px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>معدل القبول</div>
                <div style={{ height: 8, background: C.muted, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%`, background: `linear-gradient(90deg,${C.orange},${C.dark})`, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 6 }}>
                  {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}٪ من عروضك تم قبولها
                </div>
              </div>
            </>
          )}

          {/* PROFILE */}
          {page === 'profile' && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>🏢 شركتي</div>
              <div style={{ background: C.white, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${C.orange},${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: C.white }}>🏢</div>
                  {editingName ? (
                    <div>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                        style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, border: `1.5px solid ${C.orange}`, borderRadius: 10, padding: '8px 14px', fontFamily: 'inherit', outline: 'none', direction: 'rtl', width: '100%', marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={saveName} style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '8px 20px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>حفظ</button>
                        <button onClick={() => setEditingName(false)} style={{ background: C.muted, color: C.gray, border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{companyName}</div>
                      <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{user?.email}</div>
                      <button onClick={() => setEditingName(true)} style={{ marginTop: 10, background: C.light, color: C.orange, border: `1px solid ${C.orange}33`, borderRadius: 20, padding: '6px 18px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        ✏️ تعديل الاسم
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['📊', 'إجمالي العروض', stats.total], ['✅', 'عروض مقبولة', stats.accepted], ['📅', 'تاريخ التسجيل', new Date(user?.created_at).toLocaleDateString('ar-SA')]].map(([icon, label, val]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.muted, borderRadius: 10 }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <div style={{ flex: 1, fontSize: 13, color: C.ink }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <a href="https://wa.me/00966592244551" target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.white, borderRadius: 13, padding: '14px 16px', border: `1px solid ${C.border}`, textDecoration: 'none', marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📞</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>تواصل مع الدعم</div>
                  <div style={{ fontSize: 12, color: C.gray }}>واتساب — الدعم ٢٤/٧</div>
                </div>
                <span style={{ color: C.green, fontSize: 13, fontWeight: 700 }}>واتساب ↗</span>
              </a>
              <button onClick={handleLogout} style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 13, padding: '14px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                🚪 تسجيل الخروج
              </button>
            </div>
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