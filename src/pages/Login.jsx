import { useState } from 'react'
import { supabase } from '../supabase'

const O = '#F26522', D = '#D4521A'

const inp = {
  width:'100%', border:'1.5px solid #E5E7EB', borderRadius:10,
  padding:'12px 14px', fontFamily:'inherit', fontSize:15,
  outline:'none', marginBottom:12, direction:'rtl',
  boxSizing:'border-box',
}

export default function Login() {
  const [mode, setMode] = useState('welcome') // welcome | login | register
  const [role, setRole] = useState('') // traveler | company
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setLoading(true); setError('')
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, role: role } }
      })
      if (error) setError(error.message)
      else setSuccess('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('البريد أو كلمة السر غير صحيحة')
    }
    setLoading(false)
  }

  // شاشة الترحيب — اختيار نوع الحساب
  if (mode === 'welcome') return (
    <div style={{fontFamily:"'Tajawal',sans-serif",direction:'rtl',minHeight:'100vh',
      background:`linear-gradient(135deg,${O},${D})`,display:'flex',
      alignItems:'center',justifyContent:'center',padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:'white',borderRadius:24,padding:32,width:'100%',maxWidth:380,
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:60,height:60,borderRadius:16,background:`linear-gradient(135deg,${O},${D})`,
            display:'flex',alignItems:'center',justifyContent:'center',
            margin:'0 auto 12px',fontSize:28,color:'white',fontWeight:900}}>ب</div>
          <div style={{fontSize:24,fontWeight:900,color:'#111827'}}>بكجات</div>
          <div style={{fontSize:13,color:'#6B7280',marginTop:4}}>منصة العروض السياحية</div>
        </div>

        <div style={{fontSize:15,fontWeight:700,color:'#111827',textAlign:'center',marginBottom:16}}>
          كيف تريد تستخدم بكجات؟
        </div>

        {/* خيار المسافر */}
        <div onClick={()=>{setRole('traveler');setMode('login')}} style={{
          border:'1.5px solid #E5E7EB',borderRadius:14,padding:'16px',
          marginBottom:10,cursor:'pointer',transition:'all .15s',
          display:'flex',alignItems:'center',gap:14,
        }}
        onMouseEnter={e=>e.currentTarget.style.borderColor=O}
        onMouseLeave={e=>e.currentTarget.style.borderColor='#E5E7EB'}>
          <div style={{width:48,height:48,borderRadius:12,background:'#FFF4EE',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>🧳</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#111827'}}>مسافر</div>
            <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>أبحث عن رحلة وأريد عروض من شركات السياحة</div>
          </div>
        </div>

        {/* خيار الشركة */}
        <div onClick={()=>{setRole('company');setMode('login')}} style={{
          border:'1.5px solid #E5E7EB',borderRadius:14,padding:'16px',
          marginBottom:20,cursor:'pointer',transition:'all .15s',
          display:'flex',alignItems:'center',gap:14,
        }}
        onMouseEnter={e=>e.currentTarget.style.borderColor=O}
        onMouseLeave={e=>e.currentTarget.style.borderColor='#E5E7EB'}>
          <div style={{width:48,height:48,borderRadius:12,background:'#FFF4EE',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>🏢</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#111827'}}>شركة سياحية</div>
            <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>أقدم عروض سياحية وأريد استقبال طلبات العملاء</div>
          </div>
        </div>

        <div style={{textAlign:'center',fontSize:12,color:'#6B7280'}}>
          بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية
        </div>
      </div>
    </div>
  )

  // شاشة تسجيل الدخول / إنشاء حساب
  return (
    <div style={{fontFamily:"'Tajawal',sans-serif",direction:'rtl',minHeight:'100vh',
      background:`linear-gradient(135deg,${O},${D})`,display:'flex',
      alignItems:'center',justifyContent:'center',padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:'white',borderRadius:24,padding:32,width:'100%',maxWidth:380,
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>

        {/* زر الرجوع */}
        <button onClick={()=>setMode('welcome')} style={{
          background:'none',border:'none',color:O,fontFamily:'inherit',
          fontSize:13,fontWeight:700,cursor:'pointer',marginBottom:16,
          display:'flex',alignItems:'center',gap:4
        }}>← رجوع</button>

        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:28,marginBottom:8}}>{role==='traveler'?'🧳':'🏢'}</div>
          <div style={{fontSize:20,fontWeight:900,color:'#111827'}}>
            {role==='traveler'?'حساب المسافر':'حساب الشركة'}
          </div>
          <div style={{fontSize:13,color:'#6B7280',marginTop:4}}>
            {mode==='login'?'مرحباً بعودتك 👋':'أنشئ حسابك الآن ✈️'}
          </div>
        </div>

        {mode==='register' && (
          <input placeholder={role==='traveler'?'اسمك الكامل':'اسم الشركة'} value={name}
            onChange={e=>setName(e.target.value)} style={inp}/>
        )}
        <input type="email" placeholder="البريد الإلكتروني" value={email}
          onChange={e=>setEmail(e.target.value)} style={inp}/>
        <input type="password" placeholder="كلمة السر" value={password}
          onChange={e=>setPassword(e.target.value)} style={inp}/>

        {error && <div style={{color:'#DC2626',fontSize:13,marginBottom:10,textAlign:'center'}}>❌ {error}</div>}
        {success && <div style={{color:'#16A34A',fontSize:13,marginBottom:10,textAlign:'center'}}>✅ {success}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%',padding:'13px',borderRadius:12,border:'none',
          background:`linear-gradient(135deg,${O},${D})`,color:'white',
          fontFamily:'inherit',fontWeight:700,fontSize:16,cursor:'pointer',
          boxShadow:'0 6px 20px rgba(242,101,34,.35)',marginBottom:12
        }}>
          {loading?'جاري...':mode==='login'?'تسجيل الدخول':'إنشاء حساب'}
        </button>

        <div style={{textAlign:'center',fontSize:13,color:'#6B7280'}}>
          {mode==='login'?'مستخدم جديد؟ ':'عندك حساب؟ '}
          <span onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setSuccess('')}}
            style={{color:O,fontWeight:700,cursor:'pointer'}}>
            {mode==='login'?'أنشئ حساباً':'سجّل دخول'}
          </span>
        </div>
      </div>
    </div>
  )
}