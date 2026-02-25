import { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, ComposedChart } from "recharts";
import _ from "lodash";

/* ═══════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════ */
const C = {
  bg:"#0A0008",s1:"#120B10",s2:"#1A1018",s3:"#221520",
  b1:"#2D1525",b2:"#3D2035",b3:"#5A3050",
  a:"#FF2D6F",aD:"#7A0030",aL:"#FF6B9D",
  err:"#FF4444",errD:"#6B0000",
  w:"#FBBF24",wD:"#78350F",
  i:"#BF5AF2",iD:"#4A1080",
  p:"#9D4EDD",cy:"#00F0FF",or:"#FF6D3A",
  t1:"#F0E6EC",t2:"#9E8A95",t3:"#5A4855",
  sel:"#2A0020",
};
const CC = [C.a,C.i,C.w,C.cy,C.p,C.or,C.aL,"#FF4444"];

/* ═══════════════════════════════════════════
   STORAGE — uses localStorage for persistence
   ═══════════════════════════════════════════ */
const DB = {
  get(k) { try { return JSON.parse(localStorage.getItem("yup_" + k)); } catch { return null; } },
  set(k, v) { localStorage.setItem("yup_" + k, JSON.stringify(v)); },
  del(k) { localStorage.removeItem("yup_" + k); },
};

/* ═══════════════════════════════════════════
   AUTH CONTEXT
   ═══════════════════════════════════════════ */
const AuthCtx = createContext(null);

function useAuth() {
  return useContext(AuthCtx);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => DB.get("session"));

  const register = (name, email, password, role = "Analitik") => {
    const users = DB.get("users") || [];
    if (users.find(u => u.email === email)) return { ok: false, msg: "Bu email artıq qeydiyyatdan keçib" };
    const newUser = { id: "U" + Date.now(), name, email, password, role, createdAt: new Date().toISOString() };
    users.push(newUser);
    DB.set("users", users);
    const session = { ...newUser };
    delete session.password;
    DB.set("session", session);
    setUser(session);
    return { ok: true };
  };

  const login = (email, password) => {
    const users = DB.get("users") || [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { ok: false, msg: "Email və ya şifrə yanlışdır" };
    const session = { ...found };
    delete session.password;
    DB.set("session", session);
    setUser(session);
    return { ok: true };
  };

  const logout = () => { DB.del("session"); setUser(null); };

  return <AuthCtx.Provider value={{ user, register, login, logout }}>{children}</AuthCtx.Provider>;
}

/* ═══════════════════════════════════════════
   DATA HOOKS — all CRUD backed by localStorage
   ═══════════════════════════════════════════ */
function useData(key, defaultVal = []) {
  const [data, setDataRaw] = useState(() => DB.get(key) || defaultVal);
  const setData = useCallback((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      DB.set(key, next);
      return next;
    });
  }, [key]);
  const add = useCallback((item) => setData(p => [...p, { ...item, id: "ID" + Date.now() + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString() }]), [setData]);
  const update = useCallback((id, changes) => setData(p => p.map(x => x.id === id ? { ...x, ...changes } : x)), [setData]);
  const remove = useCallback((id) => setData(p => p.filter(x => x.id !== id)), [setData]);
  return { data, setData, add, update, remove };
}

/* ═══════════════════════════════════════════
   CSS ANIMATIONS (injected once)
   ═══════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};overflow:hidden}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:${C.bg}}
::-webkit-scrollbar-thumb{background:${C.b1};border-radius:3px}
input[type="range"]{-webkit-appearance:none;background:${C.b1};border-radius:4px;outline:none;height:3px}
input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${C.a};cursor:pointer;box-shadow:0 0 10px ${C.a}80}

@keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes slideRight { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
@keyframes scaleIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
@keyframes glow { 0%,100% { box-shadow:0 0 5px ${C.a}30; } 50% { box-shadow:0 0 20px ${C.a}50, 0 0 40px ${C.a}20; } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
@keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
@keyframes borderGlow { 0%,100% { border-color:${C.a}30; } 50% { border-color:${C.a}80; } }
@keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
@keyframes typewriter { from { width:0; } to { width:100%; } }
@keyframes neonFlicker { 0%,19%,21%,23%,25%,54%,56%,100% { text-shadow:0 0 7px ${C.a}90,0 0 20px ${C.a}60,0 0 40px ${C.a}30; } 20%,24%,55% { text-shadow:none; } }

.fade-up { animation: fadeUp .5s ease both; }
.fade-in { animation: fadeIn .4s ease both; }
.slide-r { animation: slideRight .4s ease both; }
.scale-in { animation: scaleIn .35s ease both; }
.glow-border { animation: borderGlow 2s ease infinite; }
.float-anim { animation: float 3s ease-in-out infinite; }
.neon-text { animation: neonFlicker 3s ease-in-out infinite; }

.hover-lift { transition: transform .2s, box-shadow .2s; }
.hover-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(255,45,111,.15); }
.hover-glow { transition: box-shadow .2s, border-color .2s; }
.hover-glow:hover { box-shadow: 0 0 20px ${C.a}20; border-color: ${C.a}50 !important; }
.hover-scale { transition: transform .15s; }
.hover-scale:hover { transform: scale(1.03); }
.hover-bright { transition: filter .15s; }
.hover-bright:hover { filter: brightness(1.2); }

.stagger-1 { animation-delay: .05s; }
.stagger-2 { animation-delay: .1s; }
.stagger-3 { animation-delay: .15s; }
.stagger-4 { animation-delay: .2s; }
.stagger-5 { animation-delay: .25s; }
.stagger-6 { animation-delay: .3s; }

.page-enter { animation: fadeUp .4s ease both; }

.btn-cyber {
  position:relative; overflow:hidden;
  transition: transform .15s, box-shadow .2s;
}
.btn-cyber:hover { transform:translateY(-1px); box-shadow:0 4px 20px ${C.a}40; }
.btn-cyber:active { transform:translateY(0); }
.btn-cyber::after {
  content:''; position:absolute; top:50%; left:50%;
  width:0; height:0; border-radius:50%;
  background:rgba(255,255,255,.15);
  transition: width .4s, height .4s, top .4s, left .4s;
}
.btn-cyber:active::after { width:200px; height:200px; top:calc(50% - 100px); left:calc(50% - 100px); }

.input-cyber {
  transition: border-color .2s, box-shadow .2s;
}
.input-cyber:focus {
  border-color: ${C.a} !important;
  box-shadow: 0 0 0 2px ${C.a}20, 0 0 15px ${C.a}10;
  outline: none;
}

.card-cyber {
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.card-cyber:hover {
  border-color: ${C.b2};
  box-shadow: 0 4px 20px rgba(255,45,111,.06);
}

.tab-indicator {
  position: relative;
}
.tab-indicator::before {
  content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
  width:2px; height:60%; background:${C.a};
  border-radius:2px; box-shadow:0 0 8px ${C.a};
}
`;

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */
const I = ({ n, s=16 }) => {
  const d = {
    dashboard:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    store:"M3 21V9l9-6 9 6v12M9 21V12h6v9",
    costs:"M12 3a9 9 0 100 18 9 9 0 000-18zM14.5 9a2.5 2.5 0 00-5 0c0 2 5 2 5 4.5a2.5 2.5 0 01-5 0M12 6v1.5m0 9V18",
    productivity:"M22 12h-4l-3 9L9 3l-3 9H2",
    alert:"M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    pnl:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8",
    investment:"M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    newstore:"M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v8M8 12h8",
    reports:"M4 4h16v16H4zM4 9h16M9 4v16",
    data:"M12 2C6.48 2 3 3.34 3 5s3.48 3 9 3 9-1.34 9-3-3.48-3-9-3zM3 5v14c0 1.66 3.48 3 9 3s9-1.34 9-3V5M3 12c0 1.66 3.48 3 9 3s9-1.34 9-3",
    settings:"M12 15a3 3 0 100-6 3 3 0 000 6z",
    search:"M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35",
    x:"M18 6L6 18M6 6l12 12",
    plus:"M12 5v14M5 12h14",
    edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    trash:"M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6",
    down:"M6 9l6 6 6-6",up:"M18 15l-6-6-6 6",
    chevL:"M15 18l-6-6 6-6",
    download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
    clock:"M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
    play:"M5 3l14 9-14 9V3z",
    user:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z",
    logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
    empty:"M12 2a10 10 0 100 20 10 10 0 000-20zM8 12h8M12 8v8",
    eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d[n]||""}/></svg>;
};

