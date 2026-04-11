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

// OfferForm — نموذج العرض المفصل للشركة
// يُستبدل به كود OfferForm الحالي في CompanyDashboard.jsx
const priceInpStyle = { border:'1.5px solid #E5E7EB', borderRadius:8, padding:'8px 10px', fontFamily:'inherit', fontSize:12, outline:'none', boxSizing:'border-box', direction:'ltr', textAlign:'left', width:80, flexShrink:0, background:'#FFFFFF' }

const SectionHeader = ({ icon, title, price, onPriceChange }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
    <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{icon} {title}</div>
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ fontSize:11, color:'#6B7280' }}>السعر:</div>
      <input type="number" placeholder="0" value={price} onChange={e => onPriceChange(e.target.value)} style={priceInpStyle}
        onFocus={e => e.target.style.borderColor='#F26522'} onBlur={e => e.target.style.borderColor='#E5E7EB'} />
      <div style={{ fontSize:11, color:'#6B7280' }}>ريال</div>
    </div>
  </div>
)

const OfferForm = ({ requestId, requestData, onSent }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [showItemPrices, setShowItemPrices] = useState(true)
  const [offerHours, setOfferHours] = useState(24)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [offerNotes, setOfferNotes] = useState('')

  // خدمات العميل
const rawSvc = requestData?.services
const svc = rawSvc ? (typeof rawSvc === 'string' ? JSON.parse(rawSvc) : rawSvc) : {}
const flights = svc.flights?.filter(f => f.from || f.to) || []
const hotels = svc.hotels || []
const cities = svc.cities || []
 

  // بيانات الطيران من الشركة
  const [flightDetails, setFlightDetails] = useState([])
const [hotelDetails, setHotelDetails] = useState([])
const [otherServices, setOtherServices] = useState({
  visa: { included: false, price: '', notes: '' },
  arrival: { included: false, vip: false, price: '', vehicle: 'سيارة عادية' },
  departure: { included: false, vip: false, price: '', vehicle: 'سيارة عادية' },
  car: { included: false, days: '', carType: 'سيارة عادية', price: '' },
  sim: { included: false, qty: 2, price: '' },
  tickets: { included: false, attractions: [], price: '' },
  program: { included: false, price: '' },
})

useEffect(() => {
  if (!open) return
  console.log('svc data:', JSON.stringify(svc))
  setFlightDetails((svc.flights?.filter(f => f.from || f.to) || []).map(f => ({ ...f, airline: '', type: 'direct', stopCity: '', stopDuration: '', bags: '1', bagWeight: '23', price: '' })))
  setHotelDetails((svc.hotels || []).map(h => ({ ...h, hotelName: h.name || '', roomType: 'غرفة مزدوجة', roomSize: 'عادية', breakfast: h.breakfast || false, checkIn: '', checkOut: '', cancelPolicy: 'غير قابل للإلغاء', cancelDate: '', price: '' })))
  setOtherServices({
    visa: { included: !!svc.visa, price: '', notes: '' },
    arrival: { included: !!svc.arrival, vip: !!svc.arrVip, price: '', vehicle: 'سيارة عادية' },
    departure: { included: !!svc.departure, vip: !!svc.depVip, price: '', vehicle: 'سيارة عادية' },
car: { included: !!svc.car, days: svc.carCustomDays || '', carPeriod: svc.carDays || 'طوال الرحلة', carType: 'سيارة عادية', price: '' },    sim: { included: !!svc.sim, qty: svc.simQty || 1, price: '' },
    tickets: { included: !!svc.tickets, attractions: svc.selectedAttractions || [], price: '' },
    program: { included: !!svc.program, price: '' },
  })
}, [open])

  const os = (key, field, value) => setOtherServices(p => ({ ...p, [key]: { ...p[key], [field]: value } }))

  const totalPrice = () => {
    let total = 0
    flightDetails.forEach(f => total += parseFloat(f.price) || 0)
    hotelDetails.forEach(h => total += parseFloat(h.price) || 0)
    Object.values(otherServices).forEach(s => { if (s.included) total += parseFloat(s.price) || 0 })
    return total
  }

  const paymentOptions = ['تحويل بنكي', 'مدى', 'فيزا/ماستر', 'آبل باي', 'نقداً', 'تابي', 'تمارا']

  const sendOffer = async () => {
    if (totalPrice() === 0) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()

    const offerItems = []
    if (svc.flight) flightDetails.forEach((f, i) => offerItems.push({ type: 'flight', label: `طيران ${i + 1}: ${f.from} → ${f.to}`, details: `${f.airline} · ${f.type === 'direct' ? 'مباشر' : `توقف في ${f.stopCity} (${f.stopDuration})`} · ${f.bags} حقيبة ${f.bagWeight}كغ`, price: parseFloat(f.price) || 0 }))
    if (svc.hotel) hotelDetails.forEach(h => offerItems.push({ type: 'hotel', label: `فندق ${h.city}: ${h.hotelName || h.city}`, details: `${h.roomType} · ${h.roomSize} · ${h.breakfast ? 'شامل إفطار' : 'بدون إفطار'} · ${h.cancelPolicy}`, price: parseFloat(h.price) || 0 }))
    if (svc.visa && otherServices.visa.included) offerItems.push({ type: 'visa', label: 'تأشيرة سياحية', details: otherServices.visa.notes, price: parseFloat(otherServices.visa.price) || 0 })
    if (svc.arrival && otherServices.arrival.included) offerItems.push({ type: 'arrival', label: `استقبال مطار${otherServices.arrival.vip ? ' VIP' : ''}`, details: otherServices.arrival.vehicle, price: parseFloat(otherServices.arrival.price) || 0 })
    if (svc.departure && otherServices.departure.included) offerItems.push({ type: 'departure', label: `توديع مطار${otherServices.departure.vip ? ' VIP' : ''}`, details: otherServices.departure.vehicle, price: parseFloat(otherServices.departure.price) || 0 })
    if (svc.car && otherServices.car.included) offerItems.push({ type: 'car', label: 'سيارة بسائق', details: `${otherServices.car.carType} · ${otherServices.car.days} أيام`, price: parseFloat(otherServices.car.price) || 0 })
    if (svc.sim && otherServices.sim.included) offerItems.push({ type: 'sim', label: `شرائح جوال (${otherServices.sim.qty})`, details: '20 قيقا', price: parseFloat(otherServices.sim.price) || 0 })
    if (svc.tickets && otherServices.tickets.included) offerItems.push({ type: 'tickets', label: 'تذاكر سياحية', details: otherServices.tickets.attractions.map(a => a.split('||')[1]).join('، '), price: parseFloat(otherServices.tickets.price) || 0 })
    if (svc.program && otherServices.program.included) offerItems.push({ type: 'program', label: 'برنامج سياحي يومي', details: 'برنامج مفصل لكل مدينة', price: parseFloat(otherServices.program.price) || 0 })

    await supabase.from('offers').insert({
      request_id: requestId,
      company_id: company?.id || null,
      price: totalPrice(),
      description: offerNotes,
      offer_items: offerItems,
      show_item_prices: showItemPrices,
      offer_duration_hours: offerHours,
      payment_methods: paymentMethods,
      status: 'pending'
    })

    setLoading(false); setSent(true); setOpen(false)
    if (onSent) onSent()
  }

  if (sent) return (
    <div style={{ background: C.greenBg, border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 13, color: C.green, fontWeight: 700 }}>
      ✅ تم إرسال العرض بنجاح!
    </div>
  )

  const inp = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box', direction: 'rtl', background: C.white }
  const priceInp = { ...inp, direction: 'ltr', textAlign: 'left', width: 90, flexShrink: 0 }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ width: '100%', background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          📋 إرسال عرض مفصل ←
        </button>
      ) : (
        <div style={{ background: '#FAFAFA', borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 16 }}>📋 نموذج العرض</div>

          {/* ١ - الطيران */}
          {svc.flight && flightDetails.map((f, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 12, padding: 14, border: `1px solid ${C.blueBg}`, marginBottom: 12 }}>
              <SectionHeader icon="✈️" title={`طيران ${flightDetails.length > 1 ? i + 1 : ''}: ${f.from || '...'} → ${f.to || '...'}`} price={f.price} onPriceChange={v => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, price: v } : x))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>اسم الخطوط الجوية</div>
                  <input placeholder="مثال: السعودية، طيران ناس..." value={f.airline} onChange={e => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, airline: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>تاريخ الرحلة</div>
                  <input type="date" value={f.date} onChange={e => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>نوع الرحلة</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['direct', 'stop'].map(type => (
                    <button key={type} onClick={() => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, type } : x))} style={{ flex: 1, border: `1.5px solid ${f.type === type ? C.blue : C.border}`, background: f.type === type ? C.blueBg : C.white, color: f.type === type ? C.blue : C.gray, borderRadius: 8, padding: '7px', fontFamily: 'inherit', fontWeight: f.type === type ? 700 : 500, fontSize: 12, cursor: 'pointer' }}>
                      {type === 'direct' ? '✈️ مباشر' : '🔄 مع توقف'}
                    </button>
                  ))}
                </div>
              </div>
              {f.type === 'stop' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>مدينة التوقف</div>
                    <input placeholder="مثال: دبي، أبوظبي..." value={f.stopCity} onChange={e => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, stopCity: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>مدة التوقف</div>
                    <input placeholder="مثال: ٢ ساعة" value={f.stopDuration} onChange={e => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, stopDuration: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>عدد الشنط</div>
                  <select value={f.bags} onChange={e => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, bags: e.target.value } : x))} style={{ ...inp }}>
                    {['0', '1', '2', '3'].map(n => <option key={n} value={n}>{n} حقيبة</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>وزن الحقيبة (كغ)</div>
                  <select value={f.bagWeight} onChange={e => setFlightDetails(flightDetails.map((x, j) => j === i ? { ...x, bagWeight: e.target.value } : x))} style={{ ...inp }}>
                    {['20', '23', '25', '30', '32'].map(n => <option key={n} value={n}>{n} كغ</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* ٢ - الفنادق */}
          {svc.hotel && hotelDetails.map((h, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 12, padding: 14, border: `1px solid #FEF3C7`, marginBottom: 12 }}>
              <SectionHeader icon="🏨" title={`فندق ${h.city}`} price={h.price} onPriceChange={v => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, price: v } : x))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>اسم الفندق</div>
                  <input placeholder="Hilton، Marriott..." value={h.hotelName} onChange={e => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, hotelName: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.amber} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>نوع الغرفة</div>
                  <select value={h.roomType} onChange={e => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, roomType: e.target.value } : x))} style={{ ...inp }}>
                    {['غرفة مفردة', 'غرفة مزدوجة', 'جناح', 'غرفة عائلية', 'شقة فندقية'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>حجم الغرفة</div>
                  <select value={h.roomSize} onChange={e => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, roomSize: e.target.value } : x))} style={{ ...inp }}>
                    {['عادية', 'ديلوكس', 'سوبيريور', 'كبيرة'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div onClick={() => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, breakfast: !x.breakfast } : x))} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 20 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${h.breakfast ? C.orange : C.border}`, background: h.breakfast ? C.orange : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {h.breakfast && <span style={{ color: C.white, fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.ink }}>شامل الإفطار</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>تاريخ الوصول</div>
                  <input type="date" value={h.checkIn || (cities[i]?.from || '')} onChange={e => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, checkIn: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.amber} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>تاريخ المغادرة</div>
                  <input type="date" value={h.checkOut || (cities[i]?.to || '')} onChange={e => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, checkOut: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.amber} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>سياسة الإلغاء</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: h.cancelPolicy === 'قابل للإلغاء حتى' ? 8 : 0 }}>
                  {['غير قابل للإلغاء', 'قابل للإلغاء حتى'].map(p => (
                    <button key={p} onClick={() => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, cancelPolicy: p } : x))} style={{ flex: 1, border: `1.5px solid ${h.cancelPolicy === p ? '#DC2626' : C.border}`, background: h.cancelPolicy === p ? '#FEF2F2' : C.white, color: h.cancelPolicy === p ? '#DC2626' : C.gray, borderRadius: 8, padding: '7px', fontFamily: 'inherit', fontWeight: h.cancelPolicy === p ? 700 : 500, fontSize: 11, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                </div>
                {h.cancelPolicy === 'قابل للإلغاء حتى' && (
                  <input type="date" value={h.cancelDate} onChange={e => setHotelDetails(hotelDetails.map((x, j) => j === i ? { ...x, cancelDate: e.target.value } : x))} style={inp} onFocus={e => e.target.style.borderColor = C.amber} onBlur={e => e.target.style.borderColor = C.border} />
                )}
              </div>
            </div>
          ))}

          {/* ٣ - الخدمات الأخرى */}
          {[
            svc.visa && ['visa', '📄', 'تأشيرة سياحية'],
            svc.arrival && ['arrival', '🚖', `استقبال مطار${svc.arrVip ? ' VIP' : ''}`],
            svc.departure && ['departure', '🛫', `توديع مطار${svc.depVip ? ' VIP' : ''}`],
            svc.car && ['car', '🚗', 'سيارة بسائق'],
            svc.sim && ['sim', '📱', `شرائح جوال (${svc.simQty})`],
            svc.tickets && ['tickets', '🎟️', 'تذاكر سياحية'],
            svc.program && ['program', '📋', 'برنامج سياحي يومي'],
          ].filter(Boolean).map(([key, icon, label]) => (
            <div key={key} style={{ background: C.white, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, marginBottom: 10 }}>
              <SectionHeader icon={icon} title={label} price={otherServices[key].price} onPriceChange={v => os(key, 'price', v)} />
              {key === 'car' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
      ⏱ طلب العميل: {otherServices.car.carPeriod || 'طوال الرحلة'}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>نوع السيارة</div>
        <select value={otherServices.car.carType} onChange={e => os('car', 'carType', e.target.value)} style={{ ...inp }}>
          {['سيارة عادية', 'سيارة فاخرة', 'فان', 'باص صغير'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>عدد الأيام (إن وجد)</div>
        <input type="number" placeholder="0" value={otherServices.car.days} onChange={e => os('car', 'days', e.target.value)} style={inp} />
      </div>
    </div>
  </div>
)}
              {key === 'visa' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
      ✓ حجز موعد القنصلية · ✓ تأمين سفر · ✓ ترجمة الوثائق
    </div>
    <input placeholder="ملاحظات إضافية..." value={otherServices.visa.notes} onChange={e => os('visa', 'notes', e.target.value)} style={inp} />
  </div>
)}
{(key === 'arrival' || key === 'departure') && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
      {key === 'arrival' ? (svc.arrVip ? '⭐ VIP — لوحة استقبال مخصصة' : '🚖 استقبال عادي') : (svc.depVip ? '⭐ VIP — مرافق شخصي' : '🛫 توديع عادي')}
    </div>
    <div>
      <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>نوع المركبة</div>
      <select value={otherServices[key].vehicle} onChange={e => os(key, 'vehicle', e.target.value)} style={{ ...inp }}>
        {['سيارة عادية', 'سيارة فاخرة', 'فان', 'ليموزين'].map(t => <option key={t}>{t}</option>)}
      </select>
    </div>
  </div>
)}
{key === 'sim' && (
  <div style={{ background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
    📱 طلب العميل: {svc.simQty || 1} شرائح · 20 قيقا لكل شريحة
  </div>
)}
{key === 'tickets' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
      🎟️ المعالم المطلوبة:
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(svc.selectedAttractions || []).map(a => (
        <span key={a} style={{ background: '#FEF3C7', color: '#D97706', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
          {a.split('||')[1]}
        </span>
      ))}
    </div>
  </div>
)}
{key === 'program' && (
  <div style={{ background: C.light, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.orange, fontWeight: 600 }}>
    📋 برنامج سياحي يومي مفصل لكل مدينة
  </div>
)}
</div>
          ))}

          {/* الإجمالي */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.light, borderRadius: 12, padding: '12px 16px', marginBottom: 14, border: `1.5px solid ${C.orange}33` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>💰 السعر الإجمالي</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.orange }}>{totalPrice().toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: C.gray }}>ريال</span></div>
          </div>

          {/* إظهار الأسعار التفصيلية */}
          <div style={{ background: C.white, borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div onClick={() => setShowItemPrices(!showItemPrices)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>إظهار أسعار كل خدمة للعميل</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>إذا أخفيت ستظهر الإجمالي فقط</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: showItemPrices ? C.orange : C.border, position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, right: showItemPrices ? 2 : 'auto', left: showItemPrices ? 'auto' : 2, width: 18, height: 18, borderRadius: '50%', background: C.white, transition: 'all .2s' }} />
              </div>
            </div>
          </div>

          {/* مدة العرض */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>⏱ مدة صلاحية العرض</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[12, 24, 48, 72].map(h => (
                <button key={h} onClick={() => setOfferHours(h)} style={{ flex: 1, border: `1.5px solid ${offerHours === h ? C.orange : C.border}`, background: offerHours === h ? C.light : C.white, color: offerHours === h ? C.orange : C.gray, borderRadius: 8, padding: '7px 4px', fontFamily: 'inherit', fontWeight: offerHours === h ? 700 : 500, fontSize: 12, cursor: 'pointer' }}>
                  {h}س
                </button>
              ))}
            </div>
          </div>

          {/* طرق الدفع */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>💳 طرق الدفع المتاحة</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {paymentOptions.map(p => {
                const selected = paymentMethods.includes(p)
                return (
                  <button key={p} onClick={() => setPaymentMethods(selected ? paymentMethods.filter(x => x !== p) : [...paymentMethods, p])} style={{ border: `1.5px solid ${selected ? C.green : C.border}`, background: selected ? C.greenBg : C.white, color: selected ? C.green : C.gray, borderRadius: 20, padding: '4px 10px', fontFamily: 'inherit', fontWeight: selected ? 700 : 500, fontSize: 12, cursor: 'pointer' }}>
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ملاحظات */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>💬 ملاحظات إضافية (اختياري)</div>
            <textarea placeholder="أي معلومات إضافية للعميل..." value={offerNotes} onChange={e => setOfferNotes(e.target.value)} rows={2}
              style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'none', direction: 'rtl', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {/* أزرار */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <button onClick={sendOffer} disabled={loading || totalPrice() === 0} style={{ background: totalPrice() > 0 ? `linear-gradient(135deg,${C.orange},${C.dark})` : C.border, color: C.white, border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: totalPrice() > 0 ? 'pointer' : 'not-allowed' }}>
              {loading ? '⏳ جاري الإرسال...' : '🚀 إرسال العرض'}
            </button>
            <button onClick={() => setOpen(false)} style={{ background: C.muted, color: C.gray, border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
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
  const [companyData, setCompanyData] = useState(null)
const [uploadingLogo, setUploadingLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0 })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setCompanyName(user?.user_metadata?.full_name || 'شركتي السياحية')
    // جلب بيانات الشركة
const { data: companyInfo } = await supabase
  .from('companies')
  .select('*')
  .eq('user_id', user.id)
  .single()
setCompanyData(companyInfo || {})

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
const saveCompanyData = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.auth.updateUser({ data: { full_name: companyName } })
  await supabase.from('companies').update({
    company_name: companyName,
    city: companyData?.city || '',
    country: companyData?.country || 'السعودية',
    bio: companyData?.bio || '',
    website: companyData?.website || '',
    google_maps: companyData?.google_maps || '',
    logo_url: companyData?.logo_url || '',
  }).eq('user_id', user.id)
  setEditingName(false)
  alert('✅ تم حفظ البيانات بنجاح!')
}

const handleLogoUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setUploadingLogo(true)
  const { data: { user } } = await supabase.auth.getUser()
  const fileExt = file.name.split('.').pop()
  const fileName = `company_${user.id}.${fileExt}`
  await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
  setCompanyData(p => ({ ...p, logo_url: data.publicUrl + '?t=' + Date.now() }))
  setUploadingLogo(false)
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
<div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
  <span style={{ background: C.greenBg, color: C.green, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>مفتوح</span>
  {r.negotiation_done && (
    <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>🔄 إعادة تفاوض</span>
  )}
  {r.best_price && (
    <span style={{ background: '#FEF3C7', color: '#D97706', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>💰 أفضل سعر: {r.best_price} ريال</span>
  )}
</div>                    </div>
                    {r.notes && <div style={{ fontSize: 13, color: C.gray, background: C.muted, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>{r.notes}</div>}
                    {r.ai_translation && (
                      <div style={{ fontSize: 12, color: C.ink, background: C.light, border: `1px solid ${C.orange}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 10, direction: 'ltr', textAlign: 'left' }}>
                        <div style={{ fontSize: 10, color: C.orange, marginBottom: 4, direction: 'rtl', textAlign: 'right' }}>🤖 ترجمة AI</div>
                        {r.ai_translation}
                      </div>
                    )}
