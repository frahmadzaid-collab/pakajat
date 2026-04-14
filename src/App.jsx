import { useState } from "react";
import { useEffect } from "react"
import { supabase } from "./supabase"
import Login from "./pages/Login"
import CompanyDashboard from "./CompanyDashboard"
import AdminDashboard from "./AdminDashboard"
const C = {
  orange: "#F26522", dark: "#D4521A",
  light: "#FFF4EE", white: "#FFFFFF",
  ink: "#111827", gray: "#6B7280",
  muted: "#F3F4F6", border: "#E5E7EB",
  green: "#16A34A", greenBg: "#F0FDF4",
  blue: "#2563EB", blueBg: "#EFF6FF",
  purple: "#7C3AED", purpleBg: "#F5F3FF",
  amber: "#D97706", amberBg: "#FEF3C7",
  red: "#EA580C", redBg: "#FFF7ED",
};

const Chip = ({ label, active, onClick, color=C.orange, bg=C.light }) => (
  <button onClick={onClick} style={{border:`1.5px solid ${active?color:C.border}`,background:active?bg:C.white,color:active?color:C.gray,borderRadius:20,padding:"5px 13px",fontSize:13,fontWeight:active?700:500,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>
    {label}
  </button>
);

const Toggle = ({ value, onChange, label, sub }) => (
  <div onClick={()=>onChange(!value)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",gap:12}}>
    <div style={{flex:1}}>
      <div style={{fontSize:14,fontWeight:600,color:C.ink}}>{label}</div>
      {sub&&<div style={{fontSize:12,color:C.gray,marginTop:2}}>{sub}</div>}
    </div>
    <div style={{width:46,height:26,borderRadius:13,background:value?C.orange:C.border,position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,right:value?3:"auto",left:value?"auto":3,width:20,height:20,borderRadius:"50%",background:C.white,boxShadow:"0 1px 4px rgba(0,0,0,0.18)",transition:"all .2s"}}/>
    </div>
  </div>
);

const Label = ({children}) => <div style={{fontSize:12,color:C.gray,fontWeight:600,marginBottom:6}}>{children}</div>;

const Stepper = ({value,onChange,min=1,max=30})=>(
  <div style={{display:"flex",alignItems:"center",gap:14}}>
    <button onClick={()=>onChange(Math.max(min,value-1))} style={{width:34,height:34,borderRadius:"50%",border:`1.5px solid ${C.border}`,background:C.white,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.orange,fontWeight:700}}>−</button>
    <span style={{fontSize:20,fontWeight:800,color:C.ink,minWidth:30,textAlign:"center"}}>{value}</span>
    <button onClick={()=>onChange(Math.min(max,value+1))} style={{width:34,height:34,borderRadius:"50%",border:"none",background:C.orange,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontWeight:700}}>+</button>
  </div>
);

const Stars = ({value,onChange})=>(
  <div style={{display:"flex",gap:6}}>
    {[2,3,4,5].map(s=>(
      <button key={s} onClick={()=>onChange(s)} style={{border:`1.5px solid ${value>=s?"#F59E0B":C.border}`,background:value>=s?"#FFFBEB":C.white,borderRadius:8,padding:"5px 10px",fontFamily:"inherit",fontSize:13,fontWeight:value>=s?700:400,cursor:"pointer",color:value>=s?"#D97706":C.gray}}>{"★".repeat(s)}</button>
    ))}
  </div>
);

const SvcCard = ({icon,title,sub,active,onToggle,color=C.orange,bg=C.light,children})=>(
  <div style={{background:C.white,borderRadius:16,border:`1.5px solid ${active?color:C.border}`,overflow:"hidden",boxShadow:active?`0 2px 12px ${color}20`:"0 1px 3px rgba(0,0,0,0.04)",transition:"all .2s"}}>
    <div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:13,padding:"15px 16px",cursor:"pointer"}}>
      <div style={{width:44,height:44,borderRadius:13,background:active?bg:C.muted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,transition:"background .2s"}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:active?C.ink:C.gray}}>{title}</div>
        <div style={{fontSize:12,color:C.gray,marginTop:1}}>{sub}</div>
      </div>
      <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${active?color:C.border}`,background:active?color:C.white,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>
        {active&&<span style={{color:C.white,fontSize:13,fontWeight:800}}>✓</span>}
      </div>
    </div>
    {active&&children&&(
      <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.border}`}}>
        <div style={{height:14}}/>{children}
      </div>
    )}
  </div>
);