/* ═══════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════ */
const fmt = n => { if(n==null)return"—"; const a=Math.abs(n); if(a>=1e6)return(n/1e6).toFixed(1)+"M"; if(a>=1e3)return(n/1e3).toFixed(1)+"K"; return typeof n==="number"?n.toFixed(0):n; };

const Badge = ({children,color=C.a})=><span style={{display:"inline-flex",alignItems:"center",padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:color+"18",color,letterSpacing:.4,whiteSpace:"nowrap",textShadow:`0 0 8px ${color}30`}}>{children}</span>;

const Btn = ({children,onClick,v="primary",s="md",icon,disabled,className=""})=>{
  const st={primary:{background:`linear-gradient(135deg,${C.a},${C.aD})`,color:"#fff"},secondary:{background:C.s2,color:C.t1,border:`1px solid ${C.b1}`},danger:{background:C.err,color:"#fff"},ghost:{background:"transparent",color:C.t2}};
  const sz={sm:{padding:"5px 12px",fontSize:11},md:{padding:"8px 16px",fontSize:12},lg:{padding:"10px 24px",fontSize:14}};
  return <button onClick={onClick} disabled={disabled} className={`btn-cyber ${className}`} style={{...st[v],...sz[s],border:st[v].border||"none",borderRadius:8,fontWeight:600,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?.5:1,fontFamily:"inherit"}}>{icon&&<I n={icon} s={sz[s].fontSize}/>}{children}</button>;
};

