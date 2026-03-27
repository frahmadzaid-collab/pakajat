import { useState } from 'react'
import { supabase } from '../supabase'

const O = '#F26522', D = '#D4521A'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inp = {
    width:'100%', border:'1.5px solid #E5E7EB', borderRadius:10,
    padding:'12px 14px', fontFamily:'inherit', fontSize:15,
    outline:'none', marginBottom:12, direction:'rtl',
    boxSizing:'border-box',
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (error) setError(error.message)
      else setSuccess('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('البريد أو كلمة السر غير صحيحة')
    }
    setLoading(false)
  }

  return (
    <div style={{fontFamily:"'Tajawal',sans-serif",direction:'rtl',minHeight:'100vh',
      background:`linear-gradient(135deg,${O},${D})`,display:'flex',
      alignItems:'center',justifyContent:'center',padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:'white',borderRadius:20,padding:32,width:'100%',maxWidth:380,
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${O},${D})`,
            display:'flex',alignItems:'center',justifyContent:'center',
            margin:'0 auto 12px',fontSize:24,color:'white',fontWeight:900}}>ب</div>
          <div style={{fontSize:22,fontWeight:900,color:'#111827'}}>بكجات</div>
          <div style={{fontSize:13,color:'#6B7280',marginTop:4}}>
            {mode==='login'?'مرحباً بعودتك 👋':'أنشئ حسابك الآن ✈️'}
          </div>
        </div>

        {mode==='register' && (
          <input placeholder="الاسم الكامل" value={name}
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