<OfferForm requestId={r.id} requestData={r} onSent={fetchAll} />
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
    <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 16 }}>🏢 بيانات شركتي</div>

    <div style={{ background: C.white, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, marginBottom: 12 }}>
      
      {/* الشعار */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 12px' }}>
          {companyData?.logo_url ? (
            <img src={companyData.logo_url} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg,${C.orange},${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: C.white }}>🏢</div>
          )}
          <label style={{ position: 'absolute', bottom: 0, left: 0, width: 26, height: 26, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
            {uploadingLogo ? '⏳' : '📷'}
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </label>
        </div>
        {editingName ? (
          <div>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, border: `1.5px solid ${C.orange}`, borderRadius: 10, padding: '8px 14px', fontFamily: 'inherit', outline: 'none', direction: 'rtl', width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={saveCompanyData} style={{ background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 10, padding: '8px 20px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>حفظ</button>
              <button onClick={() => setEditingName(false)} style={{ background: C.muted, color: C.gray, border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{companyName}</div>
            <button onClick={() => setEditingName(true)} style={{ marginTop: 8, background: C.light, color: C.orange, border: `1px solid ${C.orange}33`, borderRadius: 20, padding: '5px 14px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✏️ تعديل الاسم</button>
          </div>
        )}
      </div>

      {/* البيانات */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          ['🌍 الدولة', 'country', 'مثال: السعودية'],
          ['📍 المدينة', 'city', 'مثال: الرياض'],
          ['📝 نبذة عن الشركة', 'bio', 'اكتب نبذة مختصرة عن شركتك...'],
          ['🌐 الموقع الإلكتروني', 'website', 'https://yourwebsite.com'],
          ['📍 رابط قوقل ماب', 'google_maps', 'https://maps.google.com/...'],
        ].map(([label, key, placeholder]) => (
          <div key={key}>
            <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, marginBottom: 5 }}>{label}</div>
            {key === 'bio' ? (
              <textarea
                placeholder={placeholder}
                value={companyData?.[key] || ''}
                onChange={e => setCompanyData(p => ({ ...p, [key]: e.target.value }))}
                rows={3}
                style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'none', direction: 'rtl', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.orange}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            ) : (
              <input
                placeholder={placeholder}
                value={companyData?.[key] || ''}
                onChange={e => setCompanyData(p => ({ ...p, [key]: e.target.value }))}
                style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box', direction: key === 'website' || key === 'google_maps' ? 'ltr' : 'rtl' }}
                onFocus={e => e.target.style.borderColor = C.orange}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            )}
          </div>
        ))}

        <button onClick={saveCompanyData} style={{ width: '100%', background: `linear-gradient(135deg,${C.orange},${C.dark})`, color: C.white, border: 'none', borderRadius: 12, padding: '13px', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
          💾 حفظ البيانات
        </button>
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