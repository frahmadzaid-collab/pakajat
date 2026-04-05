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

async function callClaude(system, user, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000, stream: true,
      system, messages: [{ role: "user", content: user }],
    }),
  });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n").filter(l => l.startsWith("data:"))) {
      try {
        const d = JSON.parse(line.slice(5));
        if (d.type === "content_block_delta" && d.delta?.text) { full += d.delta.text; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

const detectLang = (text) => {
  const m = {"إسطنبول":["التركية","Turkish"],"تركيا":["التركية","Turkish"],"باريس":["الفرنسية","French"],"فرنسا":["الفرنسية","French"],"ماليزيا":["الملايو","Malay"],"طوكيو":["اليابانية","Japanese"],"اليابان":["اليابانية","Japanese"],"بانكوك":["التايلاندية","Thai"],"روما":["الإيطالية","Italian"],"إيطاليا":["الإيطالية","Italian"],"لندن":["الإنجليزية","English"],"أوروبا":["الإنجليزية","English"],"دبي":["الإنجليزية","English"]};
  for (const [k,v] of Object.entries(m)) if (text.includes(k)) return v;
  return ["الإنجليزية","English"];
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

const Field = ({placeholder,value,onChange,type="text",icon}) => (
  <div style={{position:"relative"}}>
    {icon&&<span style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none"}}>{icon}</span>}
    <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:10,padding:icon?"11px 38px 11px 12px":"11px 14px",fontFamily:"inherit",fontSize:14,color:C.ink,outline:"none",boxSizing:"border-box",direction:"rtl",background:C.white,transition:"border .15s"}}
      onFocus={e=>e.target.style.borderColor=C.orange} onBlur={e=>e.target.style.borderColor=C.border}
    />
  </div>
);

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

        {/* طلباتي الأخيرة */}
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

        {/* العروض الواردة */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:16,fontWeight:800,color:C.ink}}>العروض الواردة 🔥</div>
          <button onClick={()=>setPage("offers")} style={{background:"none",border:"none",color:C.orange,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>عرض الكل</button>
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
            <div key={o.id} style={{background:C.white,borderRadius:16,padding:"15px 16px",border:`1.5px solid ${i===0?C.orange:C.border}`,boxShadow:i===0?`0 0 0 3px ${C.orange}12`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <span style={{fontSize:15,fontWeight:700,color:C.ink}}>🏢 شركة سياحية</span>
                    {o.status==='accepted'&&<span style={{background:C.greenBg,color:C.green,borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>مقبول ✓</span>}
                    {i===0&&o.status==='pending'&&<span style={{background:C.light,color:C.orange,borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>جديد 🔥</span>}
                  </div>
                  <div style={{fontSize:13,color:C.gray}}>🌍 {o.trip_requests?.destination}</div>
                  <div style={{fontSize:11,color:C.gray}}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:22,fontWeight:900,color:C.orange}}>{o.price}</div>
                  <div style={{fontSize:11,color:C.gray}}>ريال</div>
                </div>
              </div>
              {o.description&&<div style={{fontSize:12,color:C.gray,background:C.muted,borderRadius:8,padding:"6px 10px",marginBottom:10}}>{o.description}</div>}
              {o.status==='pending'&&(
                <button onClick={()=>setPage("offers")} style={{width:"100%",background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"10px",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
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
// ══════════════════════════════════════════════════════════════════
// REQUEST PAGE — نسخة محسّنة كاملة
// ══════════════════════════════════════════════════════════════════

const Request = ({setPage})=>{
  const [step, setStep] = useState(1)

  // الخطوة ١ — المسافرون والفترة
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // الخطوة ٢ — مسار الرحلة
  const [cities, setCities] = useState([{ city: '', from: '', to: '' }])

  // الخطوة ٣ — الخدمات
  const [svcs, setSvcs] = useState({
    flight: false, visa: false,
    arrival: false, arrVip: false,
    departure: false, depVip: false,
    car: false, carDays: 'طوال الرحلة', carCustomDays: '',
    hotel: false,
    sim: false, simQty: 2,
    tickets: false,
    program: false,
  })

  // طيران
  const [flights, setFlights] = useState([{ from: '', to: '', date: '' }])

  // فنادق (تلقائي حسب المدن)
  const [hotels, setHotels] = useState([])

  // تذاكر
  const [selectedAttractions, setSelectedAttractions] = useState([])

  // الخطوة ٤ — ملاحظات + إرسال
  const [notes, setNotes] = useState('')
  const [offerDuration, setOfferDuration] = useState(24)
  const [aiState, setAiState] = useState('idle')
  const [done, setDone] = useState(false)

  const s = (k, v) => setSvcs(p => ({ ...p, [k]: v }))

  const totalTravelers = adults + children
  const activeCnt = ['flight','visa','arrival','departure','car','hotel','sim','tickets','program'].filter(k => svcs[k]).length

  // أماكن سياحية حسب المدينة
  const attrMap = {
    'باريس': [{ name: 'برج إيفل', price: 28 }, { name: 'متحف اللوفر', price: 22 }, { name: 'قوس النصر', price: 0 }, { name: 'قصر فيرساي', price: 20 }],
    'إسطنبول': [{ name: 'آيا صوفيا', price: 25 }, { name: 'القصر العثماني', price: 30 }, { name: 'البازار الكبير', price: 0 }, { name: 'برج غلطة', price: 12 }],
    'ماليزيا': [{ name: 'برجا بتروناس', price: 80 }, { name: 'جزيرة لنكاوي', price: 50 }, { name: 'كاميرون هايلاند', price: 30 }],
    'دبي': [{ name: 'برج خليفة', price: 149 }, { name: 'دبي مول', price: 0 }, { name: 'نخلة جميرا', price: 50 }, { name: 'صحراء دبي', price: 200 }],
    'جنيف': [{ name: 'بحيرة جنيف', price: 0 }, { name: 'نافورة جنيف', price: 0 }, { name: 'متحف الصليب الأحمر', price: 15 }],
    'لندن': [{ name: 'برج لندن', price: 34 }, { name: 'متحف بريطاني', price: 0 }, { name: 'قصر باكنهام', price: 30 }, { name: 'عين لندن', price: 32 }],
    'روما': [{ name: 'الكولوسيوم', price: 16 }, { name: 'نافورة تريفي', price: 0 }, { name: 'الفاتيكان', price: 20 }],
  }

  // أسعار الاستقبال/التوديع التقريبية حسب المدينة
  const transferPrices = {
    'باريس': { normal: 120, vip: 250 },
    'إسطنبول': { normal: 80, vip: 180 },
    'دبي': { normal: 150, vip: 350 },
    'ماليزيا': { normal: 60, vip: 150 },
    'لندن': { normal: 130, vip: 280 },
    'جنيف': { normal: 140, vip: 300 },
    'روما': { normal: 100, vip: 220 },
  }

  const firstCity = cities[0]?.city || ''
  const transferPrice = transferPrices[firstCity] || { normal: 100, vip: 250 }

  // عند تغيير المدن — تحديث الفنادق تلقائياً
  const updateCities = (newCities) => {
    setCities(newCities)
    const newHotels = newCities.filter(c => c.city).map(c => ({
      city: c.city, stars: 4, name: '', breakfast: false
    }))
    setHotels(newHotels)
  }

  const allCityAttractions = cities.filter(c => c.city && attrMap[c.city]).flatMap(c =>
    (attrMap[c.city] || []).map(a => ({ ...a, city: c.city }))
  )

  const ticketTotal = selectedAttractions.reduce((sum, key) => {
    const [city, name] = key.split('||')
    const cityAttrs = attrMap[city] || []
    const attr = cityAttrs.find(a => a.name === name)
    return sum + (attr ? attr.price * adults + (attr.price * 0.5 * children) : 0)
  }, 0)

  const buildSummary = () => {
    const p = []
    p.push(`المسافرون: ${adults} بالغ${children > 0 ? ` + ${children} أطفال` : ''}`)
    p.push(`فترة الرحلة: ${dateFrom} → ${dateTo}`)
    if (cities.filter(c => c.city).length > 0) p.push(`مسار الرحلة: ${cities.filter(c => c.city).map(c => `${c.city} (${c.from}→${c.to})`).join(' ← ')}`)
    if (svcs.flight) p.push(`طيران: ${flights.map(f => `${f.from}→${f.to} (${f.date})`).join(' | ')}`)
    if (svcs.visa) p.push(`تأشيرة سياحية: ٨٥٠ ريال شاملة (حجز موعد + تأمين + ترجمة)`)
    if (svcs.arrival) p.push(`استقبال مطار${svcs.arrVip ? ' VIP' : ''}: ~${svcs.arrVip ? '' : ''} ريال`)
    if (svcs.departure) p.push(`توديع مطار${svcs.depVip ? ' VIP' : ''}: ~${svcs.depVip ? '' : ''} ريال`)
    if (svcs.car) p.push(`سيارة بسائق: ${svcs.carDays === 'عدد أيام' ? `${svcs.carCustomDays} أيام` : svcs.carDays}`)
    if (svcs.hotel) p.push(`فنادق: ${hotels.map(h => `${h.city} ${h.stars}★${h.name ? ` (${h.name})` : ''}${h.breakfast ? ' + إفطار' : ''}`).join(' | ')}`)
    if (svcs.sim) p.push(`شرائح جوال: ${svcs.simQty} شرائح (20 قيقا)`)
    if (svcs.tickets && selectedAttractions.length > 0) p.push(`تذاكر سياحية: ${selectedAttractions.map(k => k.split('||')[1]).join('، ')} (إجمالي تقريبي: ${ticketTotal.toFixed(0)} دولار)`)
    if (svcs.program) p.push('تصميم برنامج سياحي يومي بالذكاء الاصطناعي')
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
        notes: notes,
        ai_translation: buildSummary(),
        status: 'open',
offer_duration: offerDuration,
expires_at: new Date(Date.now() + offerDuration * 60 * 60 * 1000).toISOString(),
best_price: null,
negotiation_done: false,
      })

      // إرسال إيميل
      await fetch('https://uwmxximdupgfhfypdzll.supabase.co/functions/v1/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          to: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'fr.ahmad.zaid@gmail.com' : 'admin@pakajat.com',
          subject: `🌍 طلب رحلة جديد — ${cities.filter(c=>c.city).map(c=>c.city).join(', ')}`,
          body: `وصل طلب رحلة جديد!<br/><br/>${buildSummary().replace(/\n/g,'<br/>')}`
        })
      })

      setAiState('done')
      setDone(true)
    } catch { setAiState('error') }
  }

  const Progress = () => (
    <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
      {['المسافرون','المسار','الخدمات','الإرسال'].map((label, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', height: 5, borderRadius: 3, background: step > i ? C.orange : step === i+1 ? C.orange : C.border, transition: 'background .3s' }} />
          <div style={{ fontSize: 9, color: step === i+1 ? C.orange : C.gray, fontWeight: step === i+1 ? 700 : 400 }}>{label}</div>
        </div>
      ))}
    </div>
  )

  const inputStyle = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box', direction: 'rtl', background: C.white, transition: 'border .15s' }

  // ── STEP 1: المسافرون والفترة ──
  if (step === 1) return (
    <div>
      <Progress />
      <div style={{ padding: '16px 20px 24px' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 4 }}>المسافرون والفترة 🗓️</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>حدد عدد المسافرين وتاريخ الرحلة</div>

        {/* البالغون */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>👨‍👩‍👧 البالغون</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>١٢ سنة فأكثر</div>
            </div>
            <Stepper value={adults} onChange={setAdults} min={1} max={30} />
          </div>
        </div>

        {/* الأطفال */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>👶 الأطفال</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>أقل من ١٢ سنة</div>
            </div>
            <Stepper value={children} onChange={setChildren} min={0} max={20} />
          </div>
        </div>

        {/* فترة الرحلة */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>📅 فترة الرحلة</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>تاريخ المغادرة</Label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} />
            </div>
            <div>
              <Label>تاريخ العودة</Label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} />
            </div>
          </div>
          {dateFrom && dateTo && (
            <div style={{ marginTop: 10, background: C.light, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
              ⏱ مدة الرحلة: {Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000*60*60*24))} يوم
            </div>
          )}
        </div>

        <button onClick={() => setStep(2)} disabled={!dateFrom || !dateTo} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: (dateFrom && dateTo) ? 'pointer' : 'not-allowed', background: (dateFrom && dateTo) ? `linear-gradient(135deg,${C.orange},${C.dark})` : C.border, color: (dateFrom && dateTo) ? C.white : C.gray, boxShadow: (dateFrom && dateTo) ? '0 6px 20px rgba(242,101,34,0.35)' : 'none' }}>
          حدد مسار الرحلة ←
        </button>
      </div>
    </div>
  )

  // ── STEP 2: مسار الرحلة ──
  if (step === 2) return (
    <div>
      <Progress />
      <div style={{ padding: '16px 20px 24px' }}>
        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.orange, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>← رجوع</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 4 }}>مسار الرحلة 🗺️</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>أضف المدن التي ستزورها وفترة الإقامة في كل مدينة</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {cities.map((c, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 14, padding: '16px', border: `1.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>🏙️ المدينة {i + 1}</div>
                {i > 0 && (
                  <button onClick={() => { const n = cities.filter((_, j) => j !== i); updateCities(n) }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>✕ حذف</button>
                )}
              </div>
              <Label>اسم المدينة</Label>
              <input
                placeholder="مثال: باريس، إسطنبول، دبي..."
                value={c.city}
                onChange={e => {
                  const n = cities.map((x, j) => j === i ? { ...x, city: e.target.value } : x)
                  updateCities(n)
                }}
                style={{ ...inputStyle, marginBottom: 10 }}
                onFocus={e => e.target.style.borderColor = C.orange}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <Label>تاريخ الوصول</Label>
                  <input type="date" value={c.from} onChange={e => { const n = cities.map((x, j) => j === i ? { ...x, from: e.target.value } : x); setCities(n) }} style={inputStyle} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div>
                  <Label>تاريخ المغادرة</Label>
                  <input type="date" value={c.to} onChange={e => { const n = cities.map((x, j) => j === i ? { ...x, to: e.target.value } : x); setCities(n) }} style={inputStyle} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              </div>
              {c.city && c.from && c.to && (
                <div style={{ marginTop: 8, background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: C.orange, fontWeight: 600 }}>
                  ⏱ {Math.ceil((new Date(c.to) - new Date(c.from)) / (1000*60*60*24))} ليلة في {c.city}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => updateCities([...cities, { city: '', from: '', to: '' }])} style={{ width: '100%', border: `1.5px dashed ${C.orange}`, background: C.light, borderRadius: 12, padding: '11px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: C.orange, cursor: 'pointer', marginBottom: 20 }}>
          + إضافة مدينة أخرى
        </button>

        <button onClick={() => setStep(3)} disabled={!cities.some(c => c.city)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: cities.some(c => c.city) ? 'pointer' : 'not-allowed', background: cities.some(c => c.city) ? `linear-gradient(135deg,${C.orange},${C.dark})` : C.border, color: cities.some(c => c.city) ? C.white : C.gray, boxShadow: cities.some(c => c.city) ? '0 6px 20px rgba(242,101,34,0.35)' : 'none' }}>
          اختر الخدمات ←
        </button>
      </div>
    </div>
  )

  // ── STEP 3: الخدمات ──
  if (step === 3) return (
    <div>
      <Progress />
      <div>
        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.orange, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>← رجوع</button>
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 2 }}>الخدمات المطلوبة 🛎️</div>
          <div style={{ fontSize: 13, color: C.gray }}>
            {cities.filter(c=>c.city).map(c=>c.city).join(' ← ')} · {totalTravelers} مسافر
            {activeCnt > 0 && <span style={{ color: C.orange, fontWeight: 700 }}> · {activeCnt} خدمات</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 20px 24px' }}>

          {/* ١ - طيران */}
          <SvcCard icon="✈️" title="طيران دولي" sub="حجز تذاكر الرحلة" active={svcs.flight} onToggle={() => s('flight', !svcs.flight)} color={C.blue} bg={C.blueBg}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {flights.map((f, i) => (
                <div key={i} style={{ background: '#FAFAFA', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>رحلة {i === 0 ? 'الذهاب' : i === flights.length - 1 ? 'العودة' : `${i + 1}`}</div>
                    {i > 0 && <button onClick={() => setFlights(fs => fs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div><Label>من</Label><input placeholder="الرياض" value={f.from} onChange={e => setFlights(fs => fs.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} style={{ ...inputStyle, fontSize: 12 }} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} /></div>
                    <div><Label>إلى</Label><input placeholder="باريس" value={f.to} onChange={e => setFlights(fs => fs.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} style={{ ...inputStyle, fontSize: 12 }} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} /></div>
                  </div>
                  <Label>تاريخ الرحلة</Label>
                  <input type="date" value={f.date} onChange={e => setFlights(fs => fs.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} style={inputStyle} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              ))}
              <button onClick={() => setFlights(fs => [...fs, { from: '', to: '', date: '' }])} style={{ border: `1.5px dashed ${C.blue}`, background: C.blueBg, borderRadius: 10, padding: '9px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: C.blue, cursor: 'pointer' }}>
                + إضافة رحلة (وجهة إضافية أو توقف)
              </button>
            </div>
          </SvcCard>

          {/* ٢ - تأشيرة */}
          <SvcCard icon="📄" title="تأشيرة سياحية" sub="متطلبات ووثائق التأشيرة" active={svcs.visa} onToggle={() => s('visa', !svcs.visa)} color={C.purple} bg={C.purpleBg}>
            <div style={{ background: C.purpleBg, borderRadius: 10, padding: '12px', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 4 }}></div>
              <div style={{ fontSize: 12, color: C.gray }}>✓ حجز موعد القنصلية · ✓ تأمين سفر · ✓ ترجمة الوثائق</div>
            </div>
            <div style={{ background: C.white, borderRadius: 10, padding: '12px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>متطلبات التأشيرة</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>الوثائق المطلوبة للسفارة</div>
              </div>
              <a href="https://www.mofa.gov.sa" target="_blank" rel="noopener" style={{ background: C.purple, color: C.white, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>الرابط ↗</a>
            </div>
          </SvcCard>

          {/* ٣ - استقبال */}
          <SvcCard icon="🚖" title="استقبال في المطار" sub="خدمة استقبال عند الوصول" active={svcs.arrival} onToggle={() => s('arrival', !svcs.arrival)} color={C.red} bg={C.redBg}>
            <div style={{ background: svcs.arrVip ? C.redBg : C.muted, border: `1.5px solid ${svcs.arrVip ? C.red : C.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <Toggle value={svcs.arrVip} onChange={v => s('arrVip', v)} label="⭐ ترقية VIP" sub={`لوحة استقبال مخصصة · عربة كبار الشخصيات · VIP`} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: C.gray }}>📍 الاستقبال في مدينة {firstCity || 'الوجهة'}</div>
          </SvcCard>

          {/* ٤ - توديع */}
          <SvcCard icon="🛫" title="توديع إلى المطار" sub="خدمة توديع عند المغادرة" active={svcs.departure} onToggle={() => s('departure', !svcs.departure)} color={C.red} bg={C.redBg}>
            <div style={{ background: svcs.depVip ? C.redBg : C.muted, border: `1.5px solid ${svcs.depVip ? C.red : C.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <Toggle value={svcs.depVip} onChange={v => s('depVip', v)} label="⭐ ترقية VIP" sub={`مرافق شخصي · خدمة الأمتعة · VIP`} />
            </div>
          </SvcCard>

          {/* ٥ - سيارة */}
          <SvcCard icon="🚗" title="سيارة بسائق" sub="نقل خاص داخل الوجهة" active={svcs.car} onToggle={() => s('car', !svcs.car)} color={C.green} bg={C.greenBg}>
            <Label>الفترة المطلوبة</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: svcs.carDays === 'عدد أيام' ? 10 : 0 }}>
              {['طوال الرحلة', 'يوم كامل', 'نصف يوم', 'عدد أيام'].map(p => (
                <Chip key={p} label={p} active={svcs.carDays === p} onClick={() => s('carDays', p)} color={C.green} bg={C.greenBg} />
              ))}
            </div>
            {svcs.carDays === 'عدد أيام' && (
              <div style={{ marginTop: 8 }}>
                <Label>عدد الأيام</Label>
                <input type="number" placeholder="مثال: 3" value={svcs.carCustomDays} onChange={e => s('carCustomDays', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            )}
          </SvcCard>

          {/* ٦ - فنادق */}
          <SvcCard icon="🏨" title="فنادق" sub="فنادق تلقائية حسب مسار رحلتك" active={svcs.hotel} onToggle={() => s('hotel', !svcs.hotel)}>
            {hotels.length === 0 ? (
              <div style={{ fontSize: 13, color: C.gray, textAlign: 'center', padding: '10px 0' }}>
                ⚠️ حدد مسار رحلتك أولاً لإضافة الفنادق تلقائياً
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hotels.map((h, i) => (
                  <div key={i} style={{ background: '#FAFAFA', borderRadius: 12, padding: 13 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>🏨 فندق {h.city}</div>
                    <Label>تصنيف النجوم</Label>
                    <Stars value={h.stars} onChange={v => setHotels(hs => hs.map((x, j) => j === i ? { ...x, stars: v } : x))} />
                    <div style={{ height: 8 }} />
                    <Label>اسم فندق مقترح (اختياري)</Label>
                    <input placeholder="Hilton، Marriott، Sheraton..." value={h.name} onChange={e => setHotels(hs => hs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} style={inputStyle} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border} />
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

          {/* ٧ - شرائح */}
          <SvcCard icon="📱" title="شرائح جوال" sub="20 قيقا — إنترنت دولي" active={svcs.sim} onToggle={() => s('sim', !svcs.sim)} color={C.green} bg={C.greenBg}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>عدد الشرائح</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>20 قيقا لكل شريحة</div>
              </div>
              <Stepper value={svcs.simQty} onChange={v => s('simQty', v)} min={1} max={10} />
            </div>
          </SvcCard>

          {/* ٨ - تذاكر */}
          <SvcCard icon="🎟️" title="تذاكر سياحية" sub="حجز المعالم حسب مسار رحلتك" active={svcs.tickets} onToggle={() => s('tickets', !svcs.tickets)} color={C.amber} bg={C.amberBg}>
            {allCityAttractions.length === 0 ? (
              <div style={{ fontSize: 13, color: C.gray, textAlign: 'center', padding: '10px 0' }}>⚠️ حدد المدن في مسار رحلتك أولاً</div>
            ) : (
              <div>
                {cities.filter(c => c.city && attrMap[c.city]).map(c => (
                  <div key={c.city} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>📍 {c.city}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {(attrMap[c.city] || []).map(a => {
                        const key = `${c.city}||${a.name}`
                        const isSelected = selectedAttractions.includes(key)
                        return (
                          <button key={key} onClick={() => setSelectedAttractions(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])} style={{ border: `1.5px solid ${isSelected ? C.amber : C.border}`, background: isSelected ? C.amberBg : C.white, color: isSelected ? C.amber : C.gray, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: isSelected ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                            {a.name} {a.price > 0 ? `✓` : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {ticketTotal > 0 && (
                  <div style={{ background: C.amberBg, borderRadius: 10, padding: '8px 12px', fontSize: 12, color: C.amber, fontWeight: 700, marginTop: 4 }}>
                    ✓ المعالم المختارة: {ticketTotal.toFixed(0)}$ ({adults} بالغ{children > 0 ? ` + ${children} أطفال` : ''})
                  </div>
                )}
              </div>
            )}
          </SvcCard>

          {/* ٩ - برنامج */}
          <SvcCard icon="📋" title="تصميم البرنامج السياحي اليومي" sub="يُصمم تلقائياً بالذكاء الاصطناعي" active={svcs.program} onToggle={() => s('program', !svcs.program)}>
            {svcs.program && (
              <div style={{ background: C.light, borderRadius: 10, padding: '11px 13px', fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
                🤖 سيُصمم الذكاء الاصطناعي برنامجاً يومياً مفصلاً يشمل أوقات الزيارات والمطاعم والتنقلات لكل مدينة
              </div>
            )}
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

  // ── STEP 4: الإرسال ──
  return (
    <div>
      <Progress />
      <div>
        <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: C.orange, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>← رجوع</button>
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 2 }}>ملاحظات إضافية 💬</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>
            {cities.filter(c=>c.city).map(c=>c.city).join(' ← ')} · {totalTravelers} مسافر · {activeCnt} خدمات
          </div>

          {/* ملخص */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {svcs.flight && <Chip label="✈️ طيران" active color={C.blue} bg={C.blueBg} />}
            {svcs.visa && <Chip label="📄 تأشيرة (٨٥٠ ريال)" active color={C.purple} bg={C.purpleBg} />}
            {svcs.arrival && <Chip label={`🚖 استقبال${svcs.arrVip?' VIP':''}`} active color={C.red} bg={C.redBg} />}
            {svcs.departure && <Chip label={`🛫 توديع${svcs.depVip?' VIP':''}`} active color={C.red} bg={C.redBg} />}
            {svcs.car && <Chip label={`🚗 سيارة · ${svcs.carDays==='عدد أيام'?`${svcs.carCustomDays} أيام`:svcs.carDays}`} active color={C.green} bg={C.greenBg} />}
            {svcs.hotel && <Chip label={`🏨 ${hotels.length} فندق`} active />}
            {svcs.sim && <Chip label={`📱 ${svcs.simQty} شرائح (20 قيقا)`} active color={C.green} bg={C.greenBg} />}
            {svcs.tickets && selectedAttractions.length > 0 && <Chip label={`🎟️ ${selectedAttractions.length} معالم`} active color={C.amber} bg={C.amberBg} />}
            {svcs.program && <Chip label="📋 برنامج يومي" active />}
          </div>
<div style={{marginBottom:16}}>
  <Label>⏱ مدة استقبال العروض</Label>
  <div style={{display:'flex',gap:8}}>
    {[24,48,72].map(h=>(
      <button key={h} onClick={()=>setOfferDuration(h)} style={{flex:1,border:`1.5px solid ${offerDuration===h?C.orange:C.border}`,background:offerDuration===h?C.light:C.white,color:offerDuration===h?C.orange:C.gray,borderRadius:12,padding:'10px 8px',fontFamily:'inherit',fontWeight:offerDuration===h?700:500,fontSize:13,cursor:'pointer',transition:'all .15s'}}>
        {h} ساعة
      </button>
    ))}
  </div>
  <div style={{fontSize:11,color:C.gray,marginTop:6}}>
    تنتهي: {dateFrom ? new Date(new Date(dateFrom).getTime() + offerDuration*60*60*1000).toLocaleDateString('ar-SA') : 'بعد إرسال الطلب'}
  </div>
</div>
          <Label>ملاحظات خاصة (اختياري)</Label>
          <textarea
            placeholder="مثال: وجبات حلال فقط، غرفة ذوي احتياجات خاصة، معنا طفل رضيع..."
            value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: C.ink, outline: 'none', resize: 'none', direction: 'rtl', boxSizing: 'border-box', transition: 'border .15s' }}
            onFocus={e => e.target.style.borderColor = C.orange}
            onBlur={e => e.target.style.borderColor = C.border}
          />

          <div style={{ height: 16 }} />

          <div style={{ background: C.light, border: `1px solid ${C.orange}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 8 }}>🤖 ماذا سيحدث بعد الإرسال؟</div>
            {['سيتم حفظ طلبك في المنصة', 'الشركات السياحية ستستقبل طلبك وترسل عروضاً', 'ستصلك العروض في صفحة العروض خلال ٢٤ ساعة'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
                <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: C.ink }}>{t}</span>
              </div>
            ))}
          </div>

          {!done ? (
            <button onClick={handleSend} disabled={aiState === 'loading'} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: aiState === 'loading' ? 'not-allowed' : 'pointer', background: aiState === 'loading' ? C.gray : `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, boxShadow: '0 6px 20px rgba(242,101,34,0.35)' }}>
              {aiState === 'loading' ? '⏳ جاري الإرسال...' : '🚀 إرسال الطلب للشركات'}
            </button>
          ) : (
            <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}`, borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginBottom: 4 }}>تم إرسال طلبك!</div>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 14 }}>ستصلك العروض خلال ٢٤ ساعة</div>
              <button onClick={() => setPage('offers')} style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                متابعة العروض ←
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// ── OFFERS ────────────────────────────────────────────────────────
const Offers = ()=>{
  const [offers, setOffers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(()=>{ fetchOffers(); },[]);

  const fetchOffers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: requests } = await supabase
      .from('trip_requests').select('id').eq('user_id', user.id)
    if (!requests || requests.length === 0) { setLoading(false); return; }
    const requestIds = requests.map(r => r.id)
    const { data } = await supabase
      .from('offers')
      .select('*, trip_requests(destination, travelers)')
      .in('request_id', requestIds)
      .order('created_at', { ascending: false })
    setOffers(data || []);
    setLoading(false);
  }

  const acceptOffer = async (offerId) => {
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId)
    fetchOffers();
  }

  const rejectOffer = async (offerId) => {
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offerId)
    fetchOffers();
  }

  const filtered = offers.filter(o => {
    if (filter === 'all') return true
    if (filter === 'pending') return o.status === 'pending'
    if (filter === 'accepted') return o.status === 'accepted'
    if (filter === 'rejected') return o.status === 'rejected'
    return true
  })

  const lowestPrice = offers.length > 0 ? Math.min(...offers.map(o => o.price)) : null

  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>العروض الواردة 💬</div>
      <div style={{fontSize:13,color:C.gray,marginBottom:14}}>{offers.length} عروض على طلباتك</div>

      {/* فلتر */}
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:14}}>
        {[['all','الكل'],['pending','معلقة'],['accepted','مقبولة'],['rejected','مرفوضة']].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{
            border:`1.5px solid ${filter===val?C.orange:C.border}`,
            background:filter===val?C.light:C.white,
            color:filter===val?C.orange:C.gray,
            borderRadius:20,padding:'5px 14px',fontSize:13,fontWeight:filter===val?700:500,
            fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap'
          }}>{label}</button>
        ))}
      </div>

      {loading && <div style={{textAlign:"center",padding:40,color:C.gray}}>جاري التحميل...</div>}

      {!loading && offers.length === 0 && (
        <div style={{textAlign:"center",padding:40,background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:32,marginBottom:8}}>📭</div>
          <div style={{fontSize:15,color:C.gray}}>لا توجد عروض بعد</div>
          <div style={{fontSize:13,color:C.gray,marginTop:4}}>أرسل طلب رحلة وانتظر العروض</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {filtered.map((o)=>(
          <div key={o.id} style={{
            background:C.white,borderRadius:16,padding:"16px",
            border:`1.5px solid ${o.status==='accepted'?C.green:o.status==='rejected'?'#FECACA':o.price===lowestPrice?C.orange:C.border}`,
            boxShadow:o.price===lowestPrice&&o.status==='pending'?`0 0 0 3px ${C.orange}12`:"none",
            opacity:o.status==='rejected'?0.6:1,
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:'wrap'}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.ink}}>🏢 شركة سياحية</span>
                  {o.status==='accepted' && <span style={{background:C.greenBg,color:C.green,borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>مقبول ✓</span>}
                  {o.status==='rejected' && <span style={{background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>مرفوض</span>}
                  {o.price===lowestPrice&&o.status==='pending' && <span style={{background:C.light,color:C.orange,borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>الأفضل سعراً 🏆</span>}
                </div>
                <div style={{fontSize:13,color:C.gray}}>🌍 {o.trip_requests?.destination}</div>
                <div style={{fontSize:12,color:C.gray}}>👥 {o.trip_requests?.travelers} مسافرين</div>
                <div style={{fontSize:11,color:C.gray,marginTop:2}}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:24,fontWeight:900,color:C.orange}}>{o.price}</div>
                <div style={{fontSize:11,color:C.gray}}>ريال</div>
              </div>
            </div>

            {o.description && (
              <div style={{fontSize:13,color:C.ink,background:C.muted,borderRadius:8,padding:"8px 12px",marginBottom:10,lineHeight:1.6}}>{o.description}</div>
            )}

            {o.status === 'pending' && (
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
                <button onClick={()=>acceptOffer(o.id)} style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"11px",fontFamily:"inherit",fontWeight:700,fontSize:14,cursor:"pointer"}}>✓ قبول العرض</button>
                <button onClick={()=>rejectOffer(o.id)} style={{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA',borderRadius:10,padding:"11px",fontFamily:"inherit",fontSize:13,cursor:"pointer",fontWeight:600}}>رفض</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TRIPS ─────────────────────────────────────────────────────────
const Bookings = ()=>{
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ fetchBookings() },[])

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: requests } = await supabase
      .from('trip_requests').select('id').eq('user_id', user.id)
    if (!requests || requests.length === 0) { setLoading(false); return }
    const requestIds = requests.map(r => r.id)
    const { data } = await supabase
      .from('offers')
      .select('*, trip_requests(destination, travelers, created_at)')
      .in('request_id', requestIds)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
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
                <div style={{fontSize:11,color:C.gray,marginTop:2}}>{new Date(b.created_at).toLocaleDateString('ar-SA')}</div>
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
const Trips = ()=>{
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [tripOffers, setTripOffers] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(()=>{ fetchTrips() },[])

  const fetchTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('trip_requests')
      .select('*, offers(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTrips(data || [])
    setLoading(false)
  }

  const fetchTripOffers = async (tripId) => {
    if (tripOffers[tripId]) {
      setExpandedId(expandedId === tripId ? null : tripId)
      return
    }
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('request_id', tripId)
      .order('created_at', { ascending: false })
    setTripOffers(p => ({ ...p, [tripId]: data || [] }))
    setExpandedId(tripId)
  }

  const acceptOffer = async (offerId, tripId) => {
  await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId)
  await supabase.from('trip_requests').update({ status: 'closed' }).eq('id', tripId)
  fetchTrips()
  const { data } = await supabase.from('offers').select('*').eq('request_id', tripId)
  setTripOffers(p => ({ ...p, [tripId]: data || [] }))
  }

  const rejectOffer = async (offerId, tripId) => {
  await supabase.from('offers').update({ status: 'rejected' }).eq('id', offerId)
  const { data } = await supabase.from('offers').select('*').eq('request_id', tripId)
  setTripOffers(p => ({ ...p, [tripId]: data || [] }))
}

const requestNegotiation = async (offerId, tripId, offerPrice) => {
  // تحقق أن التفاوض لم يُستخدم من قبل
  const { data: offer } = await supabase.from('offers').select('negotiation_count').eq('id', offerId).single()
  if (offer?.negotiation_count >= 1) {
    alert('لا يمكن طلب التفاوض أكثر من مرة واحدة لكل عرض')
    return
  }

  // تحديث العرض
  await supabase.from('offers').update({ 
    negotiation_requested: true, 
    negotiation_count: 1,
    status: 'negotiating'
  }).eq('id', offerId)

  // إعادة فتح الطلب مع أفضل سعر
  await supabase.from('trip_requests').update({ 
    status: 'open',
    best_price: offerPrice,
    negotiation_done: true
  }).eq('id', tripId)

  // إشعار الشركات بأفضل سعر
  await fetch('https://uwmxximdupgfhfypdzll.supabase.co/functions/v1/quick-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      to: 'fr.ahmad.zaid@gmail.com',
      subject: '🔄 إعادة تفاوض — فرصة لتقديم عرض أفضل',
      body: `العميل طلب إعادة التفاوض.<br/>أفضل سعر وصله: <strong>${offerPrice} ريال</strong><br/>هل تريد تقديم عرض أفضل؟`
    })
  })

  fetchTrips()
  const { data } = await supabase.from('offers').select('*').eq('request_id', tripId)
  setTripOffers(p => ({ ...p, [tripId]: data || [] }))
}

  const filtered = trips.filter(t => {
    if (filter === 'all') return true
    return t.status === filter
  })

  if (loading) return <div style={{textAlign:'center',padding:40,color:C.gray}}>جاري التحميل...</div>

  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>طلباتي 📋</div>
      <div style={{fontSize:13,color:C.gray,marginBottom:12}}>{trips.length} طلبات رحلة</div>

      {/* فلتر */}
      <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
        {[['all','الكل'],['open','مفتوحة'],['closed','مغلقة']].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{border:`1.5px solid ${filter===val?C.orange:C.border}`,background:filter===val?C.light:C.white,color:filter===val?C.orange:C.gray,borderRadius:20,padding:'5px 14px',fontSize:13,fontWeight:filter===val?700:500,fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap'}}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{textAlign:'center',padding:40,background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <div style={{fontSize:15,color:C.gray}}>لا توجد طلبات</div>
          <div style={{fontSize:13,color:C.gray,marginTop:4}}>ابدأ بطلب رحلتك الأولى!</div>
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
                  {t.notes && <div style={{fontSize:12,color:C.gray,marginTop:4,background:C.muted,borderRadius:6,padding:'4px 8px'}}>{t.notes}</div>}
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
                  حذف
                </button>
              </div>
            </div>

            {/* العروض الخاصة بهذا الطلب */}
            {expandedId===t.id && (
              <div style={{borderTop:`1px solid ${C.border}`,padding:'14px 16px',background:'#FAFAFA'}}>
                {!tripOffers[t.id] || tripOffers[t.id].length === 0 ? (
                  <div style={{textAlign:'center',padding:'20px 0',color:C.gray,fontSize:13}}>
                    📭 لا توجد عروض بعد — انتظر ردود الشركات
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:4}}>العروض الواردة:</div>
                    {tripOffers[t.id].map((o,i)=>(
                      <div key={o.id} style={{background:C.white,borderRadius:12,padding:'12px 14px',border:`1.5px solid ${o.status==='accepted'?C.green:o.status==='rejected'?'#FECACA':i===0?C.orange:C.border}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                              <span style={{fontSize:13,fontWeight:700,color:C.ink}}>🏢 شركة سياحية</span>
                              {o.status==='accepted'&&<span style={{background:C.greenBg,color:C.green,borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:700}}>مقبول ✓</span>}
                              {o.status==='rejected'&&<span style={{background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:700}}>مرفوض</span>}
                              {i===0&&o.status==='pending'&&<span style={{background:C.light,color:C.orange,borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:700}}>🏆 الأفضل</span>}
                            </div>
                            {o.description&&<div style={{fontSize:12,color:C.gray,marginTop:2,lineHeight:1.5}}>{o.description}</div>}
                          </div>
                          <div style={{textAlign:'left',flexShrink:0}}>
                            <div style={{fontSize:18,fontWeight:800,color:C.orange}}>{o.price}</div>
                            <div style={{fontSize:10,color:C.gray}}>ريال</div>
                          </div>
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
{o.status==='pending'&&o.negotiation_count>=1&&(
  <div style={{background:'#FEF3C7',borderRadius:9,padding:'8px',textAlign:'center',fontSize:11,color:'#D97706',fontWeight:600,marginTop:4}}>
    ⚠️ لا يمكن طلب التفاوض مرة أخرى على هذا العرض
  </div>
)}
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
      setUser(user)
      setName(user?.user_metadata?.full_name || '')
      setAvatarUrl(user?.user_metadata?.avatar_url || null)
      setLoading(false)
    })
  },[])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: name } })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`
    await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
setAvatarUrl(data.publicUrl + '?t=' + Date.now())
    setUploadingAvatar(false)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) return
    setSaving(true)
    await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    setPasswordSaved(true)
    setChangingPassword(false)
    setNewPassword('')
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  if (loading) return <div style={{textAlign:'center',padding:40,color:C.gray}}>جاري التحميل...</div>

  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{textAlign:"center",padding:"20px 0 24px"}}>
        
        {/* الصورة الشخصية */}
        <div style={{position:'relative',width:80,height:80,margin:'0 auto 12px'}}>
          {avatarUrl ? (
            <img src={avatarUrl} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover'}} />
          ) : (
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
          <input value={name} onChange={e=>setName(e.target.value)}
            style={{textAlign:'center',fontSize:18,fontWeight:800,border:`1.5px solid ${C.orange}`,borderRadius:10,padding:'8px 14px',fontFamily:'inherit',outline:'none',direction:'rtl',width:'100%',marginBottom:8}}
          />
        ) : (
          <div style={{fontSize:20,fontWeight:800,color:C.ink}}>{name || "مستخدم بكجات"}</div>
        )}
        <div style={{fontSize:14,color:C.gray,marginTop:2}}>{user?.email}</div>

        {!editing ? (
          <button onClick={()=>setEditing(true)} style={{marginTop:10,background:C.light,color:C.orange,border:`1px solid ${C.orange}33`,borderRadius:20,padding:'6px 18px',fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            ✏️ تعديل الاسم
          </button>
        ) : (
          <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:10}}>
            <button onClick={handleSave} disabled={saving} style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:'none',borderRadius:10,padding:'8px 20px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer'}}>
              {saving?'جاري الحفظ...':'حفظ'}
            </button>
            <button onClick={()=>setEditing(false)} style={{background:C.muted,color:C.gray,border:'none',borderRadius:10,padding:'8px 16px',fontFamily:'inherit',fontSize:13,cursor:'pointer'}}>
              إلغاء
            </button>
          </div>
        )}

        {saved && <div style={{color:C.green,fontSize:13,marginTop:8,fontWeight:600}}>✅ تم حفظ الاسم!</div>}
        {passwordSaved && <div style={{color:C.green,fontSize:13,marginTop:8,fontWeight:600}}>✅ تم تغيير كلمة السر!</div>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        
        {/* تغيير كلمة السر */}
        <div style={{background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:13}}>
              <span style={{fontSize:20}}>🔒</span>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.ink}}>كلمة السر</div>
                <div style={{fontSize:12,color:C.gray}}>تغيير كلمة السر الحالية</div>
              </div>
            </div>
            <button onClick={()=>setChangingPassword(!changingPassword)} style={{background:C.light,color:C.orange,border:'none',borderRadius:8,padding:'5px 12px',fontFamily:'inherit',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {changingPassword?'إلغاء':'تغيير'}
            </button>
          </div>
          {changingPassword && (
            <div style={{marginTop:12}}>
              <input type="password" placeholder="كلمة السر الجديدة (٦ أحرف على الأقل)" value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
                style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'10px 13px',fontFamily:'inherit',fontSize:13,outline:'none',boxSizing:'border-box',direction:'rtl',marginBottom:8}}
                onFocus={e=>e.target.style.borderColor=C.orange}
                onBlur={e=>e.target.style.borderColor=C.border}
              />
              <button onClick={handlePasswordChange} disabled={saving} style={{width:'100%',background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:'none',borderRadius:10,padding:'10px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                {saving?'جاري الحفظ...':'حفظ كلمة السر'}
              </button>
            </div>
          )}
        </div>

        {/* تواصل معنا */}
        <a href="https://wa.me/00966592244551" target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:13,background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`,textDecoration:'none'}}>
          <span style={{fontSize:20}}>📞</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:C.ink}}>تواصل معنا</div>
            <div style={{fontSize:12,color:C.gray}}>واتساب — الدعم ٢٤/٧</div>
          </div>
          <span style={{color:C.green,fontSize:13,fontWeight:700}}>واتساب ↗</span>
        </a>

        {/* البريد */}
        <div style={{display:"flex",alignItems:"center",gap:13,background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <span style={{fontSize:20}}>✉️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:C.ink}}>البريد الإلكتروني</div>
            <div style={{fontSize:12,color:C.gray}}>{user?.email}</div>
          </div>
        </div>

        {/* تسجيل الخروج */}
        <div onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:13,background:"#FEF2F2",borderRadius:13,padding:"14px 16px",border:"1px solid #FECACA",cursor:"pointer",marginTop:8}}>
          <span style={{fontSize:20}}>🚪</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#DC2626"}}>تسجيل الخروج</div>
          </div>
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })
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
            <div>
              <div style={{fontSize:15,fontWeight:900,color:C.ink}}>بكجات</div>
              <div style={{fontSize:10,color:C.gray}}>pakajat.com</div>
            </div>
          </div>
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:20}}>🔔</button>
        </div>

        <div style={{flex:1,overflowY:"auto",paddingBottom:70,background:"#F3F4F6"}}>
          {page==="home"&&<Home setPage={setPage}/>}
          {page==="request"&&<Request setPage={setPage}/>}
          {page==="offers"&&<Offers/>}
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
<div style={{opacity:page===t.id?1:0.45,color:page===t.id?C.orange:C.gray,transition:"all .2s"}}>{t.icon}</div>                )}
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