// ── HOME ──────────────────────────────────────────────────────────
const Home = ({setPage})=>{
  const [user, setUser] = useState(null)
  const [offers, setOffers] = useState([])
  const [trips, setTrips] = useState([])
  const [stats, setStats] = useState({ requests:0, offers:0, accepted:0 })
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ fetchData() },[])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data: requests } = await supabase.from('trip_requests').select('id').eq('user_id', user.id)
    if (requests && requests.length > 0) {
      const requestIds = requests.map(r => r.id)
      const { data: offs } = await supabase.from('offers').select('*, trip_requests(destination, travelers)').in('request_id', requestIds).order('created_at', { ascending: false }).limit(3)
      setOffers(offs || [])
      setStats({ requests: requests.length, offers: offs?.length || 0, accepted: offs?.filter(o=>o.status==='accepted').length || 0 })
    }
    const { data: tripsData } = await supabase.from('trip_requests').select('*, offers(count)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
    setTrips(tripsData || [])
    setLoading(false)
  }

  const name = user?.user_metadata?.full_name || 'بك'

  return(
    <div>
      <div style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,padding:"28px 20px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:4}}>مرحباً {name} 👋</div>
          <div style={{fontSize:26,fontWeight:900,color:C.white,lineHeight:1.2,marginBottom:8}}>احصل على أفضل<br/>عرض لرحلتك</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:20}}>اختر خدماتك والشركات تتنافس عليك</div>
          <button onClick={()=>setPage("request")} style={{background:C.white,color:C.orange,borderRadius:14,padding:"13px 28px",fontFamily:"inherit",fontWeight:800,fontSize:15,border:"none",cursor:"pointer"}}>
            ابدأ طلب رحلة ←
          </button>
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,margin:"16px 0"}}>
          {[["✈️", loading?"...":stats.requests,"طلباتي"],["💬", loading?"...":stats.offers,"عروض"],["✅", loading?"...":stats.accepted,"مقبولة"]].map(([i,v,l])=>(
            <div key={l} style={{background:C.white,borderRadius:14,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:20}}>{i}</div>
              <div style={{fontSize:20,fontWeight:800,color:C.ink}}>{v}</div>
              <div style={{fontSize:10,color:C.gray}}>{l}</div>
            </div>
          ))}
        </div>
        {trips.length > 0 && (
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:16,fontWeight:800,color:C.ink}}>طلباتي الأخيرة 📋</div>
              <button onClick={()=>setPage("trips")} style={{background:"none",border:"none",color:C.orange,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>عرض الكل</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {trips.map((t)=>(
                <div key={t.id} onClick={()=>setPage("trips")} style={{background:C.white,borderRadius:14,padding:"13px 16px",border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:C.ink}}>🌍 {t.destination}</div>
                    <div style={{fontSize:11,color:C.gray,marginTop:2}}>👥 {t.travelers} مسافرين · {new Date(t.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{background:t.status==='open'?C.greenBg:C.muted,color:t.status==='open'?C.green:C.gray,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>
                      {t.status==='open'?'مفتوح':'مغلق'}
                    </span>
                    <span style={{background:C.blueBg,color:C.blue,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>
                      💬 {t.offers?.[0]?.count||0} عروض
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:16,fontWeight:800,color:C.ink}}>العروض الواردة 🔥</div>
          <button onClick={()=>setPage("trips")} style={{background:"none",border:"none",color:C.orange,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>عرض الكل</button>
        </div>
        {loading && <div style={{textAlign:"center",padding:20,color:C.gray}}>جاري التحميل...</div>}
        {!loading && offers.length === 0 && (
          <div style={{textAlign:"center",padding:30,background:C.white,borderRadius:16,border:`1px solid ${C.border}`,marginBottom:20}}>
            <div style={{fontSize:28,marginBottom:8}}>📭</div>
            <div style={{fontSize:14,color:C.gray}}>لا توجد عروض بعد</div>
            <button onClick={()=>setPage("request")} style={{marginTop:12,background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"10px 24px",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              ✈️ اطلب رحلة الآن
            </button>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:24}}>
          {offers.map((o,i)=>(
            <div key={o.id} style={{background:C.white,borderRadius:16,padding:"15px 16px",border:`1.5px solid ${i===0?C.orange:C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:C.ink,marginBottom:3}}>🏢 شركة سياحية</div>
                  <div style={{fontSize:13,color:C.gray}}>🌍 {o.trip_requests?.destination}</div>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:22,fontWeight:900,color:C.orange}}>{o.price}</div>
                  <div style={{fontSize:11,color:C.gray}}>ريال</div>
                </div>
              </div>
              {o.status==='pending'&&(
                <button onClick={()=>setPage("trips")} style={{width:"100%",background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"10px",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  عرض التفاصيل والقبول ←
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── REQUEST ───────────────────────────────────────────────────────
const Request = ({setPage})=>{
  const [step, setStep] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cities, setCities] = useState([{ city: '', from: '', to: '' }])
  const [svcs, setSvcs] = useState({
    flight: false, visa: false, arrival: false, arrVip: false,
    departure: false, depVip: false, car: false, carDays: 'طوال الرحلة',
    carCustomDays: '', hotel: false, sim: false, simQty: 2, tickets: false, program: false,
  })
  const [flights, setFlights] = useState([{ from: '', to: '', date: '' }])
  const [hotels, setHotels] = useState([])
  const [selectedAttractions, setSelectedAttractions] = useState([])
  const [notes, setNotes] = useState('')
  const [offerDuration, setOfferDuration] = useState(24)
  const [aiState, setAiState] = useState('idle')
  const [done, setDone] = useState(false)

  const s = (k, v) => setSvcs(p => ({ ...p, [k]: v }))
  const totalTravelers = adults + children
  const activeCnt = ['flight','visa','arrival','departure','car','hotel','sim','tickets','program'].filter(k => svcs[k]).length

  const attrMap = {
    'باريس': [{ name: 'برج إيفل' }, { name: 'متحف اللوفر' }, { name: 'قوس النصر' }, { name: 'قصر فيرساي' }],
    'إسطنبول': [{ name: 'آيا صوفيا' }, { name: 'القصر العثماني' }, { name: 'البازار الكبير' }, { name: 'برج غلطة' }],
    'ماليزيا': [{ name: 'برجا بتروناس' }, { name: 'جزيرة لنكاوي' }, { name: 'كاميرون هايلاند' }],
    'دبي': [{ name: 'برج خليفة' }, { name: 'دبي مول' }, { name: 'نخلة جميرا' }, { name: 'صحراء دبي' }],
    'جنيف': [{ name: 'بحيرة جنيف' }, { name: 'نافورة جنيف' }, { name: 'متحف الصليب الأحمر' }],
    'لندن': [{ name: 'برج لندن' }, { name: 'متحف بريطاني' }, { name: 'قصر باكنهام' }, { name: 'عين لندن' }],
    'روما': [{ name: 'الكولوسيوم' }, { name: 'نافورة تريفي' }, { name: 'الفاتيكان' }],
  }

  const updateCities = (newCities) => {
    setCities(newCities)
    setHotels(newCities.filter(c => c.city).map(c => ({ city: c.city, stars: 4, name: '', breakfast: false })))
  }

  const allCityAttractions = cities.filter(c => c.city && attrMap[c.city]).flatMap(c =>
    (attrMap[c.city] || []).map(a => ({ ...a, city: c.city }))
  )

  const buildSummary = () => {
    const p = []
    p.push(`المسافرون: ${adults} بالغ${children > 0 ? ` + ${children} أطفال` : ''}`)
    p.push(`فترة الرحلة: ${dateFrom} → ${dateTo}`)
    if (cities.filter(c => c.city).length > 0) p.push(`مسار الرحلة: ${cities.filter(c => c.city).map(c => `${c.city} (${c.from}→${c.to})`).join(' ← ')}`)
    if (svcs.flight) p.push(`طيران: ${flights.map(f => `${f.from}→${f.to} (${f.date})`).join(' | ')}`)
    if (svcs.visa) p.push(`تأشيرة سياحية`)
    if (svcs.arrival) p.push(`استقبال مطار${svcs.arrVip ? ' VIP' : ''}`)
    if (svcs.departure) p.push(`توديع مطار${svcs.depVip ? ' VIP' : ''}`)
    if (svcs.car) p.push(`سيارة بسائق: ${svcs.carDays === 'عدد أيام' ? `${svcs.carCustomDays} أيام` : svcs.carDays}`)
    if (svcs.hotel) p.push(`فنادق: ${hotels.map(h => `${h.city} ${h.stars}★${h.name ? ` (${h.name})` : ''}${h.breakfast ? ' + إفطار' : ''}`).join(' | ')}`)
    if (svcs.sim) p.push(`شرائح جوال: ${svcs.simQty} شرائح (20 قيقا)`)
    if (svcs.tickets && selectedAttractions.length > 0) p.push(`تذاكر سياحية: ${selectedAttractions.map(k => k.split('||')[1]).join('، ')}`)
    if (svcs.program) p.push('تصميم برنامج سياحي يومي')
    if (notes) p.push(`ملاحظات: ${notes}`)
    return p.join('\n')
  }

  const handleSend = async () => {
    setAiState('loading')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('trip_requests').insert({
        user_id: user.id,
        destination: cities.filter(c => c.city).map(c => c.city).join(' - ') || 'غير محدد',
        travelers: totalTravelers,
        services: { ...svcs, flights, hotels, selectedAttractions, adults, children, dateFrom, dateTo, cities },
        notes, ai_translation: buildSummary(), status: 'open',
        offer_duration: offerDuration,
        expires_at: new Date(Date.now() + offerDuration * 60 * 60 * 1000).toISOString(),
        best_price: null, negotiation_done: false,
      })
      await fetch('https://uwmxximdupgfhfypdzll.supabase.co/functions/v1/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          to: 'fr.ahmad.zaid@gmail.com',
          subject: `🌍 طلب رحلة جديد — ${cities.filter(c=>c.city).map(c=>c.city).join(', ')}`,
          body: `وصل طلب رحلة جديد!<br/><br/>${buildSummary().replace(/\n/g,'<br/>')}`
        })
      })
      setAiState('done'); setDone(true)
    } catch { setAiState('error') }
  }

  const Progress = () => (
    <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
      {['المسافرون','المسار','الخدمات','الإرسال'].map((label, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', height: 5, borderRadius: 3, background: step > i ? C.orange : step === i+1 ? C.orange : C.border }} />
          <div style={{ fontSize: 9, color: step === i+1 ? C.orange : C.gray, fontWeight: step === i+1 ? 700 : 400 }}>{label}</div>
        </div>
      ))}
    </div>
  )

  const inp = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box', direction: 'rtl', background: C.white }

  if (step === 1) return (
    <div>
      <Progress />
      <div style={{ padding: '16px 20px 24px' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 4 }}>المسافرون والفترة 🗓️</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>حدد عدد المسافرين وتاريخ الرحلة</div>
        {[['👨‍👩‍👧 البالغون','١٢ سنة فأكثر',adults,setAdults,1,30],['👶 الأطفال','أقل من ١٢ سنة',children,setChildren,0,20]].map(([title,sub,val,setter,min,max])=>(
          <div key={title} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</div><div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</div></div>
              <Stepper value={val} onChange={setter} min={min} max={max} />
            </div>
          </div>
        ))}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>📅 فترة الرحلة</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><Label>تاريخ المغادرة</Label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} /></div>
            <div><Label>تاريخ العودة</Label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} /></div>
          </div>
          {dateFrom && dateTo && <div style={{ marginTop: 10, background: C.light, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.orange, fontWeight: 600 }}>⏱ مدة الرحلة: {Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000*60*60*24))} يوم</div>}
        </div>
        <button onClick={() => setStep(2)} disabled={!dateFrom || !dateTo} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: (dateFrom && dateTo) ? 'pointer' : 'not-allowed', background: (dateFrom && dateTo) ? `linear-gradient(135deg,${C.orange},${C.dark})` : C.border, color: (dateFrom && dateTo) ? C.white : C.gray }}>
          حدد مسار الرحلة ←
        </button>
      </div>
    </div>
  )

  if (step === 2) return (
    <div>
      <Progress />
      <div style={{ padding: '16px 20px 24px' }}>
        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.orange, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>← رجوع</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 4 }}>مسار الرحلة 🗺️</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>أضف المدن التي ستزورها وفترة الإقامة</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {cities.map((c, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 14, padding: '16px', border: `1.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>🏙️ المدينة {i + 1}</div>
                {i > 0 && <button onClick={() => { const n = cities.filter((_, j) => j !== i); updateCities(n) }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>✕ حذف</button>}
              </div>
              <Label>اسم المدينة</Label>
              <input placeholder="مثال: باريس، إسطنبول، دبي..." value={c.city} onChange={e => { const n = cities.map((x, j) => j === i ? { ...x, city: e.target.value } : x); updateCities(n) }} style={{ ...inp, marginBottom: 10 }} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><Label>تاريخ الوصول</Label><input type="date" value={c.from} onChange={e => { const n = cities.map((x, j) => j === i ? { ...x, from: e.target.value } : x); setCities(n) }} style={inp} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} /></div>
                <div><Label>تاريخ المغادرة</Label><input type="date" value={c.to} onChange={e => { const n = cities.map((x, j) => j === i ? { ...x, to: e.target.value } : x); setCities(n) }} style={inp} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} /></div>
              </div>
              {c.city && c.from && c.to && <div style={{ marginTop: 8, background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: C.orange, fontWeight: 600 }}>⏱ {Math.ceil((new Date(c.to) - new Date(c.from)) / (1000*60*60*24))} ليلة في {c.city}</div>}
            </div>
          ))}
        </div>
        <button onClick={() => updateCities([...cities, { city: '', from: '', to: '' }])} style={{ width: '100%', border: `1.5px dashed ${C.orange}`, background: C.light, borderRadius: 12, padding: '11px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: C.orange, cursor: 'pointer', marginBottom: 20 }}>
          + إضافة مدينة أخرى
        </button>
        <button onClick={() => setStep(3)} disabled={!cities.some(c => c.city)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: cities.some(c => c.city) ? 'pointer' : 'not-allowed', background: cities.some(c => c.city) ? `linear-gradient(135deg,${C.orange},${C.dark})` : C.border, color: cities.some(c => c.city) ? C.white : C.gray }}>
          اختر الخدمات ←
        </button>
      </div>
    </div>
  )

  if (step === 3) return (
    <div>
      <Progress />
      <div>
        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.orange, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>← رجوع</button>
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 2 }}>الخدمات المطلوبة 🛎️</div>
          <div style={{ fontSize: 13, color: C.gray }}>{cities.filter(c=>c.city).map(c=>c.city).join(' ← ')} · {totalTravelers} مسافر{activeCnt > 0 && <span style={{ color: C.orange, fontWeight: 700 }}> · {activeCnt} خدمات</span>}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 20px 24px' }}>
          <SvcCard icon="✈️" title="طيران دولي" sub="حجز تذاكر الرحلة" active={svcs.flight} onToggle={() => s('flight', !svcs.flight)} color={C.blue} bg={C.blueBg}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {flights.map((f, i) => (
                <div key={i} style={{ background: '#FAFAFA', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>رحلة {i === 0 ? 'الذهاب' : i === flights.length - 1 ? 'العودة' : `${i + 1}`}</div>
                    {i > 0 && <button onClick={() => setFlights(fs => fs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div><Label>من</Label><input placeholder="الرياض" value={f.from} onChange={e => setFlights(fs => fs.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} style={{ ...inp, fontSize: 12 }} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} /></div>
                    <div><Label>إلى</Label><input placeholder="باريس" value={f.to} onChange={e => setFlights(fs => fs.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} style={{ ...inp, fontSize: 12 }} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} /></div>
                  </div>
                  <Label>تاريخ الرحلة</Label>
                  <input type="date" value={f.date} onChange={e => setFlights(fs => fs.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              ))}
              <button onClick={() => setFlights(fs => [...fs, { from: '', to: '', date: '' }])} style={{ border: `1.5px dashed ${C.blue}`, background: C.blueBg, borderRadius: 10, padding: '9px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: C.blue, cursor: 'pointer' }}>+ إضافة رحلة</button>
            </div>
          </SvcCard>
          <SvcCard icon="📄" title="تأشيرة سياحية" sub="متطلبات ووثائق التأشيرة" active={svcs.visa} onToggle={() => s('visa', !svcs.visa)} color={C.purple} bg={C.purpleBg}>
            <div style={{ background: C.purpleBg, borderRadius: 10, padding: '12px', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: C.gray }}>✓ حجز موعد القنصلية · ✓ تأمين سفر · ✓ ترجمة الوثائق</div>
            </div>
            <div style={{ background: C.white, borderRadius: 10, padding: '12px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>متطلبات التأشيرة</div><div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>الوثائق المطلوبة للسفارة</div></div>
              <a href="https://www.mofa.gov.sa" target="_blank" rel="noopener" style={{ background: C.purple, color: C.white, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>الرابط ↗</a>
            </div>
          </SvcCard>
          <SvcCard icon="🚖" title="استقبال في المطار" sub="خدمة استقبال عند الوصول" active={svcs.arrival} onToggle={() => s('arrival', !svcs.arrival)} color={C.red} bg={C.redBg}>
            <div style={{ background: svcs.arrVip ? C.redBg : C.muted, border: `1.5px solid ${svcs.arrVip ? C.red : C.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <Toggle value={svcs.arrVip} onChange={v => s('arrVip', v)} label="⭐ ترقية VIP" sub="لوحة استقبال مخصصة · عربة كبار الشخصيات" />
            </div>
          </SvcCard>
          <SvcCard icon="🛫" title="توديع إلى المطار" sub="خدمة توديع عند المغادرة" active={svcs.departure} onToggle={() => s('departure', !svcs.departure)} color={C.red} bg={C.redBg}>
            <div style={{ background: svcs.depVip ? C.redBg : C.muted, border: `1.5px solid ${svcs.depVip ? C.red : C.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <Toggle value={svcs.depVip} onChange={v => s('depVip', v)} label="⭐ ترقية VIP" sub="مرافق شخصي · خدمة الأمتعة" />
            </div>
          </SvcCard>
          <SvcCard icon="🚗" title="سيارة بسائق" sub="نقل خاص داخل الوجهة" active={svcs.car} onToggle={() => s('car', !svcs.car)} color={C.green} bg={C.greenBg}>
            <Label>الفترة المطلوبة</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: svcs.carDays === 'عدد أيام' ? 10 : 0 }}>
              {['طوال الرحلة', 'يوم كامل', 'نصف يوم', 'عدد أيام'].map(p => (
                <Chip key={p} label={p} active={svcs.carDays === p} onClick={() => s('carDays', p)} color={C.green} bg={C.greenBg} />
              ))}
            </div>
            {svcs.carDays === 'عدد أيام' && <div style={{ marginTop: 8 }}><Label>عدد الأيام</Label><input type="number" placeholder="مثال: 3" value={svcs.carCustomDays} onChange={e => s('carCustomDays', e.target.value)} style={inp} /></div>}
          </SvcCard>
          <SvcCard icon="🏨" title="فنادق" sub="فنادق تلقائية حسب مسار رحلتك" active={svcs.hotel} onToggle={() => s('hotel', !svcs.hotel)}>
            {hotels.length === 0 ? <div style={{ fontSize: 13, color: C.gray, textAlign: 'center', padding: '10px 0' }}>⚠️ حدد مسار رحلتك أولاً</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hotels.map((h, i) => (
                  <div key={i} style={{ background: '#FAFAFA', borderRadius: 12, padding: 13 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>🏨 فندق {h.city}</div>
                    <Label>تصنيف النجوم</Label>
                    <Stars value={h.stars} onChange={v => setHotels(hs => hs.map((x, j) => j === i ? { ...x, stars: v } : x))} />
                    <div style={{ height: 8 }} />
                    <Label>اسم فندق مقترح (اختياري)</Label>
                    <input placeholder="Hilton، Marriott..." value={h.name} onChange={e => setHotels(hs => hs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} style={inp} />
                    <div style={{ height: 8 }} />
                    <div onClick={() => setHotels(hs => hs.map((x, j) => j === i ? { ...x, breakfast: !x.breakfast } : x))} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 0' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${h.breakfast ? C.orange : C.border}`, background: h.breakfast ? C.orange : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {h.breakfast && <span style={{ color: C.white, fontSize: 12, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.ink, fontWeight: h.breakfast ? 600 : 400 }}>شامل الإفطار</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SvcCard>
          <SvcCard icon="📱" title="شرائح جوال" sub="20 قيقا — إنترنت دولي" active={svcs.sim} onToggle={() => s('sim', !svcs.sim)} color={C.green} bg={C.greenBg}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>عدد الشرائح</div><div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>20 قيقا لكل شريحة</div></div>
              <Stepper value={svcs.simQty} onChange={v => s('simQty', v)} min={1} max={10} />
            </div>
          </SvcCard>
          <SvcCard icon="🎟️" title="تذاكر سياحية" sub="حجز المعالم حسب مسار رحلتك" active={svcs.tickets} onToggle={() => s('tickets', !svcs.tickets)} color={C.amber} bg={C.amberBg}>
            {allCityAttractions.length === 0 ? <div style={{ fontSize: 13, color: C.gray, textAlign: 'center', padding: '10px 0' }}>⚠️ حدد المدن في مسار رحلتك أولاً</div> : (
              <div>
                {cities.filter(c => c.city && attrMap[c.city]).map(c => (
                  <div key={c.city} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>📍 {c.city}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {(attrMap[c.city] || []).map(a => {
                        const key = `${c.city}||${a.name}`
                        const isSelected = selectedAttractions.includes(key)
                        return <button key={key} onClick={() => setSelectedAttractions(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])} style={{ border: `1.5px solid ${isSelected ? C.amber : C.border}`, background: isSelected ? C.amberBg : C.white, color: isSelected ? C.amber : C.gray, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: isSelected ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer' }}>{a.name}</button>
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SvcCard>
          <SvcCard icon="📋" title="تصميم البرنامج السياحي اليومي" sub="يُصمم تلقائياً بالذكاء الاصطناعي" active={svcs.program} onToggle={() => s('program', !svcs.program)}>
            {svcs.program && <div style={{ background: C.light, borderRadius: 10, padding: '11px 13px', fontSize: 13, color: C.ink, lineHeight: 1.6 }}>🤖 سيُصمم الذكاء الاصطناعي برنامجاً يومياً مفصلاً لكل مدينة</div>}
          </SvcCard>
        </div>
        {activeCnt > 0 && (
          <div style={{ padding: '0 20px 24px' }}>
            <button onClick={() => setStep(4)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, boxShadow: '0 6px 20px rgba(242,101,34,0.35)' }}>
              متابعة — {activeCnt} خدمات ←
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <Progress />
      <div>
        <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: C.orange, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>← رجوع</button>
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 2 }}>ملاحظات إضافية 💬</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>{cities.filter(c=>c.city).map(c=>c.city).join(' ← ')} · {totalTravelers} مسافر · {activeCnt} خدمات</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {svcs.flight && <Chip label="✈️ طيران" active color={C.blue} bg={C.blueBg} />}
            {svcs.visa && <Chip label="📄 تأشيرة" active color={C.purple} bg={C.purpleBg} />}
            {svcs.arrival && <Chip label={`🚖 استقبال${svcs.arrVip?' VIP':''}`} active color={C.red} bg={C.redBg} />}
            {svcs.departure && <Chip label={`🛫 توديع${svcs.depVip?' VIP':''}`} active color={C.red} bg={C.redBg} />}
            {svcs.car && <Chip label="🚗 سيارة" active color={C.green} bg={C.greenBg} />}
            {svcs.hotel && <Chip label={`🏨 ${hotels.length} فندق`} active />}
            {svcs.sim && <Chip label={`📱 ${svcs.simQty} شرائح`} active color={C.green} bg={C.greenBg} />}
            {svcs.tickets && selectedAttractions.length > 0 && <Chip label={`🎟️ ${selectedAttractions.length} معالم`} active color={C.amber} bg={C.amberBg} />}
            {svcs.program && <Chip label="📋 برنامج يومي" active />}
          </div>
          <div style={{marginBottom:16}}>
            <Label>⏱ مدة استقبال العروض</Label>
            <div style={{display:'flex',gap:8}}>
              {[24,48,72].map(h=>(
                <button key={h} onClick={()=>setOfferDuration(h)} style={{flex:1,border:`1.5px solid ${offerDuration===h?C.orange:C.border}`,background:offerDuration===h?C.light:C.white,color:offerDuration===h?C.orange:C.gray,borderRadius:12,padding:'10px 8px',fontFamily:'inherit',fontWeight:offerDuration===h?700:500,fontSize:13,cursor:'pointer'}}>
                  {h} ساعة
                </button>
              ))}
            </div>
          </div>
          <Label>ملاحظات خاصة (اختياري)</Label>
          <textarea placeholder="مثال: وجبات حلال فقط، غرفة ذوي احتياجات خاصة..." value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: C.ink, outline: 'none', resize: 'none', direction: 'rtl', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border}
          />
          <div style={{ height: 16 }} />
          <div style={{ background: C.light, border: `1px solid ${C.orange}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 8 }}>🤖 ماذا سيحدث بعد الإرسال؟</div>
            {['سيتم حفظ طلبك في المنصة', 'الشركات السياحية ستستقبل طلبك وترسل عروضاً', 'ستصلك العروض في طلباتي خلال المدة المحددة'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
                <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: C.ink }}>{t}</span>
              </div>
            ))}
          </div>
          {!done ? (
            <button onClick={handleSend} disabled={aiState === 'loading'} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: aiState === 'loading' ? 'not-allowed' : 'pointer', background: aiState === 'loading' ? C.gray : `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white }}>
              {aiState === 'loading' ? '⏳ جاري الإرسال...' : '🚀 إرسال الطلب للشركات'}
            </button>
          ) : (
            <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}`, borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginBottom: 4 }}>تم إرسال طلبك!</div>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 14 }}>ستصلك العروض خلال {offerDuration} ساعة</div>
              <button onClick={() => setPage('trips')} style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                متابعة طلباتي ←
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── BOOKINGS ──────────────────────────────────────────────────────
const Bookings = ()=>{
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ fetchBookings() },[])

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: requests } = await supabase.from('trip_requests').select('id').eq('user_id', user.id)
    if (!requests || requests.length === 0) { setLoading(false); return }
    const requestIds = requests.map(r => r.id)
    const { data } = await supabase.from('offers').select('*, trip_requests(destination, travelers, created_at)').in('request_id', requestIds).eq('status', 'accepted').order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  if (loading) return <div style={{textAlign:'center',padding:40,color:C.gray}}>جاري التحميل...</div>

  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>رحلاتي ✈️</div>
      <div style={{fontSize:13,color:C.gray,marginBottom:16}}>{bookings.length} رحلات مؤكدة</div>
      {bookings.length === 0 && (
        <div style={{textAlign:"center",padding:40,background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:32,marginBottom:8}}>✈️</div>
          <div style={{fontSize:15,color:C.gray}}>لا توجد رحلات مؤكدة بعد</div>
          <div style={{fontSize:13,color:C.gray,marginTop:4}}>بعد قبول عرض سيظهر هنا</div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {bookings.map((b)=>(
          <div key={b.id} style={{background:C.white,borderRadius:16,padding:"16px",border:`1.5px solid ${C.green}`,boxShadow:`0 0 0 3px ${C.green}12`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:C.ink,marginBottom:3}}>🌍 {b.trip_requests?.destination}</div>
                <div style={{fontSize:12,color:C.gray}}>👥 {b.trip_requests?.travelers} مسافرين</div>
                {b.description && <div style={{fontSize:12,color:C.gray,marginTop:6,background:C.muted,borderRadius:6,padding:'4px 8px'}}>{b.description}</div>}
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:20,fontWeight:800,color:C.orange}}>{b.price}</div>
                <div style={{fontSize:10,color:C.gray}}>ريال</div>
                <div style={{background:C.greenBg,color:C.green,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,marginTop:4}}>مؤكدة ✓</div>
              </div>
            </div>
            <button style={{width:'100%',background:C.greenBg,color:C.green,border:`1px solid #86EFAC`,borderRadius:10,padding:"10px",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              📞 تواصل مع الشركة
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TRIPS ─────────────────────────────────────────────────────────
// OfferDetailPage — صفحة تفاصيل العرض الاحترافية
// تُضاف في App.jsx داخل دالة Trips بدل الكود الحالي لـ selectedOffer

const OfferDetailPage = ({ offer: o, trip: t, onBack, onAccept, onNegotiate, onReject }) => {
 const [activeTab, setActiveTab] = useState('services')
const [showRejectModal, setShowRejectModal] = useState(false)
const [rejectReason, setRejectReason] = useState('')
const tabs = [
  { id: 'services', label: 'الخدمات', icon: '🛎️' },
  { id: 'program', label: 'البرنامج', icon: '📅' },
  { id: 'invoice', label: 'الفاتورة', icon: '💰' },
]
 const [program, setProgram] = useState({})
const [loadingProgram, setLoadingProgram] = useState({})

const generateDayProgram = async (day) => {
  if (program[day.day]) return
  setLoadingProgram(p => ({ ...p, [day.day]: true }))
  try {
    const res = await fetch('https://uwmxximdupgfhfypdzll.supabase.co/functions/v1/quick-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        type: 'generate_program',
prompt: `أنت مرشد سياحي خبير. اكتب برنامجاً سياحياً يومياً لـ ${svc?.adults || 2} بالغين في مدينة ${day.city} ليوم ${day.from}.

اكتب البرنامج بهذا التنسيق الثابت:

🌅 الإفطار (٧:٠٠ - ٩:٠٠)
اسم المطعم أو المكان + وصف مختصر

🏛️ الصباح (٩:٠٠ - ١٢:٠٠)
المعلم الأول + وصف
المعلم الثاني + وصف

🍽️ الغداء (١٢:٠٠ - ١٤:٠٠)
اسم مطعم حلال + وصف

🎯 المساء (١٤:٠٠ - ١٨:٠٠)
النشاط المسائي + وصف

🌙 العشاء (١٨:٠٠ - ٢٠:٠٠)
اسم مطعم حلال + وصف

اذكر أسماء حقيقية ومشهورة. اكتب بالعربية فقط. لا تضيف مقدمة أو خاتمة.`      })
    })
    const data = await res.json()
    setProgram(p => ({ ...p, [day.day]: data.text || 'تعذر توليد البرنامج' }))
  } catch (e) {
    setProgram(p => ({ ...p, [day.day]: 'تعذر توليد البرنامج — حاول مرة أخرى' }))
  }
  setLoadingProgram(p => ({ ...p, [day.day]: false }))
}

  const svc = t?.services ? (typeof t.services === 'string' ? JSON.parse(t.services) : t.services) : {}

  const getServiceIcon = (type) => {
    const icons = { flight: '✈️', hotel: '🏨', visa: '📄', arrival: '🚖', departure: '🛫', car: '🚗', sim: '📱', tickets: '🎟️', program: '📋' }
    return icons[type] || '📌'
  }

  const cities = svc.cities || []
  const programDays = cities.length > 0 ? cities.map((c, i) => ({
    day: i + 1,
    city: c.city,
    from: c.from,
    to: c.to,
    nights: c.from && c.to ? Math.ceil((new Date(c.to) - new Date(c.from)) / (1000*60*60*24)) : 0,
  })) : []

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,#F26522,#D4521A)`, padding: '0 0 0 0' }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← رجوع</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>تفاصيل العرض</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>🌍 {o.trip_requests?.destination}</div>
          </div>
        </div>

        {/* معلومات الشركة */}
        <div style={{ background: 'white', margin: '0 16px', borderRadius: 16, padding: '16px', marginBottom: -20, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            {o.companies?.logo_url ? (
              <img src={o.companies.logo_url} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '1px solid #E5E7EB', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg,#F26522,#D4521A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', flexShrink: 0 }}>🏢</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{o.companies?.company_name || 'شركة سياحية'}</div>
              {o.companies?.city && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📍 {o.companies?.country || 'السعودية'} — {o.companies.city}</div>}
              {o.companies?.rating > 0 && <div style={{ fontSize: 12, color: '#D97706', marginTop: 2 }}>{'⭐'.repeat(Math.round(o.companies.rating))} {o.companies.rating}</div>}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F26522' }}>{Number(o.price).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>ريال</div>
            </div>
          </div>
          {o.companies?.bio && <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, marginBottom: 8 }}>{o.companies.bio}</div>}
          {(o.companies?.website || o.companies?.google_maps) && (
            <div style={{ display: 'flex', gap: 8 }}>
              {o.companies?.website && <a href={o.companies.website} target="_blank" rel="noopener" style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>🌐 الموقع</a>}
              {o.companies?.google_maps && <a href={o.companies.google_maps} target="_blank" rel="noopener" style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📍 الخريطة</a>}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '30px 16px 0' }}>
        <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 4, marginBottom: 16, border: '1px solid #E5E7EB' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: activeTab === tab.id ? '#F26522' : 'none', color: activeTab === tab.id ? 'white' : '#6B7280', fontFamily: 'inherit', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── تبويب الخدمات ── */}
        {activeTab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* معلومات الرحلة العامة */}
            <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>📋 معلومات الرحلة</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['👥 المسافرون', `${svc.adults || o.trip_requests?.travelers} ${svc.children > 0 ? `+ ${svc.children} أطفال` : 'بالغين'}`],
                  ['📅 المغادرة', svc.dateFrom || '—'],
                  ['📅 العودة', svc.dateTo || '—'],
                  ['🌍 الوجهة', o.trip_requests?.destination || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* مسار الرحلة */}
            {cities.length > 0 && (
              <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>🗺️ مسار الرحلة</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cities.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#F26522', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>🏙️ {c.city}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{c.from} → {c.to} · {Math.ceil((new Date(c.to) - new Date(c.from)) / (1000*60*60*24))} ليلة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الخدمات المفصلة */}
            {o.offer_items && o.offer_items.length > 0 ? (
              o.offer_items.map((item, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  <div style={{ background: '#F9FAFB', padding: '10px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{getServiceIcon(item.type)} {item.label}</div>
                    {o.show_item_prices && item.price > 0 && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#F26522' }}>{Number(item.price).toLocaleString()} ريال</div>
                    )}
                  </div>
                  {item.details && (
                    <div style={{ padding: '10px 16px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{item.details}</div>
                  )}
                </div>
              ))
            ) : (
              /* عرض قديم بدون offer_items */
              <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>🛎️ الخدمات المشمولة</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    [svc.flight, '✈️', 'طيران دولي'],
                    [svc.visa, '📄', 'تأشيرة سياحية'],
                    [svc.arrival, '🚖', `استقبال مطار${svc.arrVip ? ' VIP' : ''}`],
                    [svc.departure, '🛫', `توديع مطار${svc.depVip ? ' VIP' : ''}`],
                    [svc.car, '🚗', `سيارة بسائق (${svc.carDays || 'طوال الرحلة'})`],
                    [svc.hotel, '🏨', 'فنادق'],
                    [svc.sim, '📱', `شرائح جوال (${svc.simQty || 1} شرائح - 20 قيقا)`],
                    [svc.tickets, '🎟️', 'تذاكر سياحية'],
                    [svc.program, '📋', 'برنامج سياحي يومي'],
                  ].filter(([included]) => included).map(([, icon, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
                      <span style={{ marginRight: 'auto', color: '#16A34A', fontWeight: 700, fontSize: 12 }}>✓ مشمول</span>
                    </div>
                  ))}
                </div>
                {o.description && <div style={{ marginTop: 12, fontSize: 13, color: '#6B7280', lineHeight: 1.6, background: '#F9FAFB', borderRadius: 8, padding: '10px' }}>{o.description}</div>}
              </div>
            )}
          </div>
        )}

        {/* ── تبويب البرنامج ── */}
        {activeTab === 'program' && (
          <div>
            {programDays.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
{programDays.map((day, i) => (
  <div key={i} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', marginBottom: 8 }}>
    <div 
      onClick={() => {
        if (!program[day.day] && !loadingProgram[day.day]) generateDayProgram(day)
        setActiveTab(activeTab === `day_${day.day}` ? 'program' : `day_${day.day}`)
      }}
      style={{ background: 'linear-gradient(135deg,#F26522,#D4521A)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
    >
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{day.from} · {day.city}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>اليوم {day.day}</div>
      </div>
      <div style={{ color: 'white', fontSize: 18 }}>
        {loadingProgram[day.day] ? '⏳' : activeTab === `day_${day.day}` ? '▲' : '▼'}
      </div>
    </div>
    {activeTab === `day_${day.day}` && (
      <div style={{ padding: '16px' }}>
        {program[day.day] ? (
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{program[day.day]}</div>
        ) : loadingProgram[day.day] ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#F26522', fontWeight: 600 }}>⏳ جاري توليد البرنامج...</div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>اضغط مرة أخرى لتوليد البرنامج</div>
        )}
      </div>
    )}
  </div>
))}
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 14, padding: '40px 20px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 15, color: '#6B7280' }}>لم يتم إضافة مسار رحلة</div>
              </div>
            )}
          </div>
        )}

        {/* ── تبويب الفاتورة ── */}
        {activeTab === 'invoice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* جدول الخدمات والأسعار */}
            <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <div style={{ background: '#F9FAFB', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>📋 تفصيل الأسعار</div>
              </div>
              {o.offer_items && o.offer_items.length > 0 ? (
                <div>
                  {o.offer_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: idx < o.offer_items.length - 1 ? '1px solid #F3F4F6' : 'none', background: idx % 2 === 0 ? '#FAFAFA' : 'white' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{getServiceIcon(item.type)} {item.label}</div>
                        {item.details && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{item.details}</div>}
                      </div>
                      {o.show_item_prices ? (
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#F26522', flexShrink: 0, marginRight: 8 }}>
                          {item.price > 0 ? `${Number(item.price).toLocaleString()} ريال` : 'مشمول'}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, flexShrink: 0 }}>✓ مشمول</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                  لا تفاصيل متاحة لهذا العرض
                </div>
              )}
              {/* الإجمالي */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FFF4EE', borderTop: '2px solid #F26522' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>💰 السعر الإجمالي</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F26522' }}>{Number(o.price).toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400, color: '#6B7280' }}>ريال</span></div>
              </div>
            </div>

            {/* صلاحية العرض */}
            {o.offer_duration_hours && (
              <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 16px', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>⏱</span>
                <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                  صلاحية العرض: {o.offer_duration_hours} ساعة من تاريخ الإرسال
                </div>
              </div>
            )}

            {/* طرق الدفع - تظهر فقط عند قبول العرض */}
            {o.status === 'accepted' && o.payment_methods && o.payment_methods.length > 0 ? (
              <div style={{ background: 'white', borderRadius: 14, padding: '16px', border: '1.5px solid #16A34A' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>💳 طرق الدفع المتاحة</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {o.payment_methods.map(p => (
                    <span key={p} style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, border: '1px solid #86EFAC' }}>{p}</span>
                  ))}
                </div>
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#16A34A', fontWeight: 600, textAlign: 'center' }}>
                  📞 تواصل مع الشركة لإتمام عملية الدفع
                </div>
              </div>
            ) : o.status === 'pending' ? (
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#6B7280' }}>💳 طرق الدفع ستظهر بعد قبول العرض</div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* أزرار القرار — ثابتة في الأسفل */}
      {o.status === 'pending' && (
        <div style={{ position: 'fixed', bottom: 0, right: 0, left: 0, background: 'white', borderTop: '1px solid #E5E7EB', padding: '12px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 50 }}>
          <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => onAccept(o.id, o.request_id)} style={{ width: '100%', background: 'linear-gradient(135deg,#F26522,#D4521A)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 20px rgba(242,101,34,0.4)' }}>
              ✅ قبول العرض
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {!t?.negotiation_done ? (
                <button onClick={() => onNegotiate(o.id, o.request_id, o.price)} style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  🤝 طلب تفاوض
                </button>
              ) : (
                <button disabled style={{ background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px', fontFamily: 'inherit', fontSize: 13, cursor: 'not-allowed' }}>
                  🚫 تم التفاوض
                </button>
              )}
              <button onClick={() => setShowRejectModal(true)} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 12, padding: '12px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ❌ رفض العرض
              </button>
            </div>
          </div>
        </div>
      )}

      {o.status === 'accepted' && (
        <div style={{ position: 'fixed', bottom: 0, right: 0, left: 0, background: 'white', borderTop: '1px solid #E5E7EB', padding: '12px 16px', zIndex: 50 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
              ✅ تم قبول هذا العرض
            </div>
          </div>
        </div>
      )}

      {o.status === 'negotiating' && (
        <div style={{ position: 'fixed', bottom: 0, right: 0, left: 0, background: 'white', borderTop: '1px solid #E5E7EB', padding: '12px 16px', zIndex: 50 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#2563EB' }}>
              ⏸️ تم طلب التفاوض — انتظر عرضاً جديداً
            </div>
          </div>
        </div>
      )}

      {/* Modal رفض العرض */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 430 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 6 }}>❌ رفض العرض</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>ما سبب رفضك لهذا العرض؟</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {['السعر مرتفع', 'الخدمات غير مناسبة', 'تواريخ غير مناسبة', 'اخترت عرضاً آخر', 'سبب آخر'].map(reason => (
                <button key={reason} onClick={() => setRejectReason(reason)} style={{ border: `1.5px solid ${rejectReason === reason ? '#DC2626' : '#E5E7EB'}`, background: rejectReason === reason ? '#FEF2F2' : 'white', color: rejectReason === reason ? '#DC2626' : '#374151', borderRadius: 10, padding: '10px 14px', fontFamily: 'inherit', fontWeight: rejectReason === reason ? 700 : 400, fontSize: 13, cursor: 'pointer', textAlign: 'right' }}>
                  {reason}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowRejectModal(false)} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                إلغاء
              </button>
              <button onClick={handleReject} disabled={!rejectReason} style={{ background: rejectReason ? 'linear-gradient(135deg,#DC2626,#B91C1C)' : '#F3F4F6', color: rejectReason ? 'white' : '#9CA3AF', border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: rejectReason ? 'pointer' : 'not-allowed' }}>
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const Trips = ()=>{
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [tripOffers, setTripOffers] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(()=>{ fetchTrips(filter) },[filter])

  const fetchTrips = async (currentFilter = filter) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('trip_requests').select('*, offers(count)').eq('user_id', user.id).eq('archived', currentFilter === 'archived').order('created_at', { ascending: false })
    setTrips(data || [])
    setLoading(false)
  }

  const deleteTrip = async (id) => {
    await supabase.from('trip_requests').update({ archived: true }).eq('id', id)
    fetchTrips(filter)
  }

  const fetchTripOffers = async (tripId) => {
    if (tripOffers[tripId]) { setExpandedId(expandedId === tripId ? null : tripId); return }
    const { data } = await supabase.from('offers').select('*, companies(company_name, city, country, bio, website, google_maps, logo_url, rating)').eq('request_id', tripId).order('price', { ascending: true })
    setTripOffers(p => ({ ...p, [tripId]: data || [] }))
    setExpandedId(tripId)
  }

  const refreshOffers = async (tripId) => {
    const { data } = await supabase.from('offers').select('*, companies(company_name, city, country, bio, website, google_maps, logo_url, rating)').eq('request_id', tripId).order('price', { ascending: true })
    setTripOffers(p => ({ ...p, [tripId]: data || [] }))
  }

  const acceptOffer = async (offerId, tripId) => {
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId)
    await supabase.from('trip_requests').update({ status: 'closed' }).eq('id', tripId)
    fetchTrips(filter)
    refreshOffers(tripId)
  }

  const rejectOffer = async (offerId, tripId) => {
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offerId)
    refreshOffers(tripId)
  }

  const requestNegotiation = async (offerId, tripId, offerPrice) => {
    await supabase.from('offers').update({ negotiation_requested: true, negotiation_count: 1, status: 'negotiating' }).eq('id', offerId)
    await supabase.from('trip_requests').update({ status: 'open', best_price: offerPrice, negotiation_done: true }).eq('id', tripId)
    await fetch('https://uwmxximdupgfhfypdzll.supabase.co/functions/v1/quick-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ to: 'fr.ahmad.zaid@gmail.com', subject: '🔄 إعادة تفاوض', body: `أفضل سعر وصل العميل: <strong>${offerPrice} ريال</strong>` })
    })
    fetchTrips(filter)
    refreshOffers(tripId)
  }

  const filtered = trips.filter(t => {
    if (filter === 'archived') return t.archived === true
    if (filter === 'all') return true
    return t.status === filter
  })

  if (loading) return <div style={{textAlign:'center',padding:40,color:C.gray}}>جاري التحميل...</div>
// صفحة تفاصيل العرض
if (selectedOffer) {
  const t = trips.find(x => x.id === selectedOffer.request_id)
  return <OfferDetailPage 
    offer={selectedOffer} 
    trip={t}
    onBack={()=>setSelectedOffer(null)}
    onAccept={(offerId, tripId)=>{ acceptOffer(offerId, tripId); setSelectedOffer(null) }}
    onNegotiate={(offerId, tripId, price)=>{ requestNegotiation(offerId, tripId, price); setSelectedOffer(null) }}
    onReject={(offerId, tripId)=>{ rejectOffer(offerId, tripId); setSelectedOffer(null) }}
  />
}
  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>طلباتي 📋</div>
      <div style={{fontSize:13,color:C.gray,marginBottom:12}}>{trips.length} طلبات</div>
      <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
        {[['all','الكل'],['open','مفتوحة'],['closed','مغلقة'],['archived','الأرشيف']].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{border:`1.5px solid ${filter===val?C.orange:C.border}`,background:filter===val?C.light:C.white,color:filter===val?C.orange:C.gray,borderRadius:20,padding:'5px 14px',fontSize:13,fontWeight:filter===val?700:500,fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap'}}>
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{textAlign:'center',padding:40,background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <div style={{fontSize:15,color:C.gray}}>لا توجد طلبات</div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map((t)=>(
          <div key={t.id} style={{background:C.white,borderRadius:16,border:`1.5px solid ${t.status==='closed'?C.green:C.border}`,overflow:'hidden'}}>
            <div style={{padding:"15px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:C.ink,marginBottom:3}}>🌍 {t.destination}</div>
                  <div style={{fontSize:12,color:C.gray}}>👥 {t.travelers} مسافرين</div>
                  <div style={{fontSize:11,color:C.gray,marginTop:2}}>📅 {new Date(t.created_at).toLocaleDateString('ar-SA')}</div>
                  {t.negotiation_done && <div style={{fontSize:11,color:'#2563EB',marginTop:3,fontWeight:600}}>🔄 تم طلب التفاوض</div>}
                  {t.best_price && <div style={{fontSize:11,color:C.amber,marginTop:2,fontWeight:600}}>💰 أفضل سعر: {t.best_price} ريال</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                  <span style={{background:t.status==='open'?C.greenBg:C.muted,color:t.status==='open'?C.green:C.gray,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                    {t.status==='open'?'مفتوح':'مغلق'}
                  </span>
                  <span style={{background:C.blueBg,color:C.blue,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                    💬 {t.offers?.[0]?.count || 0} عروض
                  </span>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8,marginTop:10}}>
                <button onClick={()=>fetchTripOffers(t.id)} style={{background:expandedId===t.id?C.muted:`linear-gradient(135deg,${C.orange},${C.dark})`,color:expandedId===t.id?C.gray:C.white,border:'none',borderRadius:10,padding:'10px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                  {expandedId===t.id?'إخفاء العروض ▲':'💬 عرض العروض ▼'}
                </button>
                <button onClick={()=>deleteTrip(t.id)} style={{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA',borderRadius:10,padding:'10px',fontFamily:'inherit',fontSize:13,cursor:'pointer',fontWeight:600}}>
                  أرشفة
                </button>
              </div>
            </div>

            {expandedId===t.id && (
              <div style={{borderTop:`1px solid ${C.border}`,padding:'14px 16px',background:'#FAFAFA'}}>
                {!tripOffers[t.id] || tripOffers[t.id].length === 0 ? (
                  <div style={{textAlign:'center',padding:'20px 0',color:C.gray,fontSize:13}}>📭 لا توجد عروض بعد — انتظر ردود الشركات</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:4}}>العروض الواردة ({tripOffers[t.id].length}):</div>
                    {tripOffers[t.id].map((o,i)=>(
                      <div key={o.id} style={{background:C.white,borderRadius:14,overflow:'hidden',border:`1.5px solid ${o.status==='accepted'?C.green:o.status==='rejected'?'#FECACA':i===0?C.orange:C.border}`}}>

                        {/* Header الشركة */}
                        <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
                          {o.companies?.logo_url ? (
                            <img src={o.companies.logo_url} style={{width:42,height:42,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}} />
                          ) : (
                            <div style={{width:42,height:42,borderRadius:10,background:`linear-gradient(135deg,${C.orange},${C.dark})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:C.white,flexShrink:0}}>🏢</div>
                          )}
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700,color:C.ink}}>{o.companies?.company_name||'شركة سياحية'}</div>
                            {o.companies?.city&&<div style={{fontSize:11,color:C.gray,marginTop:1}}>📍 {o.companies?.country||'السعودية'} — {o.companies.city}</div>}
                            {o.companies?.rating>0&&<div style={{fontSize:11,color:'#D97706',marginTop:1}}>{'⭐'.repeat(Math.round(o.companies.rating))} {o.companies.rating}</div>}
                          </div>
                          <div>
                            {o.status==='accepted'&&<span style={{background:C.greenBg,color:C.green,borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:700}}>مقبول ✓</span>}
                            {o.status==='rejected'&&<span style={{background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:700}}>مرفوض</span>}
                            {i===0&&o.status==='pending'&&<span style={{background:C.light,color:C.orange,borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:700}}>🏆 الأفضل</span>}
                          </div>
                        </div>

                        {/* النبذة والروابط */}
                        {(o.companies?.bio||o.companies?.website||o.companies?.google_maps)&&(
                          <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,background:'#FAFAFA'}}>
                            {o.companies?.bio&&<div style={{fontSize:12,color:C.gray,lineHeight:1.6,marginBottom:6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{o.companies.bio}</div>}
                            <div style={{display:'flex',gap:7}}>
                              {o.companies?.website&&<a href={o.companies.website} target="_blank" rel="noopener" style={{background:C.blueBg,color:C.blue,borderRadius:7,padding:'3px 9px',fontSize:11,fontWeight:700,textDecoration:'none'}}>🌐 الموقع</a>}
                              {o.companies?.google_maps&&<a href={o.companies.google_maps} target="_blank" rel="noopener" style={{background:C.greenBg,color:C.green,borderRadius:7,padding:'3px 9px',fontSize:11,fontWeight:700,textDecoration:'none'}}>📍 الخريطة</a>}
                            </div>
                          </div>
                        )}

                        {/* تفاصيل العرض والسعر والأزرار */}
                        <div style={{padding:'10px 14px'}}>
{/* تفاصيل العرض */}
<button onClick={()=>setSelectedOffer({...o, request_id: t.id})} style={{width:'100%',background:C.muted,color:C.ink,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px',fontFamily:'inherit',fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:8}}>
  🔍 عرض التفاصيل الكاملة
</button>

{o.description && <div style={{fontSize:12,color:C.gray,background:C.muted,borderRadius:8,padding:'6px 10px',marginBottom:10}}>{o.description}</div>}                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.light,borderRadius:10,padding:'10px 13px',marginBottom:10}}>
                            <div style={{fontSize:13,fontWeight:600,color:C.gray}}>السعر الإجمالي</div>
                            <div style={{fontSize:20,fontWeight:800,color:C.orange}}>{o.price} <span style={{fontSize:11,fontWeight:400,color:C.gray}}>ريال</span></div>
                          </div>
                          {o.status==='pending'&&(
                            <div style={{display:'flex',flexDirection:'column',gap:8}}>
                              <button onClick={()=>acceptOffer(o.id,t.id)} style={{width:'100%',background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:'none',borderRadius:9,padding:'10px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                                ✅ قبول العرض
                              </button>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                                {!t.negotiation_done ? (
                                  <button onClick={()=>requestNegotiation(o.id,t.id,o.price)} style={{background:'#EFF6FF',color:'#2563EB',border:'1px solid #BFDBFE',borderRadius:9,padding:'9px',fontFamily:'inherit',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                                    🤝 تفاوض
                                  </button>
                                ) : (
                                  <button disabled style={{background:C.muted,color:C.gray,border:`1px solid ${C.border}`,borderRadius:9,padding:'9px',fontFamily:'inherit',fontSize:12,cursor:'not-allowed'}}>
                                    🚫 تم التفاوض
                                  </button>
                                )}
                                <button onClick={()=>rejectOffer(o.id,t.id)} style={{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA',borderRadius:9,padding:'9px',fontFamily:'inherit',fontSize:12,cursor:'pointer',fontWeight:600}}>
                                  ❌ رفض
                                </button>
                              </div>
                            </div>
                          )}
                          {o.status==='negotiating'&&(
                            <div style={{background:'#EFF6FF',borderRadius:9,padding:'10px',textAlign:'center',fontSize:12,color:'#2563EB',fontWeight:600}}>
                              ⏸️ العرض الأول — تم طلب التفاوض
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PROFILE ───────────────────────────────────────────────────────
const Profile = ()=>{
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  useEffect(()=>{
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user); setName(user?.user_metadata?.full_name || ''); setAvatarUrl(user?.user_metadata?.avatar_url || null); setLoading(false)
    })
  },[])

  const handleLogout = async () => { await supabase.auth.signOut() }
  const handleSave = async () => { setSaving(true); await supabase.auth.updateUser({ data: { full_name: name } }); setSaving(false); setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 3000) }
  const handleAvatar = async (e) => {
    const file = e.target.files[0]; if (!file) return; setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop(); const fileName = `${user.id}.${fileExt}`
    await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
    setAvatarUrl(data.publicUrl + '?t=' + Date.now()); setUploadingAvatar(false)
  }
  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) return; setSaving(true)
    await supabase.auth.updateUser({ password: newPassword }); setSaving(false); setPasswordSaved(true); setChangingPassword(false); setNewPassword('')
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  if (loading) return <div style={{textAlign:'center',padding:40,color:C.gray}}>جاري التحميل...</div>

  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{textAlign:"center",padding:"20px 0 24px"}}>
        <div style={{position:'relative',width:80,height:80,margin:'0 auto 12px'}}>
          {avatarUrl ? <img src={avatarUrl} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover'}} /> : (
            <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${C.orange},${C.dark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:C.white,fontWeight:800}}>
              {name?.charAt(0) || user?.email?.charAt(0) || "م"}
            </div>
          )}
          <label style={{position:'absolute',bottom:0,left:0,width:26,height:26,borderRadius:'50%',background:C.orange,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13}}>
            {uploadingAvatar ? '⏳' : '📷'}
            <input type="file" accept="image/*" onChange={handleAvatar} style={{display:'none'}} />
          </label>
        </div>
        {editing ? (
          <input value={name} onChange={e=>setName(e.target.value)} style={{textAlign:'center',fontSize:18,fontWeight:800,border:`1.5px solid ${C.orange}`,borderRadius:10,padding:'8px 14px',fontFamily:'inherit',outline:'none',direction:'rtl',width:'100%',marginBottom:8}} />
        ) : (
          <div style={{fontSize:20,fontWeight:800,color:C.ink}}>{name || "مستخدم بكجات"}</div>
        )}
        <div style={{fontSize:14,color:C.gray,marginTop:2}}>{user?.email}</div>
        {!editing ? (
          <button onClick={()=>setEditing(true)} style={{marginTop:10,background:C.light,color:C.orange,border:`1px solid ${C.orange}33`,borderRadius:20,padding:'6px 18px',fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'}}>✏️ تعديل الاسم</button>
        ) : (
          <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:10}}>
            <button onClick={handleSave} disabled={saving} style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:'none',borderRadius:10,padding:'8px 20px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer'}}>{saving?'جاري الحفظ...':'حفظ'}</button>
            <button onClick={()=>setEditing(false)} style={{background:C.muted,color:C.gray,border:'none',borderRadius:10,padding:'8px 16px',fontFamily:'inherit',fontSize:13,cursor:'pointer'}}>إلغاء</button>
          </div>
        )}
        {saved && <div style={{color:C.green,fontSize:13,marginTop:8,fontWeight:600}}>✅ تم حفظ الاسم!</div>}
        {passwordSaved && <div style={{color:C.green,fontSize:13,marginTop:8,fontWeight:600}}>✅ تم تغيير كلمة السر!</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:13}}>
              <span style={{fontSize:20}}>🔒</span>
              <div><div style={{fontSize:14,fontWeight:600,color:C.ink}}>كلمة السر</div><div style={{fontSize:12,color:C.gray}}>تغيير كلمة السر الحالية</div></div>
            </div>
            <button onClick={()=>setChangingPassword(!changingPassword)} style={{background:C.light,color:C.orange,border:'none',borderRadius:8,padding:'5px 12px',fontFamily:'inherit',fontSize:12,fontWeight:700,cursor:'pointer'}}>{changingPassword?'إلغاء':'تغيير'}</button>
          </div>
          {changingPassword && (
            <div style={{marginTop:12}}>
              <input type="password" placeholder="كلمة السر الجديدة (٦ أحرف على الأقل)" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'10px 13px',fontFamily:'inherit',fontSize:13,outline:'none',boxSizing:'border-box',direction:'rtl',marginBottom:8}}
                onFocus={e=>e.target.style.borderColor=C.orange} onBlur={e=>e.target.style.borderColor=C.border}
              />
              <button onClick={handlePasswordChange} disabled={saving} style={{width:'100%',background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:'none',borderRadius:10,padding:'10px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                {saving?'جاري الحفظ...':'حفظ كلمة السر'}
              </button>
            </div>
          )}
        </div>
        <a href="https://wa.me/00966592244551" target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:13,background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`,textDecoration:'none'}}>
          <span style={{fontSize:20}}>📞</span>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.ink}}>تواصل معنا</div><div style={{fontSize:12,color:C.gray}}>واتساب — الدعم ٢٤/٧</div></div>
          <span style={{color:C.green,fontSize:13,fontWeight:700}}>واتساب ↗</span>
        </a>
        <div style={{display:"flex",alignItems:"center",gap:13,background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <span style={{fontSize:20}}>✉️</span>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.ink}}>البريد الإلكتروني</div><div style={{fontSize:12,color:C.gray}}>{user?.email}</div></div>
        </div>
        <div onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:13,background:"#FEF2F2",borderRadius:13,padding:"14px 16px",border:"1px solid #FECACA",cursor:"pointer",marginTop:8}}>
          <span style={{fontSize:20}}>🚪</span>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#DC2626"}}>تسجيل الخروج</div></div>
        </div>
      </div>
    </div>
  )
}

// ── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session) })
    return () => subscription.unsubscribe()
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontFamily:'Tajawal,sans-serif'}}>جاري التحميل...</div>
  if (!session) return <Login />
  if (session?.user?.user_metadata?.role === 'company') return <CompanyDashboard />
  if (session?.user?.user_metadata?.role === 'admin') return <AdminDashboard />

  const tabs = [
    {id:"home",label:"الرئيسية",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
    {id:"trips",label:"طلباتي",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:"bookings",label:"رحلاتي",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
    {id:"request",label:"طلب رحلة",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>},
    {id:"profile",label:"حسابي",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}html,body{height:100%;background:#F3F4F6;font-family:'Tajawal',sans-serif;}input,textarea,button{font-family:'Tajawal',sans-serif;}@media(min-width:500px){#app{max-width:430px;margin:0 auto;box-shadow:0 0 40px rgba(0,0,0,0.12);}}`}</style>
      <div id="app" style={{direction:"rtl",background:"#F3F4F6",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{position:"sticky",top:0,zIndex:50,background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,borderRadius:11,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:17}}>ب</div>
            <div><div style={{fontSize:15,fontWeight:900,color:C.ink}}>بكجات</div><div style={{fontSize:10,color:C.gray}}>pakajat.com</div></div>
          </div>
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:20}}>🔔</button>
        </div>
        <div style={{flex:1,overflowY:"auto",paddingBottom:70,background:"#F3F4F6"}}>
          {page==="home"&&<Home setPage={setPage}/>}
          {page==="request"&&<Request setPage={setPage}/>}
          {page==="trips"&&<Trips/>}
          {page==="bookings"&&<Bookings/>}
          {page==="profile"&&<Profile/>}
        </div>
        <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:50,background:"#fff",borderTop:`1px solid ${C.border}`,boxShadow:"0 -4px 20px rgba(0,0,0,0.07)"}}>
          <div style={{maxWidth:430,margin:"0 auto",display:"flex",padding:"6px 0 8px"}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setPage(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:"inherit",position:"relative"}}>
                {t.id==="request"?(
                  <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${C.orange},${C.dark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginTop:-20,boxShadow:"0 4px 14px rgba(242,101,34,0.4)"}}>✈️</div>
                ):(
                  <div style={{opacity:page===t.id?1:0.45,color:page===t.id?C.orange:C.gray,transition:"all .2s"}}>{t.icon}</div>
                )}
                <span style={{fontSize:10,fontWeight:page===t.id?700:400,color:page===t.id?C.orange:C.gray}}>{t.label}</span>
                {page===t.id&&t.id!=="request"&&<div style={{position:"absolute",top:0,width:24,height:3,borderRadius:"0 0 3px 3px",background:C.orange}}/>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}