const Input = ({label,value,onChange,type="text",placeholder,style:sx})=>(
  <div style={{marginBottom:14,...sx}}>
    {label&&<label style={{display:"block",fontSize:11,color:C.t3,marginBottom:5,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      className="input-cyber" style={{width:"100%",background:C.s2,border:`1px solid ${C.b1}`,borderRadius:8,padding:"9px 14px",color:C.t1,fontSize:13,fontFamily:"inherit"}}/>
  </div>
);

const TextArea = ({label,value,onChange,placeholder,rows=3})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:11,color:C.t3,marginBottom:5,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="input-cyber" style={{width:"100%",background:C.s2,border:`1px solid ${C.b1}`,borderRadius:8,padding:"9px 14px",color:C.t1,fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
  </div>
);

const Select2 = ({label,value,onChange,options,width})=>(
  <div style={{marginBottom:14,width}}>
    {label&&<label style={{display:"block",fontSize:11,color:C.t3,marginBottom:5,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} className="input-cyber"
      style={{width:"100%",background:C.s2,border:`1px solid ${C.b1}`,borderRadius:8,padding:"9px 14px",color:C.t1,fontSize:13,fontFamily:"inherit",cursor:"pointer",appearance:"none"}}>
      <option value="">Seçin...</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Card = ({children,style:sx,className="",onClick})=>(
  <div onClick={onClick} className={`card-cyber ${className}`} style={{background:C.s1,border:`1px solid ${C.b1}`,borderRadius:14,padding:20,cursor:onClick?"pointer":"default",...sx}}>
    {children}
  </div>
);

const Modal = ({open,onClose,title,children,width=540})=>{
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,0,8,.8)",backdropFilter:"blur(10px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="scale-in" style={{background:C.s1,border:`1px solid ${C.a}25`,borderRadius:16,width,maxWidth:"94vw",maxHeight:"85vh",overflow:"auto",boxShadow:`0 20px 60px rgba(0,0,0,.7),0 0 40px ${C.a}08`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${C.b1}`}}>
          <div style={{color:C.a,fontSize:16,fontWeight:700,textShadow:`0 0 12px ${C.a}30`}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.t2,cursor:"pointer"}}><I n="x" s={20}/></button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  );
};

const EmptyState = ({icon="empty",title,subtitle,action})=>(
  <div className="fade-up" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",textAlign:"center"}}>
    <div className="float-anim" style={{width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${C.a}15,${C.p}10)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,border:`1px solid ${C.a}20`}}>
      <I n={icon} s={30}/>
    </div>
    <div style={{color:C.t1,fontSize:18,fontWeight:700,marginBottom:6}}>{title}</div>
    <div style={{color:C.t3,fontSize:13,maxWidth:360,lineHeight:1.5,marginBottom:20}}>{subtitle}</div>
    {action}
  </div>
);

const KPI = ({label,value,prefix="",suffix="",color=C.a,change,idx=0})=>(
  <div className={`fade-up hover-lift stagger-${idx+1}`} style={{background:C.s1,border:`1px solid ${C.b1}`,borderRadius:14,padding:"16px 18px",flex:1,minWidth:155,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},${color}00)`,opacity:.6}}/>
    <div style={{color:C.t2,fontSize:11,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>{label}</div>
    <div style={{color:C.t1,fontSize:24,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",letterSpacing:-.5}}>{prefix}{typeof value==="number"?fmt(value):value}{suffix}</div>
    {change!==undefined&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:5,fontSize:11,color:change>=0?C.cy:C.err}}>
      <I n={change>=0?"up":"down"} s={12}/><span style={{fontWeight:600}}>{Math.abs(change).toFixed(1)}%</span>
    </div>}
  </div>
);

const TT = {contentStyle:{background:C.s1,border:`1px solid ${C.a}25`,borderRadius:8,color:C.t1,fontSize:12,boxShadow:`0 0 20px ${C.a}08`}};

const regions = ["Bakı Mərkəz","Bakı Şimal","Abşeron","Sumqayıt","Gəncə","Lənkəran","Şəki","Mingəçevir"];
const statusOpts = ["Aktiv","Monitorinq","Kritik"];
const pipeStages = ["Yeni","Məlumat gözlənilir","Nəzərdən keçirilir","Fəaliyyət planı","Monitorinq","Bağlı"];
const pipeCols = {"Yeni":C.err,"Məlumat gözlənilir":C.w,"Nəzərdən keçirilir":C.i,"Fəaliyyət planı":C.p,"Monitorinq":C.cy,"Bağlı":C.t3};

/* ═══════════════════════════════════════════
   AUTH SCREENS
   ═══════════════════════════════════════════ */
function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    setErr("");
    if (mode === "login") {
      const r = login(email, pw);
      if (!r.ok) setErr(r.msg);
    } else {
      if (!name.trim()) return setErr("Ad daxil edin");
      if (!email.includes("@")) return setErr("Düzgün email daxil edin");
      if (pw.length < 4) return setErr("Şifrə minimum 4 simvol olmalıdır");
      const r = register(name, email, pw);
      if (!r.ok) setErr(r.msg);
    }
  };

  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:"'Outfit',sans-serif",position:"relative",overflow:"hidden"}}>
      {/* Background effects */}
      <div style={{position:"absolute",top:"-30%",left:"-10%",width:"50vw",height:"50vw",borderRadius:"50%",background:`radial-gradient(circle,${C.a}08 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"40vw",height:"40vw",borderRadius:"50%",background:`radial-gradient(circle,${C.p}06 0%,transparent 70%)`,pointerEvents:"none"}}/>

      <div className="scale-in" style={{width:420,maxWidth:"92vw"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div className="neon-text" style={{fontSize:36,fontWeight:800,color:C.a,letterSpacing:-1,marginBottom:4}}>⬡ Yupiter</div>
          <div style={{color:C.t3,fontSize:13,letterSpacing:2,textTransform:"uppercase"}}>Analytics Platform</div>
        </div>

        <Card style={{padding:28}}>
          <div style={{display:"flex",gap:0,marginBottom:24,background:C.s2,borderRadius:10,padding:3}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{
                flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
                fontFamily:"inherit",transition:"all .2s",
                background:mode===m?`linear-gradient(135deg,${C.a},${C.aD})`:"transparent",
                color:mode===m?"#fff":C.t3,
              }}>{m==="login"?"Daxil ol":"Qeydiyyat"}</button>
            ))}
          </div>

          {mode==="register"&&<Input label="Ad Soyad" value={name} onChange={setName} placeholder="Məsələn: Emil Məmmədov"/>}
          <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="email@numune.az"/>
          <Input label="Şifrə" value={pw} onChange={setPw} type="password" placeholder="••••••••"/>

          {err&&<div className="fade-in" style={{color:C.err,fontSize:12,marginBottom:12,padding:"8px 12px",background:C.errD+"30",borderRadius:8,border:`1px solid ${C.err}30`}}>⚠ {err}</div>}

          <Btn v="primary" s="lg" onClick={handleSubmit} className="fade-up" style={{width:"100%",justifyContent:"center",marginTop:4}}>
            {mode==="login"?"Daxil ol":"Qeydiyyatdan keç"}
          </Btn>
        </Card>

        <div style={{textAlign:"center",marginTop:16,color:C.t3,fontSize:11}}>
          Məlumatlar brauzerinizdə saxlanılır (localStorage)
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STORE FORM
   ═══════════════════════════════════════════ */
function StoreForm({initial,onSave,onCancel}){
  const [f,setF]=useState(initial||{name:"",region:"",manager:"",sqm:"",employees:"",sales:"",grossProfit:"",opex:"",status:"Aktiv",notes:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Input label="Mağaza Adı" value={f.name} onChange={v=>set("name",v)} placeholder="Yupiter Nərimanov"/>
      <Select2 label="Region" value={f.region} onChange={v=>set("region",v)} options={regions}/>
      <Input label="Menecer" value={f.manager} onChange={v=>set("manager",v)} placeholder="Ad Soyad"/>
      <Input label="Sahə (m²)" value={f.sqm} onChange={v=>set("sqm",v)} type="number" placeholder="120"/>
      <Input label="İşçi Sayı" value={f.employees} onChange={v=>set("employees",v)} type="number" placeholder="6"/>
      <Select2 label="Status" value={f.status} onChange={v=>set("status",v)} options={statusOpts}/>
      <Input label="Aylıq Satış (₼)" value={f.sales} onChange={v=>set("sales",v)} type="number" placeholder="250000"/>
      <Input label="Məcmu Mənfəət (₼)" value={f.grossProfit} onChange={v=>set("grossProfit",v)} type="number" placeholder="60000"/>
      <Input label="OPEX (₼)" value={f.opex} onChange={v=>set("opex",v)} type="number" placeholder="40000"/>
    </div>
    <TextArea label="Qeydlər" value={f.notes} onChange={v=>set("notes",v)} placeholder="Əlavə məlumatlar..."/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
      <Btn v="secondary" onClick={onCancel}>Ləğv et</Btn>
      <Btn v="primary" onClick={()=>{
        if(!f.name.trim())return;
        const ebitda=Number(f.grossProfit||0)-Number(f.opex||0);
        const margin=Number(f.sales)>0?Math.round(Number(f.grossProfit)/Number(f.sales)*10000)/100:0;
        onSave({...f,sales:Number(f.sales||0),grossProfit:Number(f.grossProfit||0),opex:Number(f.opex||0),ebitda,margin,sqm:Number(f.sqm||0),employees:Number(f.employees||0),salesPerSqm:Number(f.sqm)>0?Math.round(Number(f.sales)/Number(f.sqm)):0,salesPerEmployee:Number(f.employees)>0?Math.round(Number(f.sales)/Number(f.employees)):0});
      }}>Saxla</Btn>
    </div>
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: DASHBOARD
   ═══════════════════════════════════════════ */
function DashboardTab({stores}){
  const totals=useMemo(()=>{
    const s=stores.data;
    if(!s.length)return null;
    return{sales:_.sumBy(s,"sales"),gp:_.sumBy(s,"grossProfit"),opex:_.sumBy(s,"opex"),ebitda:_.sumBy(s,x=>(Number(x.grossProfit)||0)-(Number(x.opex)||0)),margin:s.length?_.meanBy(s,"margin"):0,neg:s.filter(x=>((Number(x.grossProfit)||0)-(Number(x.opex)||0))<0).length,count:s.length};
  },[stores.data]);

  if(!stores.data.length) return <EmptyState icon="dashboard" title="Hələ heç bir məlumat yoxdur" subtitle="Əvvəlcə 'Mağazalar' bölməsinə keçib mağaza əlavə edin. Sonra dashboard avtomatik dolacaq." action={<div style={{color:C.t3,fontSize:12}}>Mağazalar → Yeni Mağaza</div>}/>;

  const chartData=stores.data.slice(0,10).map(s=>({name:s.name?.replace("Yupiter ","")||"?",sales:Number(s.sales)||0,gp:Number(s.grossProfit)||0}));
  const regionData=_.chain(stores.data).groupBy("region").map((v,k)=>({name:k||"Digər",value:_.sumBy(v,"sales")})).filter(x=>x.value>0).value();

  return(<div className="page-enter">
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:22}}>
      <KPI label="Mağaza Sayı" value={totals.count} color={C.a} idx={0}/>
      <KPI label="Ümumi Satış" value={totals.sales} prefix="₼" color={C.i} idx={1}/>
      <KPI label="Məcmu Mənfəət" value={totals.gp} prefix="₼" color={C.w} idx={2}/>
      <KPI label="EBITDA" value={totals.ebitda} prefix="₼" color={C.cy} idx={3}/>
      <KPI label="Ort. Marja" value={parseFloat(totals.margin.toFixed(1))} suffix="%" color={C.p} idx={4}/>
      <KPI label="Neqativ" value={totals.neg} color={C.err} idx={5}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:regionData.length?"2fr 1fr":"1fr",gap:16}}>
      <Card className="fade-up stagger-2">
        <div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:16}}>Mağaza üzrə Satış</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke={C.b1}/>
            <XAxis dataKey="name" tick={{fill:C.t3,fontSize:10}}/><YAxis tick={{fill:C.t3,fontSize:10}} tickFormatter={v=>"₼"+fmt(v)}/>
            <Tooltip {...TT}/><Bar dataKey="sales" fill={C.a} radius={[6,6,0,0]} name="Satış"/></BarChart>
        </ResponsiveContainer>
      </Card>
      {regionData.length>0&&<Card className="fade-up stagger-3">
        <div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:16}}>Region Payı</div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart><Pie data={regionData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
            {regionData.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie>
            <Tooltip {...TT} formatter={v=>"₼"+fmt(v)}/></PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:8}}>
          {regionData.map((r,i)=><div key={r.name} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.t2}}><div style={{width:8,height:8,borderRadius:2,background:CC[i%CC.length]}}/>{r.name}</div>)}
        </div>
      </Card>}
    </div>
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: STORES
   ═══════════════════════════════════════════ */
function StoresTab({stores}){
  const [modal,setModal]=useState(null); // null | "add" | store object for edit
  const [search,setSearch]=useState("");
  const [detail,setDetail]=useState(null);
  const [sortKey,setSortKey]=useState("createdAt");
  const [sortDir,setSortDir]=useState("desc");

  const list=useMemo(()=>{
    let d=stores.data.filter(s=>(s.name||"").toLowerCase().includes(search.toLowerCase()));
    return _.orderBy(d,[sortKey],[sortDir]);
  },[stores.data,search,sortKey,sortDir]);

  const toggleSort=k=>{if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("desc");}};

  if(detail){
    const s=detail; const ebitda=(Number(s.grossProfit)||0)-(Number(s.opex)||0);
    const monthlyChart=Array.from({length:6},(_,i)=>({month:["Yan","Fev","Mar","Apr","May","İyn"][i],sales:Math.round((Number(s.sales)||0)/6*(0.8+Math.random()*.4))}));
    return(<div className="page-enter">
      <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:C.a,cursor:"pointer",fontSize:12,marginBottom:16,display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}><I n="chevL" s={14}/>Geri</button>
      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16}}>
        <Card><div style={{fontSize:18,fontWeight:700,color:C.a,marginBottom:16,textShadow:`0 0 12px ${C.a}30`}}>{s.name}</div>
          {[["Region",s.region],["Menecer",s.manager],["Sahə",(s.sqm||"—")+" m²"],["İşçi",s.employees],["Status",s.status],["Satış","₼"+fmt(s.sales)],["Marja",(s.margin||0)+"%"],["EBITDA","₼"+fmt(ebitda)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.b1}`}}>
              <span style={{color:C.t3,fontSize:12}}>{k}</span><span style={{color:C.t1,fontSize:12,fontWeight:500}}>{v||"—"}</span>
            </div>
          ))}
          {s.notes&&<div style={{marginTop:12,padding:10,background:C.s2,borderRadius:8,fontSize:12,color:C.t2}}>{s.notes}</div>}
          <div style={{display:"flex",gap:6,marginTop:14}}>
            <Btn v="secondary" s="sm" icon="edit" onClick={()=>{setDetail(null);setModal(s);}}>Redaktə</Btn>
            <Btn v="danger" s="sm" icon="trash" onClick={()=>{stores.remove(s.id);setDetail(null);}}>Sil</Btn>
          </div>
        </Card>
        <Card><div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:16}}>Son 6 Ay Trendi</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyChart}><defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.a} stopOpacity={.3}/><stop offset="100%" stopColor={C.a} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.b1}/><XAxis dataKey="month" tick={{fill:C.t3,fontSize:11}}/><YAxis tick={{fill:C.t3,fontSize:11}} tickFormatter={v=>"₼"+fmt(v)}/>
              <Tooltip {...TT}/><Area type="monotone" dataKey="sales" stroke={C.a} fill="url(#aG)" strokeWidth={2}/></AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>);
  }

  return(<div className="page-enter">
    <Modal open={!!modal} onClose={()=>setModal(null)} title={modal&&modal!=="add"?"Mağazanı Redaktə Et":"Yeni Mağaza Əlavə Et"} width={640}>
      <StoreForm initial={modal!=="add"?modal:null} onCancel={()=>setModal(null)}
        onSave={d=>{if(modal==="add")stores.add(d);else stores.update(modal.id,d);setModal(null);}}/>
    </Modal>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{position:"relative",width:240}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mağaza axtar..." className="input-cyber"
          style={{width:"100%",background:C.s2,border:`1px solid ${C.b1}`,borderRadius:8,padding:"8px 12px 8px 34px",color:C.t1,fontSize:12,fontFamily:"inherit"}}/>
        <span style={{position:"absolute",left:10,top:9,color:C.t3}}><I n="search" s={14}/></span>
      </div>
      <Btn icon="plus" onClick={()=>setModal("add")}>Yeni Mağaza</Btn>
    </div>

    {!list.length?<EmptyState icon="store" title="Heç bir mağaza tapılmadı" subtitle={stores.data.length?"Axtarış filtrini dəyişin":"İlk mağazanızı əlavə edərək başlayın"} action={!stores.data.length&&<Btn icon="plus" onClick={()=>setModal("add")}>Mağaza Əlavə Et</Btn>}/>:(
    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr .8fr",padding:"10px 14px",background:C.s2,borderBottom:`1px solid ${C.b1}`}}>
        {[{k:"name",l:"Mağaza"},{k:"region",l:"Region"},{k:"sales",l:"Satış"},{k:"margin",l:"Marja"},{k:"ebitda",l:"EBITDA"},{k:"status",l:"Status"}].map(c=>(
          <div key={c.k} onClick={()=>toggleSort(c.k)} style={{color:C.t3,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
            {c.l}{sortKey===c.k&&<I n={sortDir==="desc"?"down":"up"} s={10}/>}
          </div>
        ))}
      </div>
      {list.map((s,i)=>{
        const ebitda=(Number(s.grossProfit)||0)-(Number(s.opex)||0);
        return(
        <div key={s.id} onClick={()=>setDetail(s)} className={`fade-up stagger-${Math.min(i+1,6)}`} style={{
          display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr .8fr",padding:"11px 14px",
          borderBottom:`1px solid ${C.b1}`,cursor:"pointer",transition:"background .15s",
        }} onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{color:C.t1,fontSize:12,fontWeight:500}}>{s.name}</div>
          <div style={{color:C.t2,fontSize:11}}>{s.region||"—"}</div>
          <div style={{color:C.t1,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>₼{fmt(s.sales)}</div>
          <div style={{color:(s.margin||0)>25?C.cy:(s.margin||0)>18?C.w:C.err,fontSize:12,fontWeight:600}}>{s.margin||0}%</div>
          <div style={{color:ebitda>=0?C.cy:C.err,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>₼{fmt(ebitda)}</div>
          <Badge color={s.status==="Aktiv"?C.cy:s.status==="Monitorinq"?C.w:C.err}>{s.status||"—"}</Badge>
        </div>);
      })}
      <div style={{padding:"10px 14px",color:C.t3,fontSize:11}}>Cəmi: {list.length} mağaza • Satış: ₼{fmt(_.sumBy(list,"sales"))}</div>
    </Card>)}
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: COSTS
   ═══════════════════════════════════════════ */
function CostsTab({costs}){
  const [modal,setModal]=useState(null);
  return(<div className="page-enter">
    <Modal open={!!modal} onClose={()=>setModal(null)} title={modal&&modal!=="add"?"Redaktə":"Yeni Xərc Qaydası"}>
      <CostForm initial={modal!=="add"?modal:null} onCancel={()=>setModal(null)} onSave={d=>{if(modal==="add")costs.add(d);else costs.update(modal.id,d);setModal(null);}}/>
    </Modal>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn icon="plus" onClick={()=>setModal("add")}>Yeni Qayda</Btn></div>
    {!costs.data.length?<EmptyState icon="costs" title="Xərc qaydaları hələ yoxdur" subtitle="Logistika, tədarükçü bonusu, icarə bölüşdürmə qaydalarını burada yaradın" action={<Btn icon="plus" onClick={()=>setModal("add")}>Qayda Əlavə Et</Btn>}/>:
    <div style={{display:"grid",gap:10}}>{costs.data.map((c,i)=>(
      <Card key={c.id} className={`fade-up stagger-${Math.min(i+1,6)} hover-glow`} onClick={()=>setModal(c)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:C.t1,fontSize:13,fontWeight:600}}>{c.name}</div><div style={{color:C.t3,fontSize:11,marginTop:2}}>{c.category} • {c.method} • {c.stores||"Bütün mağazalar"}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {c.amount&&<span style={{color:C.a,fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>₼{fmt(Number(c.amount))}</span>}
            <Badge color={c.active!==false?C.cy:C.t3}>{c.active!==false?"Aktiv":"Deaktiv"}</Badge>
            <Btn v="ghost" s="sm" icon="trash" onClick={e=>{e.stopPropagation();costs.remove(c.id);}}/>
          </div>
        </div>
      </Card>
    ))}</div>}
  </div>);
}
function CostForm({initial,onSave,onCancel}){
  const [f,setF]=useState(initial||{name:"",category:"Logistika",method:"Satış %-ə görə",stores:"",amount:"",active:true});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div>
    <Input label="Qayda Adı" value={f.name} onChange={v=>set("name",v)} placeholder="Logistika bölüşdürməsi"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Select2 label="Kateqoriya" value={f.category} onChange={v=>set("category",v)} options={["Logistika","Tədarükçü Bonus","İcarə","OPEX","Digər"]}/>
      <Select2 label="Metod" value={f.method} onChange={v=>set("method",v)} options={["Satış %-ə görə","Çatdırılma sayına görə","Həcmə görə","Birbaşa","Kateqoriya mixinə görə"]}/>
    </div>
    <Input label="Məbləğ (₼)" value={f.amount} onChange={v=>set("amount",v)} type="number" placeholder="Opsional"/>
    <Input label="Tətbiq edilən mağazalar" value={f.stores} onChange={v=>set("stores",v)} placeholder="Boş = hamısı"/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="secondary" onClick={onCancel}>Ləğv et</Btn><Btn onClick={()=>{if(!f.name.trim())return;onSave(f);}}>Saxla</Btn></div>
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: PRODUCTIVITY
   ═══════════════════════════════════════════ */
function ProductivityTab({stores}){
  if(!stores.data.length)return<EmptyState icon="productivity" title="Məlumat yoxdur" subtitle="Mağaza əlavə edildikdən sonra məhsuldarlıq göstəriciləri burada görünəcək"/>;
  const sorted=_.orderBy(stores.data.filter(s=>s.salesPerSqm>0),["salesPerSqm"],["desc"]).slice(0,12);
  return(<div className="page-enter">
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
      <KPI label="Ort. ₼/m²" value={Math.round(_.meanBy(stores.data.filter(s=>s.sqm>0),"salesPerSqm")||0)} prefix="₼" color={C.a} idx={0}/>
      <KPI label="Ort. ₼/İşçi" value={Math.round(_.meanBy(stores.data.filter(s=>s.employees>0),"salesPerEmployee")||0)} prefix="₼" color={C.i} idx={1}/>
      <KPI label="Ən Yüksək Marja" value={_.maxBy(stores.data,"margin")?.margin||0} suffix="%" color={C.cy} idx={2}/>
    </div>
    {sorted.length>0&&<Card className="fade-up stagger-3">
      <div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:16}}>₼/m² Liderliyi</div>
      <ResponsiveContainer width="100%" height={Math.max(200,sorted.length*36)}>
        <BarChart data={sorted} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.b1}/>
          <XAxis type="number" tick={{fill:C.t3,fontSize:11}}/><YAxis type="category" dataKey="name" tick={{fill:C.t2,fontSize:10}} width={120} tickFormatter={v=>(v||"").replace("Yupiter ","")}/>
          <Tooltip {...TT}/><Bar dataKey="salesPerSqm" radius={[0,6,6,0]} name="₼/m²">{sorted.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>}
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: NEGATIVE STORES
   ═══════════════════════════════════════════ */
function NegativeTab({negatives}){
  const [modal,setModal]=useState(null);
  return(<div className="page-enter">
    <Modal open={!!modal} onClose={()=>setModal(null)} title={modal&&modal!=="add"?"Redaktə":"Yeni Neqativ Qeyd"}>
      <NegForm initial={modal!=="add"?modal:null} onCancel={()=>setModal(null)} onSave={d=>{if(modal==="add")negatives.add(d);else negatives.update(modal.id,d);setModal(null);}}/>
    </Modal>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{display:"flex",gap:8}}>{pipeStages.slice(0,5).map(st=>{const cnt=negatives.data.filter(n=>n.pipeline===st).length;return<div key={st} style={{padding:"6px 14px",borderRadius:8,background:pipeCols[st]+"12",border:`1px solid ${pipeCols[st]}30`,fontSize:11,color:pipeCols[st],fontWeight:600}}>{st}: {cnt}</div>;})}</div>
      <Btn icon="plus" onClick={()=>setModal("add")}>Yeni Qeyd</Btn>
    </div>
    {!negatives.data.length?<EmptyState icon="alert" title="Neqativ mağaza qeydi yoxdur" subtitle="Problem mağazaları burada izləyin: status pipeline, səbəb analizi, fəaliyyət planı" action={<Btn icon="plus" onClick={()=>setModal("add")}>Qeyd Əlavə Et</Btn>}/>:
    <div style={{display:"grid",gap:8}}>{negatives.data.map((n,i)=>(
      <Card key={n.id} className={`fade-up stagger-${Math.min(i+1,6)} hover-glow`} onClick={()=>setModal(n)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:C.t1,fontSize:13,fontWeight:600}}>{n.store}</div><div style={{color:C.t3,fontSize:11,marginTop:2}}>{n.rootCause} • {n.weeks||"?"} həftə neqativ</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge color={pipeCols[n.pipeline]||C.t3}>{n.pipeline}</Badge>
            <Btn v="ghost" s="sm" icon="trash" onClick={e=>{e.stopPropagation();negatives.remove(n.id);}}/>
          </div>
        </div>
        {n.notes&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.b1}`,color:C.t2,fontSize:12}}>{n.notes}</div>}
      </Card>
    ))}</div>}
  </div>);
}
function NegForm({initial,onSave,onCancel}){
  const [f,setF]=useState(initial||{store:"",pipeline:"Yeni",rootCause:"",weeks:"",notes:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div>
    <Input label="Mağaza Adı" value={f.store} onChange={v=>set("store",v)} placeholder="Yupiter Lənkəran"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Select2 label="Pipeline Status" value={f.pipeline} onChange={v=>set("pipeline",v)} options={pipeStages}/>
      <Select2 label="Səbəb" value={f.rootCause} onChange={v=>set("rootCause",v)} options={["Yüksək icarə","Aşağı trafik","Kadr çatışmazlığı","Rəqabət","Stok problemi","Lokasiya","Digər"]}/>
    </div>
    <Input label="Neqativ Həftə Sayı" value={f.weeks} onChange={v=>set("weeks",v)} type="number"/>
    <TextArea label="Qeydlər / Fəaliyyət Planı" value={f.notes} onChange={v=>set("notes",v)} placeholder="İzahat və plan..."/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="secondary" onClick={onCancel}>Ləğv et</Btn><Btn onClick={()=>{if(!f.store.trim())return;onSave(f);}}>Saxla</Btn></div>
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: PNL
   ═══════════════════════════════════════════ */
function PNLTab({meetings}){
  const [modal,setModal]=useState(null);
  return(<div className="page-enter">
    <Modal open={!!modal} onClose={()=>setModal(null)} title={modal&&modal!=="add"?"Görüşü Redaktə Et":"Yeni Görüş"}>
      <MeetingForm initial={modal!=="add"?modal:null} onCancel={()=>setModal(null)} onSave={d=>{if(modal==="add")meetings.add(d);else meetings.update(modal.id,d);setModal(null);}}/>
    </Modal>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn icon="plus" onClick={()=>setModal("add")}>Yeni Görüş</Btn></div>
    {!meetings.data.length?<EmptyState icon="pnl" title="P&L görüşü hələ yoxdur" subtitle="P&L müzakirələri, qərarlar və tapşırıqları burada izləyin" action={<Btn icon="plus" onClick={()=>setModal("add")}>Görüş Planla</Btn>}/>:
    <div style={{display:"grid",gap:10}}>{meetings.data.map((m,i)=>(
      <Card key={m.id} className={`fade-up stagger-${Math.min(i+1,6)} hover-glow`} onClick={()=>setModal(m)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:C.t1,fontSize:14,fontWeight:600}}>{m.topic}</div><div style={{color:C.t3,fontSize:11,marginTop:2}}>{m.date} • {m.participants||"—"}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge color={m.status==="Tamamlandı"?C.cy:m.status==="Planlaşdırılıb"?C.w:C.p}>{m.status}</Badge>
            <Btn v="ghost" s="sm" icon="trash" onClick={e=>{e.stopPropagation();meetings.remove(m.id);}}/>
          </div>
        </div>
        {(m.decisions||m.notes)&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.b1}`,color:C.t2,fontSize:12}}>{m.decisions&&<div><strong style={{color:C.w}}>Qərarlar:</strong> {m.decisions}</div>}{m.notes&&<div style={{marginTop:4}}>{m.notes}</div>}</div>}
      </Card>
    ))}</div>}
  </div>);
}
function MeetingForm({initial,onSave,onCancel}){
  const [f,setF]=useState(initial||{topic:"",date:new Date().toISOString().slice(0,10),status:"Planlaşdırılıb",participants:"",decisions:"",notes:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div>
    <Input label="Mövzu" value={f.topic} onChange={v=>set("topic",v)} placeholder="Aylıq P&L icmalı"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Input label="Tarix" value={f.date} onChange={v=>set("date",v)} type="date"/>
      <Select2 label="Status" value={f.status} onChange={v=>set("status",v)} options={["Planlaşdırılıb","Davam edir","Tamamlandı"]}/>
    </div>
    <Input label="İştirakçılar" value={f.participants} onChange={v=>set("participants",v)} placeholder="Ad, Ad, Ad"/>
    <TextArea label="Qərarlar" value={f.decisions} onChange={v=>set("decisions",v)} placeholder="Qəbul edilən qərarlar..."/>
    <TextArea label="Qeydlər" value={f.notes} onChange={v=>set("notes",v)}/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="secondary" onClick={onCancel}>Ləğv et</Btn><Btn onClick={()=>{if(!f.topic.trim())return;onSave(f);}}>Saxla</Btn></div>
  </div>);
}

/* ═══════════════════════════════════════════
   TAB: INVESTMENT
   ═══════════════════════════════════════════ */
function InvestmentTab(){
  const [a,setA]=useState({monthlySales:150000,margin:24,rent:8000,staff:12000,logistics:3000,investment:120000,rampMonths:6});
  const set=(k,v)=>setA(p=>({...p,[k]:Number(v)}));
  const gp=a.monthlySales*a.margin/100,opex=a.rent+a.staff+a.logistics,ebitda=gp-opex,payback=ebitda>0?Math.ceil(a.investment/ebitda):Infinity;
  const proj=Array.from({length:36},(_,i)=>{const r=Math.min(1,(i+1)/a.rampMonths);return{month:i+1,cf:Math.round(-a.investment+ebitda*r*(i+1))};});
  const sliders=[{k:"monthlySales",l:"Aylıq Satış",min:50000,max:500000,step:10000,f:v=>"₼"+fmt(v)},{k:"margin",l:"Marja %",min:10,max:40,step:1,f:v=>v+"%"},{k:"rent",l:"İcarə",min:2000,max:20000,step:500,f:v=>"₼"+fmt(v)},{k:"staff",l:"Kadr",min:5000,max:30000,step:1000,f:v=>"₼"+fmt(v)},{k:"logistics",l:"Logistika",min:1000,max:10000,step:500,f:v=>"₼"+fmt(v)},{k:"investment",l:"İnvestisiya",min:50000,max:300000,step:10000,f:v=>"₼"+fmt(v)},{k:"rampMonths",l:"Ramp (ay)",min:1,max:12,step:1,f:v=>v+" ay"}];
  return(<div className="page-enter"><div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
    <div><Card className="fade-up stagger-1" style={{marginBottom:14}}><div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:14}}>Fərziyyələr</div>
      {sliders.map(s=>(<div key={s.k} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.t2,fontSize:11}}>{s.l}</span><span style={{color:C.a,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{s.f(a[s.k])}</span></div><input type="range" min={s.min} max={s.max} step={s.step} value={a[s.k]} onChange={e=>set(s.k,e.target.value)} style={{width:"100%"}}/></div>))}
    </Card>
    <Card className="fade-up stagger-2 glow-border" style={{background:`linear-gradient(135deg,${C.aD}30,${C.s1})`}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["Geri Dönüş",payback===Infinity?"∞":payback+" ay"],["İllik EBITDA","₼"+fmt(ebitda*12)],["Aylıq EBITDA","₼"+fmt(ebitda)],["IRR (təx.)",(ebitda>0?((ebitda*12/a.investment-1)*100).toFixed(1):"N/A")+"%"]].map(([l,v])=>(
          <div key={l}><div style={{color:C.t3,fontSize:10,textTransform:"uppercase",letterSpacing:.5}}>{l}</div><div style={{color:C.a,fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",textShadow:`0 0 10px ${C.a}30`}}>{v}</div></div>
        ))}
      </div>
    </Card></div>
    <Card className="fade-up stagger-3"><div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:16}}>Kumulyativ CF (36 ay)</div>
      <ResponsiveContainer width="100%" height={340}><AreaChart data={proj}><defs><linearGradient id="cfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.a} stopOpacity={.3}/><stop offset="100%" stopColor={C.a} stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={C.b1}/><XAxis dataKey="month" tick={{fill:C.t3,fontSize:11}}/><YAxis tick={{fill:C.t3,fontSize:11}} tickFormatter={v=>"₼"+fmt(v)}/>
        <Tooltip {...TT} formatter={v=>"₼"+fmt(v)}/><Area type="monotone" dataKey="cf" stroke={C.a} fill="url(#cfG)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
    </Card>
  </div></div>);
}

/* ═══════════════════════════════════════════
   TAB: NEW STORE, REPORTS, DATA, ADMIN
   (Simplified CRUD for each)
   ═══════════════════════════════════════════ */
function GenericCRUD({data:hook,title,icon,subtitle,fields,emptyMsg}){
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const openAdd=()=>{setForm({});setModal("add");};
  const openEdit=(item)=>{setForm({...item});setModal(item);};
  return(<div className="page-enter">
    <Modal open={!!modal} onClose={()=>setModal(null)} title={modal==="add"?`Yeni ${title}`:title+" Redaktə"}>
      <div>{fields.map(f=>f.type==="select"?<Select2 key={f.key} label={f.label} value={form[f.key]||""} onChange={v=>setForm(p=>({...p,[f.key]:v}))} options={f.options}/>:f.type==="textarea"?<TextArea key={f.key} label={f.label} value={form[f.key]||""} onChange={v=>setForm(p=>({...p,[f.key]:v}))} placeholder={f.ph}/>:<Input key={f.key} label={f.label} value={form[f.key]||""} onChange={v=>setForm(p=>({...p,[f.key]:v}))} type={f.type||"text"} placeholder={f.ph}/>)}</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}><Btn v="secondary" onClick={()=>setModal(null)}>Ləğv et</Btn><Btn onClick={()=>{const d={...form};if(!d[fields[0].key])return;if(modal==="add")hook.add(d);else hook.update(modal.id,d);setModal(null);}}>Saxla</Btn></div>
    </Modal>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn icon="plus" onClick={openAdd}>Yeni {title}</Btn></div>
    {!hook.data.length?<EmptyState icon={icon} title={emptyMsg||`${title} hələ yoxdur`} subtitle={subtitle} action={<Btn icon="plus" onClick={openAdd}>Əlavə Et</Btn>}/>:
    <div style={{display:"grid",gap:10}}>{hook.data.map((item,i)=>(
      <Card key={item.id} className={`fade-up stagger-${Math.min(i+1,6)} hover-glow`} onClick={()=>openEdit(item)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:C.t1,fontSize:13,fontWeight:600}}>{item[fields[0].key]}</div>
            {fields[1]&&<div style={{color:C.t3,fontSize:11,marginTop:2}}>{fields.slice(1,3).map(f=>item[f.key]).filter(Boolean).join(" • ")}</div>}</div>
          <Btn v="ghost" s="sm" icon="trash" onClick={e=>{e.stopPropagation();hook.remove(item.id);}}/>
        </div>
      </Card>))}</div>}
  </div>);
}

