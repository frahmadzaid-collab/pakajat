import { useState } from 'react'
import { supabase } from '../supabase'

const O = '#F26522'
const D = '#C84E18'
const CREAM = '#FFFAF6'

export default function Login() {
const [mode, setMode] = useState('landing')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('يرجى ملء جميع الحقول'); return }
    setLoading(true); setError('')
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, role } }
      })
      if (error) setError(error.message)
      else setSuccess('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن ✅')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('البريد أو كلمة السر غير صحيحة')
    }
    setLoading(false)
  }

  const inp = (focused) => ({
    width: '100%',
    border: `1.5px solid ${focused ? O : '#E8E0D8'}`,
    borderRadius: 14,
    padding: '13px 16px',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
    direction: 'rtl',
    boxSizing: 'border-box',
    background: CREAM,
    color: '#1A1208',
    transition: 'border-color .2s',
  })

  // شاشة الاختيار
  if (mode === 'landing') return (
  <div style={{fontFamily:"'Tajawal',sans-serif",direction:'rtl',minHeight:'100vh',background:'#FFFAF6'}}>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>

    {/* Header */}
    <div style={{background:'white',borderBottom:'1px solid #E5E7EB',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:50}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:36,height:36,borderRadius:11,background:`linear-gradient(135deg,${O},${D})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:17}}>ب</div>
        <div>
          <div style={{fontSize:15,fontWeight:900,color:'#111827'}}>بكجات</div>
          <div style={{fontSize:10,color:'#6B7280'}}>pakajat.com</div>
        </div>
      </div>
      <button onClick={()=>setMode('welcome')} style={{background:`linear-gradient(135deg,${O},${D})`,color:'white',border:'none',borderRadius:10,padding:'9px 20px',fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:`0 4px 12px ${O}40`}}>
        ابدأ الآن ←
      </button>
    </div>

    {/* Hero */}
    <div style={{background:`linear-gradient(135deg,${O},${D})`,padding:'48px 24px 56px',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
      <div style={{position:'relative'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.18)',borderRadius:20,padding:'5px 14px',fontSize:12,color:'white',fontWeight:600,marginBottom:16}}>
          🤖 مدعوم بالذكاء الاصطناعي
        </div>
        <div style={{fontSize:30,fontWeight:900,color:'white',lineHeight:1.25,marginBottom:12}}>
          رحلتك تبدأ هنا<br/>والشركات تتنافس عليك
        </div>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.85)',marginBottom:28,lineHeight:1.7,maxWidth:320,margin:'0 auto 28px'}}>
          منصة تربط المسافرين بأفضل شركات السياحة المحلية والدولية — أرسل طلبك مرة واحدة واستقبل عروضاً تنافسية
        </div>
        <button onClick={()=>setMode('welcome')} style={{background:'white',color:O,borderRadius:14,padding:'14px 32px',fontFamily:'inherit',fontWeight:800,fontSize:16,border:'none',cursor:'pointer',boxShadow:'0 6px 24px rgba(0,0,0,0.15)'}}>
          ابدأ مجاناً ←
        </button>
      </div>
    </div>

    {/* كيف تعمل */}
    <div style={{padding:'40px 24px',maxWidth:480,margin:'0 auto'}}>
      <div style={{fontSize:20,fontWeight:900,color:'#111827',textAlign:'center',marginBottom:6}}>كيف تعمل بكجات؟</div>
      <div style={{fontSize:13,color:'#6B7280',textAlign:'center',marginBottom:28}}>٣ خطوات بسيطة للحصول على أفضل عرض</div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {[
          ['1️⃣','أرسل طلبك','اكتب وجهتك واختر الخدمات التي تريدها — طيران، فندق، جولات، وأكثر'],
          ['2️⃣','الشركات تتنافس','شركات سياحة محلية ودولية معتمدة تستقبل طلبك وترسل عروضاً تنافسية'],
          ['3️⃣','اختر الأفضل','قارن العروض واختر الأنسب لك — السعر، الخدمة، أو الشمولية'],
        ].map(([num,title,desc])=>(
          <div key={title} style={{display:'flex',alignItems:'flex-start',gap:14,background:'white',borderRadius:16,padding:'16px',border:'1px solid #E5E7EB',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:28,flexShrink:0}}>{num}</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'#111827',marginBottom:4}}>{title}</div>
              <div style={{fontSize:13,color:'#6B7280',lineHeight:1.6}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* الفكرة */}
    <div style={{background:'white',padding:'36px 24px',borderTop:'1px solid #E5E7EB',borderBottom:'1px solid #E5E7EB'}}>
      <div style={{maxWidth:480,margin:'0 auto'}}>
        <div style={{fontSize:20,fontWeight:900,color:'#111827',marginBottom:6,textAlign:'center'}}>لماذا بكجات؟</div>
        <div style={{fontSize:13,color:'#6B7280',marginBottom:24,textAlign:'center'}}>فكرة تحل مشكلة حقيقية</div>
        <div style={{background:'#FFF4EE',borderRadius:16,padding:'20px',border:'1px solid rgba(242,101,34,0.15)',marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:'#111827',marginBottom:8}}>🌍 للمسافر</div>
          <div style={{fontSize:13,color:'#374151',lineHeight:1.7}}>
            المسافر الذي يريد السفر إلى فرنسا — بدل أن يبحث وحده، يرسل طلباً واحداً ويستقبل عروضاً من شركات سياحة سعودية متخصصة في السفر لفرنسا، <strong>وأيضاً من شركات فرنسية محلية</strong> تعرف البلد جيداً وتقدم أفضل الخدمات للزوار.
          </div>
        </div>
        <div style={{background:'#EFF6FF',borderRadius:16,padding:'20px',border:'1px solid rgba(37,99,235,0.15)'}}>
          <div style={{fontSize:14,fontWeight:700,color:'#111827',marginBottom:8}}>🏢 للشركات</div>
          <div style={{fontSize:13,color:'#374151',lineHeight:1.7}}>
            الشركات السياحية المحلية والدولية تستقبل طلبات جاهزة من عملاء فعليين — بدون مصاريف تسويق، فقط تقدم عرضك وتنافس على الفوز بالعميل.
          </div>
        </div>
      </div>
    </div>

    {/* مميزات */}
    <div style={{padding:'36px 24px',maxWidth:480,margin:'0 auto'}}>
      <div style={{fontSize:20,fontWeight:900,color:'#111827',textAlign:'center',marginBottom:24}}>مميزات بكجات</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {[
          ['🤖','ذكاء اصطناعي','ترجمة تلقائية للشركات الدولية'],
          ['🌍','شركات دولية','عروض من شركات في بلد الوجهة'],
          ['⚡','سريع','عروض تصلك خلال ٢٤ ساعة'],
          ['🔒','آمن','منصة معتمدة وموثوقة'],
          ['💰','توفير','عروض تنافسية تضمن أفضل سعر'],
          ['📱','سهل','واجهة بسيطة من الجوال'],
        ].map(([icon,title,desc])=>(
          <div key={title} style={{background:'white',borderRadius:14,padding:'14px',border:'1px solid #E5E7EB',textAlign:'center'}}>
            <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:'#111827',marginBottom:3}}>{title}</div>
            <div style={{fontSize:11,color:'#6B7280',lineHeight:1.5}}>{desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* الفريق */}
    <div style={{background:'white',padding:'36px 24px',borderTop:'1px solid #E5E7EB'}}>
      <div style={{maxWidth:480,margin:'0 auto'}}>
        <div style={{fontSize:20,fontWeight:900,color:'#111827',textAlign:'center',marginBottom:24}}>فريق بكجات</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[
            ['💡','خالد العقيلي','صاحب الفكرة'],
            ['⚙️','أحمد بن زيد','التنفيذ والتطوير'],
            ['🏢','شركة خبراء الرحلات','الإدارة والتشغيل'],
          ].map(([icon,name,role])=>(
            <div key={name} style={{display:'flex',alignItems:'center',gap:14,background:'#F9FAFB',borderRadius:14,padding:'14px 16px'}}>
              <div style={{width:44,height:44,borderRadius:12,background:'#FFF4EE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{icon}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{name}</div>
                <div style={{fontSize:12,color:'#6B7280',marginTop:1}}>{role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* CTA */}
    <div style={{background:`linear-gradient(135deg,${O},${D})`,padding:'40px 24px',textAlign:'center'}}>
      <div style={{fontSize:22,fontWeight:900,color:'white',marginBottom:8}}>جاهز تبدأ؟</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginBottom:24}}>سجّل مجاناً وابدأ رحلتك الأولى</div>
      <button onClick={()=>setMode('welcome')} style={{background:'white',color:O,borderRadius:14,padding:'14px 40px',fontFamily:'inherit',fontWeight:800,fontSize:16,border:'none',cursor:'pointer',boxShadow:'0 6px 24px rgba(0,0,0,0.15)'}}>
        ابدأ مجاناً ←
      </button>
    </div>

    {/* Footer */}
    <div style={{background:'#111827',padding:'20px 24px',textAlign:'center'}}>
      <div style={{fontSize:12,color:'#6B7280'}}>© 2026 بكجات — جميع الحقوق محفوظة</div>
      <div style={{fontSize:11,color:'#4B5563',marginTop:4}}>تنفيذ وتطوير: أحمد بن زيد | إدارة: خبراء الرحلات</div>
    </div>
  </div>
)
  if (mode === 'welcome') return (
    <div style={{
      fontFamily: "'Tajawal', sans-serif", direction: 'rtl',
      minHeight: '100vh', background: CREAM,
      display: 'flex', flexDirection: 'column',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />

      {/* خلفية زخرفية */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse at 20% 20%, #FFF0E6 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 80%, #FFE8D5 0%, transparent 50%)`,
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* شعار */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(145deg, ${O}, ${D})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 8px 32px ${O}40`,
            fontSize: 30, color: 'white', fontWeight: 900,
          }}>ب</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1A1208', letterSpacing: '-0.5px' }}>بكجات</div>
          <div style={{ fontSize: 14, color: '#8A7A6A', marginTop: 6, fontWeight: 400 }}>منصة العروض السياحية التنافسية</div>
        </div>

        {/* اختيار النوع */}
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1208', textAlign: 'center', marginBottom: 20 }}>
            كيف تريد تستخدم بكجات؟
          </div>

          {[
            { id: 'traveler', icon: '🧳', title: 'مسافر', sub: 'أبحث عن رحلة وأريد عروض تنافسية' },
            { id: 'company', icon: '🏢', title: 'شركة سياحية', sub: 'أقدم خدمات سياحية وأريد عملاء جدد' },
          ].map(item => (
            <div key={item.id} onClick={() => { setRole(item.id); setMode('login') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'white', borderRadius: 18,
                border: '1.5px solid #EDE5DC',
                padding: '18px 20px', marginBottom: 12, cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(242,101,34,0.06)',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = O; e.currentTarget.style.boxShadow = `0 4px 20px ${O}20` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE5DC'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(242,101,34,0.06)' }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 15, flexShrink: 0,
                background: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1208' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#8A7A6A', marginTop: 2 }}>{item.sub}</div>
              </div>
              <div style={{ color: '#C8B8A8', fontSize: 18 }}>‹</div>
            </div>
          ))}

          <div style={{ textAlign: 'center', fontSize: 12, color: '#B8A898', marginTop: 16 }}>
            بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية
          </div>
        </div>
      </div>
    </div>
  )

  // شاشة الدخول / التسجيل
  return (
    <div style={{
      fontFamily: "'Tajawal', sans-serif", direction: 'rtl',
      minHeight: '100vh', background: CREAM,
      display: 'flex', flexDirection: 'column',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse at 20% 20%, #FFF0E6 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 80%, #FFE8D5 0%, transparent 50%)`,
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* Back */}
        <button onClick={() => { setMode('welcome'); setError(''); setSuccess('') }} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'white', border: '1.5px solid #EDE5DC', borderRadius: 12,
          padding: '8px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          color: '#6A5A4A', cursor: 'pointer',
        }}>← رجوع</button>

        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: `linear-gradient(145deg, ${O}, ${D})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: 26,
              boxShadow: `0 6px 24px ${O}35`,
            }}>{role === 'traveler' ? '🧳' : '🏢'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#1A1208' }}>
              {mode === 'login' ? 'مرحباً بعودتك' : role === 'traveler' ? 'حساب مسافر جديد' : 'حساب شركة جديد'}
            </div>
            <div style={{ fontSize: 13, color: '#8A7A6A', marginTop: 6 }}>
              {mode === 'login' ? 'سجّل دخولك للمتابعة' : 'أنشئ حسابك مجاناً'}
            </div>
          </div>

          {/* Form Card */}
          <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 32px rgba(0,0,0,0.06)', border: '1px solid #EDE5DC' }}>

            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#8A7A6A', fontWeight: 600, marginBottom: 6 }}>
                  {role === 'traveler' ? 'اسمك الكامل' : 'اسم الشركة'}
                </div>
                <input
                  placeholder={role === 'traveler' ? 'محمد أحمد' : 'شركة رحلات النخيل'}
                  value={name} onChange={e => setName(e.target.value)}
                  style={inp(false)}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#8A7A6A', fontWeight: 600, marginBottom: 6 }}>البريد الإلكتروني</div>
              <input
                type="email" placeholder="example@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ ...inp(false), direction: 'ltr', textAlign: 'right' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#8A7A6A', fontWeight: 600, marginBottom: 6 }}>كلمة السر</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ ...inp(false), paddingLeft: 40 }}
                />
                <button onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A7A6A',
                }}>{showPass ? '🙈' : '👁'}</button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 14, textAlign: 'center' }}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16A34A', marginBottom: 14, textAlign: 'center' }}>
                {success}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '14px',
              borderRadius: 14, border: 'none',
              background: loading ? '#D4C4B8' : `linear-gradient(135deg, ${O}, ${D})`,
              color: 'white', fontFamily: 'inherit',
              fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : `0 6px 24px ${O}40`,
              transition: 'all .2s',
              letterSpacing: '0.3px',
            }}>
              {loading ? '⏳ جاري...' : mode === 'login' ? 'تسجيل الدخول ←' : 'إنشاء الحساب ←'}
            </button>
          </div>

          {/* Switch mode */}
          <div style={{ textAlign: 'center', fontSize: 13, color: '#8A7A6A', marginTop: 20 }}>
            {mode === 'login' ? 'مستخدم جديد؟ ' : 'عندك حساب؟ '}
            <span onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              style={{ color: O, fontWeight: 700, cursor: 'pointer' }}>
              {mode === 'login' ? 'أنشئ حساباً مجاناً' : 'سجّل دخول'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}