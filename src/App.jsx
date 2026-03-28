import { useState } from "react";
import { useEffect } from "react"
import { supabase } from "./supabase"
import Login from "./pages/Login"
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
  const offers=[
    {co:"رحلات النخيل",dest:"إسطنبول ٧ أيام",price:"٤,٢٠٠",rating:"4.9",badge:"الأفضل سعراً",hot:true},
    {co:"السفر الذهبي",dest:"ماليزيا ١٠ أيام",price:"٣,٨٠٠",rating:"4.7",badge:"موصى به",hot:false},
  ];
  return(
    <div>
      <div style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,padding:"28px 20px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:4}}>مرحباً بك في بكجات 👋</div>
          <div style={{fontSize:26,fontWeight:900,color:C.white,lineHeight:1.2,marginBottom:8}}>احصل على أفضل<br/>عرض لرحلتك</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:20}}>اختر خدماتك والشركات تتنافس عليك</div>
          <button onClick={()=>setPage("request")} style={{background:C.white,color:C.orange,borderRadius:14,padding:"13px 28px",fontFamily:"inherit",fontWeight:800,fontSize:15,border:"none",cursor:"pointer"}}>
            ابدأ طلب رحلة ←
          </button>
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,margin:"16px 0"}}>
          {[["✈️","١٢","رحلة"],["💬","٤","عروض"],["⭐","١٨٪","توفير"]].map(([i,v,l])=>(
            <div key={l} style={{background:C.white,borderRadius:14,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:20}}>{i}</div>
              <div style={{fontSize:20,fontWeight:800,color:C.ink}}>{v}</div>
              <div style={{fontSize:10,color:C.gray}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:16,fontWeight:800,color:C.ink,marginBottom:10}}>العروض الواردة 🔥</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:24}}>
          {offers.map((o,i)=>(
            <div key={i} style={{background:C.white,borderRadius:16,padding:"15px 16px",border:`1.5px solid ${o.hot?C.orange:C.border}`,boxShadow:o.hot?`0 0 0 3px ${C.orange}12`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <span style={{fontSize:15,fontWeight:700,color:C.ink}}>{o.co}</span>
                    <span style={{background:o.hot?C.orange:C.light,color:o.hot?C.white:C.orange,borderRadius:20,padding:"1px 9px",fontSize:10,fontWeight:700}}>{o.badge}</span>
                  </div>
                  <div style={{fontSize:13,color:C.gray}}>{o.dest}</div>
                  <div style={{fontSize:12,color:C.gray}}>⭐ {o.rating}</div>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:22,fontWeight:900,color:C.orange}}>{o.price}</div>
                  <div style={{fontSize:11,color:C.gray}}>ريال</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"10px",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>✓ قبول</button>
                <button style={{background:C.muted,color:C.gray,border:"none",borderRadius:10,padding:"10px",fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>التفاصيل</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── REQUEST ───────────────────────────────────────────────────────
const Request = ({setPage})=>{
  const [step,setStep]=useState(1);
  const [dest,setDest]=useState("");
  const [travelers,setTravelers]=useState(2);
  const [notes,setNotes]=useState("");
  const [svcs,setSvcs]=useState({flight:false,visa:false,arrival:false,arrVip:false,departure:false,depVip:false,car:false,carPeriod:"يوم كامل",hotel:false,sim:false,simQty:2,tickets:false,program:false});
  const [flt,setFlt]=useState({from:"",to:"",depart:"",ret:""});
  const [hotels,setHotels]=useState([{stars:4,name:"",city:""}]);
  const [attractions,setAttractions]=useState([]);
  const [aiState,setAiState]=useState("idle");
  const [aiResult,setAiResult]=useState("");
  const [done,setDone]=useState(false);

  const s=(k,v)=>setSvcs(p=>({...p,[k]:v}));
  const activeCnt=["flight","visa","arrival","departure","car","hotel","sim","tickets","program"].filter(k=>svcs[k]).length;

  const attrMap={"إسطنبول":["آيا صوفيا","القصر العثماني","البازار الكبير","برج غلطة","البوسفور"],"باريس":["برج إيفل","متحف اللوفر","قوس النصر","قصر فيرساي"],"ماليزيا":["برجا بتروناس","جزيرة لنكاوي","كاميرون هايلاند"],"دبي":["برج خليفة","دبي مول","نخلة جميرا","صحراء دبي"]};
  const destAttrs=attrMap[dest]||["حدد الوجهة أولاً"];

  const buildSummary=()=>{
    const p=[];
    p.push(`الوجهة: ${dest}`);
    p.push(`المسافرون: ${travelers}`);
    if(svcs.flight) p.push(`طيران: ${flt.from} ← ${flt.to}، ذهاب ${flt.depart}، عودة ${flt.ret}`);
    if(svcs.visa) p.push("تأشيرة سياحية");
    if(svcs.arrival) p.push(`استقبال مطار${svcs.arrVip?" VIP":""}`);
    if(svcs.departure) p.push(`توديع مطار${svcs.depVip?" VIP":""}`);
    if(svcs.car) p.push(`سيارة بسائق (${svcs.carPeriod})`);
    if(svcs.hotel) p.push(`فنادق: ${hotels.map(h=>`${h.city||dest} ${h.stars}★${h.name?` (${h.name})`:""}`).join(" | ")}`);
    if(svcs.sim) p.push(`شرائح جوال: ${svcs.simQty}`);
    if(svcs.tickets) p.push(`تذاكر: ${attractions.join("، ")||"حسب المدينة"}`);
    if(svcs.program) p.push("تصميم برنامج سياحي يومي");
    if(notes) p.push(`ملاحظات: ${notes}`);
    return p.join("\n");
  };

  const handleAI=async()=>{
    setAiState("loading"); setAiResult("");
    const [,langEn]=detectLang(dest);
    try{
      await callClaude(
        `You are a professional travel request translator. Translate the Arabic travel request to ${langEn} professionally for local tourism companies. Respond ONLY with the translation.`,
        buildSummary(),(chunk)=>setAiResult(chunk)
      );
      setAiState("done"); setDone(true);
    }catch{ setAiState("error"); }
  };

  const Progress=()=>(
    <div style={{display:"flex",gap:6,padding:"14px 20px 0"}}>
      {[1,2,3].map(n=>(
        <div key={n} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
          <div style={{width:"100%",height:5,borderRadius:3,background:step>=n?C.orange:C.border,transition:"background .3s"}}/>
          <div style={{fontSize:10,color:step>=n?C.orange:C.gray,fontWeight:step===n?700:400}}>
            {["الوجهة","الخدمات","الإرسال"][n-1]}
          </div>
        </div>
      ))}
    </div>
  );

  return(
    <div>
      <Progress/>
      {step===1&&(
        <div style={{padding:"16px 20px 24px"}}>
          <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>وجهتك ✈️</div>
          <div style={{fontSize:13,color:C.gray,marginBottom:20}}>حدد الوجهة وعدد المسافرين</div>
          <Label>الوجهة السياحية</Label>
          <Field placeholder="مثال: إسطنبول، باريس، ماليزيا..." value={dest} onChange={setDest} icon="🌍"/>
          <div style={{height:16}}/>
          <div style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:C.ink}}>عدد المسافرين</div>
                <div style={{fontSize:12,color:C.gray,marginTop:2}}>بالغون وأطفال</div>
              </div>
              <Stepper value={travelers} onChange={setTravelers}/>
            </div>
          </div>
          <div style={{height:24}}/>
          <button onClick={()=>setStep(2)} disabled={!dest.trim()} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:800,fontSize:16,cursor:dest.trim()?"pointer":"not-allowed",background:dest.trim()?`linear-gradient(135deg,${C.orange},${C.dark})`:C.border,color:dest.trim()?C.white:C.gray,boxShadow:dest.trim()?"0 6px 20px rgba(242,101,34,0.35)":"none"}}>
            اختر الخدمات ←
          </button>
        </div>
      )}

      {step===2&&(
        <div>
          <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:C.orange,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:"16px 20px 8px"}}>← رجوع</button>
          <div style={{padding:"0 20px 8px"}}>
            <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:2}}>اختر الخدمات 🛎️</div>
            <div style={{fontSize:13,color:C.gray}}>{dest} · {travelers} مسافر{activeCnt>0&&<span style={{color:C.orange,fontWeight:700}}> · {activeCnt} خدمات</span>}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,padding:"14px 20px 24px"}}>
            <SvcCard icon="✈️" title="طيران دولي" sub="حجز تذاكر ذهاب وإياب" active={svcs.flight} onToggle={()=>s("flight",!svcs.flight)} color={C.blue} bg={C.blueBg}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><Label>مدينة الإقلاع</Label><Field placeholder="الرياض" value={flt.from} onChange={v=>setFlt(f=>({...f,from:v}))} icon="🛫"/></div>
                <div><Label>مدينة الوصول</Label><Field placeholder={dest} value={flt.to} onChange={v=>setFlt(f=>({...f,to:v}))} icon="🛬"/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><Label>تاريخ الذهاب</Label><Field type="date" value={flt.depart} onChange={v=>setFlt(f=>({...f,depart:v}))}/></div>
                <div><Label>تاريخ العودة</Label><Field type="date" value={flt.ret} onChange={v=>setFlt(f=>({...f,ret:v}))}/></div>
              </div>
            </SvcCard>

            <SvcCard icon="📄" title="تأشيرة سياحية" sub="متطلبات ورسوم التأشيرة" active={svcs.visa} onToggle={()=>s("visa",!svcs.visa)} color={C.purple} bg={C.purpleBg}>
              <div style={{background:C.purpleBg,borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.purple}}>متطلبات تأشيرة {dest}</div>
                  <div style={{fontSize:12,color:C.gray,marginTop:2}}>اطلع على الوثائق المطلوبة</div>
                </div>
                <a href="https://www.mofa.gov.sa" target="_blank" rel="noopener" style={{background:C.purple,color:C.white,borderRadius:9,padding:"7px 13px",fontSize:12,fontWeight:700,textDecoration:"none"}}>الرابط ↗</a>
              </div>
            </SvcCard>

            <SvcCard icon="🚖" title="استقبال في المطار" sub="خدمة استقبال عند الوصول" active={svcs.arrival} onToggle={()=>s("arrival",!svcs.arrival)} color={C.red} bg={C.redBg}>
              <div style={{background:svcs.arrVip?C.redBg:C.muted,border:`1.5px solid ${svcs.arrVip?C.red:C.border}`,borderRadius:12,padding:"12px 14px"}}>
                <Toggle value={svcs.arrVip} onChange={v=>s("arrVip",v)} label="⭐ ترقية VIP" sub="لوحة استقبال · عربة كبار الشخصيات"/>
              </div>
            </SvcCard>

            <SvcCard icon="🛫" title="توديع إلى المطار" sub="خدمة توديع عند المغادرة" active={svcs.departure} onToggle={()=>s("departure",!svcs.departure)} color={C.red} bg={C.redBg}>
              <div style={{background:svcs.depVip?C.redBg:C.muted,border:`1.5px solid ${svcs.depVip?C.red:C.border}`,borderRadius:12,padding:"12px 14px"}}>
                <Toggle value={svcs.depVip} onChange={v=>s("depVip",v)} label="⭐ ترقية VIP" sub="مرافق شخصي · خدمة الأمتعة"/>
              </div>
            </SvcCard>

            <SvcCard icon="🚗" title="سيارة بسائق" sub="نقل خاص داخل الوجهة" active={svcs.car} onToggle={()=>s("car",!svcs.car)} color={C.green} bg={C.greenBg}>
              <Label>الفترة المطلوبة</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {["نصف يوم","يوم كامل","٣ أيام","أسبوع","طوال الرحلة"].map(p=>(
                  <Chip key={p} label={p} active={svcs.carPeriod===p} onClick={()=>s("carPeriod",p)} color={C.green} bg={C.greenBg}/>
                ))}
              </div>
            </SvcCard>

            <SvcCard icon="🏨" title="فنادق" sub="اختر التصنيف وأضف أكثر من فندق" active={svcs.hotel} onToggle={()=>s("hotel",!svcs.hotel)}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {hotels.map((h,i)=>(
                  <div key={i} style={{background:"#FAFAFA",borderRadius:12,padding:"13px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.ink}}>فندق {i+1}</div>
                      {i>0&&<button onClick={()=>setHotels(hs=>hs.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>✕ حذف</button>}
                    </div>
                    <Label>المدينة</Label>
                    <Field placeholder={dest} value={h.city} onChange={v=>setHotels(hs=>hs.map((x,j)=>j===i?{...x,city:v}:x))} icon="📍"/>
                    <div style={{height:10}}/>
                    <Label>تصنيف النجوم</Label>
                    <Stars value={h.stars} onChange={v=>setHotels(hs=>hs.map((x,j)=>j===i?{...x,stars:v}:x))}/>
                    <div style={{height:10}}/>
                    <Label>اسم فندق مقترح (اختياري)</Label>
                    <Field placeholder="Hilton، Marriott..." value={h.name} onChange={v=>setHotels(hs=>hs.map((x,j)=>j===i?{...x,name:v}:x))} icon="🏨"/>
                  </div>
                ))}
                <button onClick={()=>setHotels(hs=>[...hs,{stars:4,name:"",city:""}])} style={{border:`1.5px dashed ${C.orange}`,background:C.light,borderRadius:12,padding:"11px",fontFamily:"inherit",fontSize:13,fontWeight:700,color:C.orange,cursor:"pointer"}}>
                  + إضافة فندق في مدينة أخرى
                </button>
              </div>
            </SvcCard>

            <SvcCard icon="📱" title="شرائح جوال" sub="شرائح إنترنت دولية" active={svcs.sim} onToggle={()=>s("sim",!svcs.sim)} color={C.green} bg={C.greenBg}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.ink}}>عدد الشرائح</div>
                  <div style={{fontSize:12,color:C.gray,marginTop:2}}>إنترنت غير محدود</div>
                </div>
                <Stepper value={svcs.simQty} onChange={v=>s("simQty",v)} min={1} max={10}/>
              </div>
            </SvcCard>

            <SvcCard icon="🎟️" title="تذاكر سياحية" sub="حجز المعالم والأماكن" active={svcs.tickets} onToggle={()=>s("tickets",!svcs.tickets)} color={C.amber} bg={C.amberBg}>
              <Label>الأماكن في {dest||"..."}</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {destAttrs.map(a=>(
                  <Chip key={a} label={a} active={attractions.includes(a)} onClick={()=>setAttractions(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a])} color={C.amber} bg={C.amberBg}/>
                ))}
              </div>
            </SvcCard>

            <SvcCard icon="📋" title="تصميم البرنامج السياحي اليومي" sub="جدول يومي مفصّل لرحلتك" active={svcs.program} onToggle={()=>s("program",!svcs.program)}>
              {svcs.program&&<div style={{background:C.light,borderRadius:10,padding:"11px 13px",fontSize:13,color:C.ink}}>🤖 سيصمم الذكاء الاصطناعي برنامجاً يومياً مخصصاً</div>}
            </SvcCard>
          </div>
          {activeCnt>0&&(
            <div style={{padding:"0 20px 24px"}}>
              <button onClick={()=>setStep(3)} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:800,fontSize:16,cursor:"pointer",background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,boxShadow:"0 6px 20px rgba(242,101,34,0.35)"}}>
                متابعة — {activeCnt} خدمات ←
              </button>
            </div>
          )}
        </div>
      )}

      {step===3&&(
        <div>
          <button onClick={()=>setStep(2)} style={{background:"none",border:"none",color:C.orange,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:"16px 20px 8px"}}>← رجوع</button>
          <div style={{padding:"0 20px 24px"}}>
            <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:2}}>ملاحظات إضافية 💬</div>
            <div style={{fontSize:13,color:C.gray,marginBottom:16}}>{dest} · {travelers} مسافر · {activeCnt} خدمات</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:18}}>
              {svcs.flight&&<Chip label="✈️ طيران" active color={C.blue} bg={C.blueBg}/>}
              {svcs.visa&&<Chip label="📄 تأشيرة" active color={C.purple} bg={C.purpleBg}/>}
              {svcs.arrival&&<Chip label={`🚖 استقبال${svcs.arrVip?" VIP":""}`} active color={C.red} bg={C.redBg}/>}
              {svcs.departure&&<Chip label={`🛫 توديع${svcs.depVip?" VIP":""}`} active color={C.red} bg={C.redBg}/>}
              {svcs.car&&<Chip label={`🚗 سيارة · ${svcs.carPeriod}`} active color={C.green} bg={C.greenBg}/>}
              {svcs.hotel&&<Chip label={`🏨 ${hotels.length} فندق`} active/>}
              {svcs.sim&&<Chip label={`📱 ${svcs.simQty} شرائح`} active color={C.green} bg={C.greenBg}/>}
              {svcs.tickets&&<Chip label="🎟️ تذاكر" active color={C.amber} bg={C.amberBg}/>}
              {svcs.program&&<Chip label="📋 برنامج يومي" active/>}
            </div>
            <Label>ملاحظات إضافية (اختياري)</Label>
            <textarea placeholder="مثال: وجبات حلال، غرفة ذوي احتياجات خاصة، معنا طفل عمره سنتان..." value={notes} onChange={e=>setNotes(e.target.value)} rows={4}
              style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontFamily:"inherit",fontSize:14,color:C.ink,outline:"none",resize:"none",direction:"rtl",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=C.orange} onBlur={e=>e.target.style.borderColor=C.border}
            />
            <div style={{height:16}}/>
            <div style={{background:C.light,border:`1px solid ${C.orange}33`,borderRadius:14,padding:"14px 16px",marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:C.orange,marginBottom:8}}>🤖 ماذا سيفعل الذكاء الاصطناعي؟</div>
              {["ترجمة طلبك للغة المحلية للشركات","تنسيق جميع خدماتك احترافياً","إرساله لجميع الشركات المسجلة"].map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:6}}>
                  <span style={{color:C.green,fontWeight:700}}>✓</span>
                  <span style={{fontSize:13,color:C.ink}}>{t}</span>
                </div>
              ))}
            </div>
            {!done?(
              <button onClick={handleAI} disabled={aiState==="loading"} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:800,fontSize:16,cursor:aiState==="loading"?"not-allowed":"pointer",background:aiState==="loading"?C.gray:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,boxShadow:"0 6px 20px rgba(242,101,34,0.35)"}}>
                {aiState==="loading"?"⏳ يترجم ويرسل...":"🚀 إرسال الطلب للشركات"}
              </button>
            ):(
              <div style={{background:C.greenBg,border:`1.5px solid ${C.green}`,borderRadius:16,padding:"20px",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:36,marginBottom:8}}>✅</div>
                <div style={{fontSize:18,fontWeight:800,color:C.green,marginBottom:4}}>تم إرسال طلبك!</div>
                <div style={{fontSize:13,color:C.gray}}>ستصلك العروض خلال ٢٤ ساعة</div>
                <button onClick={()=>setPage("offers")} style={{marginTop:14,background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"10px 24px",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  متابعة العروض ←
                </button>
              </div>
            )}
            {aiResult&&(
              <div style={{marginTop:14,background:C.white,borderRadius:14,padding:"15px 16px",border:`1.5px solid ${C.orange}44`}}>
                <div style={{fontSize:12,color:C.orange,fontWeight:700,marginBottom:8}}>🤖 الترجمة المُرسلة للشركات</div>
                <div style={{fontSize:13,color:C.ink,lineHeight:1.75,direction:"ltr",textAlign:"left",fontFamily:"Georgia,serif",whiteSpace:"pre-wrap"}}>{aiResult}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── OFFERS ────────────────────────────────────────────────────────
const Offers = ()=>{
  const offers=[
    {co:"رحلات النخيل",dest:"إسطنبول ٧ أيام",price:"٤,٢٠٠",rating:"4.9",badge:"الأفضل سعراً",svcs:["✈️","🏨","🚖","🎟️"],hot:true},
    {co:"السفر الذهبي",dest:"إسطنبول ٧ أيام",price:"٤,٨٠٠",rating:"4.7",badge:"موصى به",svcs:["✈️","🏨","📱"],hot:false},
    {co:"أجنحة العرب",dest:"إسطنبول VIP",price:"٥,١٠٠",rating:"4.8",badge:"الأشمل",svcs:["✈️","🏨","🚖 VIP","🎟️","📋"],hot:false},
  ];
  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:4}}>العروض الواردة 💬</div>
      <div style={{fontSize:13,color:C.gray,marginBottom:14}}>٣ عروض على طلبك</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {offers.map((o,i)=>(
          <div key={i} style={{background:C.white,borderRadius:16,padding:"16px",border:`1.5px solid ${o.hot?C.orange:C.border}`,boxShadow:o.hot?`0 0 0 3px ${C.orange}12`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                  <span style={{fontSize:16,fontWeight:700,color:C.ink}}>{o.co}</span>
                  <span style={{background:o.hot?C.orange:C.light,color:o.hot?C.white:C.orange,borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>{o.badge}</span>
                </div>
                <div style={{fontSize:13,color:C.gray}}>{o.dest}</div>
                <div style={{fontSize:12,color:C.gray}}>⭐ {o.rating}</div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:24,fontWeight:900,color:C.orange}}>{o.price}</div>
                <div style={{fontSize:11,color:C.gray}}>ريال / شخص</div>
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
              {o.svcs.map(sv=><span key={sv} style={{background:C.muted,borderRadius:8,padding:"3px 9px",fontSize:12}}>{sv}</span>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
              <button style={{background:`linear-gradient(135deg,${C.orange},${C.dark})`,color:C.white,border:"none",borderRadius:10,padding:"11px",fontFamily:"inherit",fontWeight:700,fontSize:14,cursor:"pointer"}}>✓ قبول العرض</button>
              <button style={{background:C.muted,color:C.gray,border:"none",borderRadius:10,padding:"11px",fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>التفاصيل</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TRIPS ─────────────────────────────────────────────────────────
const Trips = ()=>{
  const trips=[
    {dest:"إسطنبول",date:"مارس ٢٠٢٦",price:"٤,٢٠٠",svcs:4},
    {dest:"دبي",date:"يناير ٢٠٢٦",price:"٢,٨٠٠",svcs:3},
    {dest:"ماليزيا",date:"نوفمبر ٢٠٢٥",price:"٣,٥٠٠",svcs:5},
  ];
  return(
    <div style={{padding:"16px 20px 24px"}}>
      <div style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:16}}>رحلاتي 🗺️</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {trips.map((t,i)=>(
          <div key={i} style={{background:C.white,borderRadius:16,padding:"15px 16px",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:C.ink,marginBottom:3}}>🌍 {t.dest}</div>
                <div style={{fontSize:12,color:C.gray}}>{t.date} · {t.svcs} خدمات</div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:16,fontWeight:800,color:C.orange}}>{t.price}</div>
                <div style={{background:C.greenBg,color:C.green,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,marginTop:3}}>مكتملة</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── PROFILE ───────────────────────────────────────────────────────
  const Profile = ()=>{
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }
  return(
  <div style={{padding:"16px 20px 24px"}}>
    <div style={{textAlign:"center",padding:"20px 0 24px"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${C.orange},${C.dark})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:32,color:C.white,fontWeight:800}}>م</div>
      <div style={{fontSize:20,fontWeight:800,color:C.ink}}>محمد العمري</div>
      <div style={{fontSize:14,color:C.gray,marginTop:2}}>+966 50 123 4567</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {[["✈️","رحلاتي","١٢ رحلة مكتملة"],["💬","العروض المقبولة","٨ عروض"],["🔔","الإشعارات","مفعّلة"],["🔒","الخصوصية والأمان",""],["📞","تواصل معنا","الدعم ٢٤/٧"]].map(([icon,title,sub])=>(
        <div key={title} style={{display:"flex",alignItems:"center",gap:13,background:C.white,borderRadius:13,padding:"14px 16px",border:`1px solid ${C.border}`,cursor:"pointer"}}>
          <span style={{fontSize:20}}>{icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:C.ink}}>{title}</div>
            {sub&&<div style={{fontSize:12,color:C.gray,marginTop:1}}>{sub}</div>}
          </div>
          <span style={{color:C.gray,fontSize:16}}>‹</span>
        </div>
      ))}
   </div>
    <div onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:13,background:"#FEF2F2",borderRadius:13,padding:"14px 16px",border:"1px solid #FECACA",cursor:"pointer",marginTop:8}}>
      <span style={{fontSize:20}}>🚪</span>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:"#DC2626"}}>تسجيل الخروج</div>
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
  const tabs = [
    {id:"home",icon:"🏠",label:"الرئيسية"},
    {id:"request",icon:"✈️",label:"طلب رحلة"},
    {id:"offers",icon:"💬",label:"العروض"},
    {id:"trips",icon:"🗺️",label:"رحلاتي"},
    {id:"profile",icon:"👤",label:"حسابي"},
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
          {page==="profile"&&<Profile/>}
        </div>

        <div style={{position:"fixed",bottom:0,right:0,left:0,zIndex:50,background:"#fff",borderTop:`1px solid ${C.border}`,boxShadow:"0 -4px 20px rgba(0,0,0,0.07)"}}>
          <div style={{maxWidth:430,margin:"0 auto",display:"flex",padding:"6px 0 8px"}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setPage(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:"inherit",position:"relative"}}>
                {t.id==="request"?(
                  <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${C.orange},${C.dark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginTop:-20,boxShadow:"0 4px 14px rgba(242,101,34,0.4)"}}>✈️</div>
                ):(
                  <div style={{fontSize:22,opacity:page===t.id?1:0.5}}>{t.icon}</div>
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