/* ═══════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════ */
const TABS=[
  {id:"dashboard",label:"Dashboard",icon:"dashboard"},
  {id:"stores",label:"Mağazalar",icon:"store"},
  {id:"costs",label:"Xərclər",icon:"costs"},
  {id:"productivity",label:"Məhsuldarlıq",icon:"productivity"},
  {id:"negative",label:"Neqativ",icon:"alert"},
  {id:"pnl",label:"P&L",icon:"pnl"},
  {id:"investment",label:"İnvestisiya",icon:"investment"},
  {id:"newstore",label:"Yeni Açılış",icon:"newstore"},
  {id:"reports",label:"Hesabatlar",icon:"reports"},
  {id:"data",label:"Məlumat",icon:"data"},
  {id:"admin",label:"Admin",icon:"settings"},
];

/* ═══════════════════════════════════════════
   MAIN SHELL
   ═══════════════════════════════════════════ */
function AppShell(){
  const {user,logout}=useAuth();
  const [tab,setTab]=useState("dashboard");
  const [collapsed,setCollapsed]=useState(false);
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),60000);return()=>clearInterval(t);},[]);

  // All data hooks
  const stores=useData("stores");
  const costs=useData("costs");
  const negatives=useData("negatives");
  const meetings=useData("meetings");
  const newStores=useData("newStores");
  const reports=useData("reports");
  const dataSources=useData("dataSources");

  const content={
    dashboard:<DashboardTab stores={stores}/>,
    stores:<StoresTab stores={stores}/>,
    costs:<CostsTab costs={costs}/>,
    productivity:<ProductivityTab stores={stores}/>,
    negative:<NegativeTab negatives={negatives}/>,
    pnl:<PNLTab meetings={meetings}/>,
    investment:<InvestmentTab/>,
    newstore:<GenericCRUD data={newStores} title="Açılış" icon="newstore" subtitle="Yeni açılan mağazaların satış rampını izləyin" fields={[{key:"name",label:"Mağaza",ph:"Yupiter Masazır"},{key:"openDate",label:"Açılış Tarixi",type:"date"},{key:"targetSales",label:"Hədəf Satış (₼)",type:"number",ph:"200000"},{key:"actualSales",label:"Faktik Satış (₼)",type:"number",ph:"180000"},{key:"status",label:"Status",type:"select",options:["Planda","Öndə","Geridə"]},{key:"notes",label:"Qeydlər",type:"textarea",ph:"Əlavə məlumat..."}]}/>,
    reports:<GenericCRUD data={reports} title="Hesabat" icon="reports" subtitle="Dövri hesabat şablonları yaradın" fields={[{key:"name",label:"Hesabat Adı",ph:"Günlük Satış Hesabatı"},{key:"frequency",label:"Tezlik",type:"select",options:["Gündəlik","Həftəlik","Aylıq","Rüblük"]},{key:"assignee",label:"Məsul",ph:"Ad Soyad"},{key:"status",label:"Status",type:"select",options:["Aktiv","Arxiv","Deaktiv"]},{key:"notes",label:"Təsvir",type:"textarea",ph:"Hesabat haqqında..."}]}/>,
    data:<GenericCRUD data={dataSources} title="Məlumat Mənbəyi" icon="data" subtitle="POS, ERP, logistika, HR inteqrasiyalarını idarə edin" fields={[{key:"name",label:"Mənbə Adı",ph:"POS Sistemi"},{key:"type",label:"Tip",type:"select",options:["Avtomatik","Manual","API","Fayl yükləmə"]},{key:"lastSync",label:"Son Sinxronizasiya",ph:"2026-02-25"},{key:"status",label:"Status",type:"select",options:["Bağlı","Manual","Konfiqurasiya","Deaktiv"]},{key:"notes",label:"Qeydlər",type:"textarea"}]}/>,
    admin:<AdminPanel/>,
  };

  const tabObj=TABS.find(t=>t.id===tab);

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Outfit',sans-serif",color:C.t1,overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:collapsed?58:215,minWidth:collapsed?58:215,background:C.s1,borderRight:`1px solid ${C.b1}`,display:"flex",flexDirection:"column",transition:"all .25s cubic-bezier(.4,0,.2,1)",overflow:"hidden"}}>
        <div style={{padding:collapsed?"14px 8px":"16px 18px",borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",minHeight:56}}>
          {!collapsed&&<div><div className="neon-text" style={{fontSize:17,fontWeight:800,color:C.a,letterSpacing:-.5}}>⬡ Yupiter</div><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,textTransform:"uppercase"}}>Analytics v2.0</div></div>}
          <button onClick={()=>setCollapsed(!collapsed)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",padding:3,display:"flex",transform:collapsed?"rotate(180deg)":"none",transition:"transform .3s"}}><I n="chevL" s={14}/></button>
        </div>

        <div style={{flex:1,padding:"6px",overflowY:"auto"}}>
          {TABS.map((t,idx)=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={tab===t.id?"tab-indicator slide-r":""} style={{
              width:"100%",display:"flex",alignItems:"center",gap:9,padding:collapsed?"9px 0":"9px 12px",
              justifyContent:collapsed?"center":"flex-start",
              background:tab===t.id?C.a+"10":"transparent",
              border:"none",borderRadius:8,cursor:"pointer",
              color:tab===t.id?C.a:C.t2,fontSize:12,fontWeight:tab===t.id?600:400,
              transition:"all .2s",marginBottom:2,fontFamily:"inherit",
              animationDelay:tab===t.id?`${idx*30}ms`:"0ms",
            }}><I n={t.icon} s={15}/>{!collapsed&&<span>{t.label}</span>}</button>
          ))}
        </div>

        {!collapsed&&<div style={{padding:"12px 16px",borderTop:`1px solid ${C.b1}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.a},${C.aD})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,boxShadow:`0 0 10px ${C.a}30`}}>{user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div style={{flex:1,overflow:"hidden"}}><div style={{color:C.t1,fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div><div style={{color:C.t3,fontSize:9}}>{user?.role}</div></div>
          </div>
          <button onClick={logout} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:"none",border:`1px solid ${C.b1}`,borderRadius:6,color:C.t3,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.err+"50";e.currentTarget.style.color=C.err;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.b1;e.currentTarget.style.color=C.t3;}}>
            <I n="logout" s={13}/>Çıxış
          </button>
        </div>}
      </div>

      {/* MAIN */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 24px",borderBottom:`1px solid ${C.b1}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s1+"E0",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:17,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>{tabObj?.label}</div>
            <span style={{color:C.t3,fontSize:11}}>{time.toLocaleDateString("az-AZ",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.cy,boxShadow:`0 0 6px ${C.cy}`,marginRight:4}}/>
            <span style={{color:C.t3,fontSize:11}}>Online</span>
          </div>
        </div>
        <div key={tab} style={{flex:1,padding:"20px 26px",overflow:"auto"}}>{content[tab]}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN PANEL
   ═══════════════════════════════════════════ */
function AdminPanel(){
  const {user}=useAuth();
  const users=DB.get("users")||[];
  return(<div className="page-enter">
    <Card className="fade-up"><div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:16}}>İstifadəçilər ({users.length})</div>
      {users.map((u,i)=>(
        <div key={u.id} className={`fade-up stagger-${Math.min(i+1,6)}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.b1}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:CC[i%CC.length],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,boxShadow:`0 0 8px ${CC[i%CC.length]}30`}}>{u.name?.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div><div style={{color:C.t1,fontSize:13,fontWeight:500}}>{u.name}</div><div style={{color:C.t3,fontSize:11}}>{u.email}</div></div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge color={u.role==="Super Admin"?C.p:u.role==="Maliyyə Rəhbəri"?C.w:C.i}>{u.role}</Badge>
            {u.id===user?.id&&<Badge color={C.cy}>Siz</Badge>}
          </div>
        </div>
      ))}
    </Card>
    <Card className="fade-up stagger-3" style={{marginTop:16}}>
      <div style={{color:C.t1,fontSize:14,fontWeight:600,marginBottom:12}}>Sistem Məlumatı</div>
      <div style={{color:C.t2,fontSize:12,lineHeight:1.8}}>
        Məlumatlar localStorage-da saxlanılır. Bütün CRUD əməliyyatları real vaxtda işləyir. Fərqli brauzerlərdə fərqli sessiyalar olacaq.
        Hər kəs öz brauzeri vasitəsilə qeydiyyatdan keçə və sistemi istifadə edə bilər.
      </div>
    </Card>
  </div>);
}

/* ═══════════════════════════════════════════
   ROOT APP
   ═══════════════════════════════════════════ */
export default function App(){
  return(
    <AuthProvider>
      <style>{STYLES}</style>
      <AuthGate/>
    </AuthProvider>
  );
}

function AuthGate(){
  const {user}=useAuth();
  return user?<AppShell/>:<LoginScreen/>;
}
