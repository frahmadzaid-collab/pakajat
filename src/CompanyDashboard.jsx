import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const C = {
  orange: "#F26522", dark: "#D4521A",
  light: "#FFF4EE", white: "#FFFFFF",
  ink: "#111827", gray: "#6B7280",
  muted: "#F3F4F6", border: "#E5E7EB",
  green: "#16A34A", greenBg: "#F0FDF4",
}

export default function CompanyDashboard() {
  const [page, setPage] = useState('requests')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('trip_requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const tabs = [
    { id: 'requests', icon: '📬', label: 'الطلبات' },
    { id: 'offers', icon: '📤', label: 'عروضي' },
    { id: 'profile', icon: '🏢', label: 'شركتي' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} body{font-family:'Tajawal',sans-serif;}`}</style>
      <div style={{direction:'rtl',background:'#F3F4F6',minHeight:'100vh',fontFamily:'Tajawal,sans-serif'}}>
        
        {/* Header */}
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:50}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,borderRadius:11,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',color:C.white,fontWeight:900,fontSize:17}}>ب</div>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:C.ink}}>بكجات — الشركات</div>
              <div style={{fontSize:10,color:C.gray}}>لوحة تحكم الشركة</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA',borderRadius:8,padding:'7px 14px',fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            خروج 🚪
          </button>
        </div>

        {/* Content */}
        <div style={{padding:'20px 16px 80px',maxWidth:700,margin:'0 auto'}}>
          
          {page === 'requests' && (
            <>
              <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>📬 الطلبات الجديدة</div>
              <div style={{fontSize:13,color:C.gray,marginBottom:16}}>طلبات المسافرين المفتوحة — كن الأول للرد</div>
              
              {loading && <div style={{textAlign:'center',padding:40,color:C.gray}}>جاري التحميل...</div>}
              
              {!loading && requests.length === 0 && (
                <div style={{textAlign:'center',padding:40,background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:32,marginBottom:8}}>📭</div>
                  <div style={{fontSize:15,color:C.gray}}>لا توجد طلبات حالياً</div>
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {requests.map((r) => (
                  <div key={r.id} style={{background:C.white,borderRadius:16,padding:'16px',border:`1.5px solid ${C.border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:700,color:C.ink,marginBottom:4}}>🌍 {r.destination}</div>
                        <div style={{fontSize:12,color:C.gray}}>👥 {r.travelers} مسافرين</div>
                        <div style={{fontSize:11,color:C.gray,marginTop:2}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                      <span style={{background:C.greenBg,color:C.green,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700}}>مفتوح</span>
                    </div>
                    {r.notes && <div style={{fontSize:13,color:C.gray,background:C.muted,borderRadius:8,padding:'8px 12px',marginBottom:10}}>{r.notes}</div>}
                    {r.ai_translation && (
                      <div style={{fontSize:12,color:C.ink,background:'#FFF4EE',border:`1px solid ${C.orange}33`,borderRadius:8,padding:'8px 12px',marginBottom:10,direction:'ltr',textAlign:'left'}}>
                        <div style={{fontSize:10,color:C.orange,marginBottom:4,direction:'rtl',textAlign:'right'}}>🤖 ترجمة AI</div>
                        {r.ai_translation}
                      </div>
                    )}
                    <button style={{width:'100%',background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:'none',borderRadius:10,padding:'11px',fontFamily:'inherit',fontWeight:700,fontSize:14,cursor:'pointer'}}>
                      إرسال عرض ←
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === 'offers' && (
            <div style={{textAlign:'center',padding:60,color:C.gray}}>
              <div style={{fontSize:32,marginBottom:8}}>📤</div>
              <div style={{fontSize:15}}>لم ترسل أي عروض بعد</div>
            </div>
          )}

          {page === 'profile' && (
            <div style={{background:C.white,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{width:64,height:64,borderRadius:'50%',background:`linear-gradient(135deg,${C.orange},${C.dark})`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:28,color:C.white}}>🏢</div>
                <div style={{fontSize:18,fontWeight:800,color:C.ink}}>شركتي السياحية</div>
              </div>
              <button onClick={handleLogout} style={{width:'100%',background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA',borderRadius:10,padding:'12px',fontFamily:'inherit',fontWeight:700,fontSize:14,cursor:'pointer'}}>
                🚪 تسجيل الخروج
              </button>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{position:'fixed',bottom:0,right:0,left:0,background:C.white,borderTop:`1px solid ${C.border}`,display:'flex',padding:'6px 0 8px'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setPage(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:'4px 0'}}>
              <span style={{fontSize:22,opacity:page===t.id?1:0.5}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:page===t.id?700:400,color:page===t.id?C.orange:C.gray}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}