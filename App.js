import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, StyleSheet, SafeAreaView, StatusBar, Linking, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBhqjQWTZ_PQaGcBH2PpWEwA-R-P0aoYcM",
  authDomain: "contapy-d663d.firebaseapp.com",
  projectId: "contapy-d663d",
  storageBucket: "contapy-d663d.firebasestorage.app",
  messagingSenderId: "872487142766",
  appId: "1:872487142766:web:939091bc6f00a2bc306d7f",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// ─── CONSTANTES APP ───────────────────────────────────────────────────────────
const MNA = 80000000;
const CAL_IVA = {0:7,1:9,2:11,3:13,4:15,5:17,6:19,7:21,8:23,9:25};
const CAL_DJI = {0:8,1:10,2:12,3:14,4:16,5:18,6:20,7:22,8:24,9:26};
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const fmt = n => "G. " + Math.round(n).toLocaleString("es-PY");

const RUBROS = [
  {id:"belleza",ico:"💄",label:"Belleza y estética",regs:["IRP","IRP+IVA"],gastos:["Insumos","Equipamiento","Alquiler","Publicidad","Capacitación"]},
  {id:"salud",ico:"🩺",label:"Salud",regs:["IRP","IRP+IVA"],gastos:["Insumos médicos","Equipamiento","Consultorio","Capacitación"]},
  {id:"legal",ico:"⚖️",label:"Legal / Abogacía",regs:["IRP","IRP+IVA"],gastos:["Oficina","Internet","Software","Capacitación"]},
  {id:"tecnologia",ico:"💻",label:"Tecnología / Digital",regs:["IRP","IRP+IVA"],gastos:["Software","Hardware","Internet","Capacitación"]},
  {id:"educacion",ico:"📚",label:"Educación",regs:["IRP","IRP+IVA"],gastos:["Material didáctico","Plataformas","Capacitación","Internet"]},
  {id:"comercio",ico:"🛍️",label:"Comercio",regs:["IVA","IRE+IVA","RESIMPLE"],gastos:["Mercaderías","Flete","Alquiler","Servicios"]},
  {id:"gastronomia",ico:"🍔",label:"Gastronomía",regs:["IVA","IRE+IVA","RESIMPLE"],gastos:["Materia prima","Alquiler","Equipamiento","Publicidad"]},
  {id:"transporte",ico:"🚗",label:"Transporte",regs:["IVA","RESIMPLE"],gastos:["Combustible","Mantenimiento","Seguro","Peajes"]},
  {id:"construccion",ico:"🏗️",label:"Construcción",regs:["IRP","IRP+IVA","IRE+IVA"],gastos:["Materiales","Herramientas","Transporte","Subcontratistas"]},
  {id:"otros",ico:"📦",label:"Otra actividad",regs:["IRP","IVA","IRP+IVA","RESIMPLE"],gastos:["Gastos operativos","Alquiler","Servicios","Materiales"]},
];

const COMBIN = {
  "IRP":     {obs:["IRP","REG_A"],label:"IRP-RSP",color:"#6366F1",desc:"Declaración anual en marzo + registro en febrero."},
  "IVA":     {obs:["IVA","REG_M"],label:"IVA General",color:"#3B82F6",desc:"IVA mensual aunque no tengas movimiento."},
  "IRP+IVA": {obs:["IRP","IVA","REG_A","REG_M"],label:"IRP + IVA",color:"#8B5CF6",desc:"IVA mensual + registro mensual + IRP anual."},
  "IRE+IVA": {obs:["IRE","IVA","REG_M"],label:"IRE SIMPLE + IVA",color:"#F59E0B",desc:"IVA mensual + registro mensual + IRE anual."},
  "RESIMPLE":{obs:["RES"],label:"IRE RESIMPLE",color:"#10B981",desc:"DJ anual + cuotas trimestrales."},
};

const OBS = {
  IRP:   {cod:"715",nombre:"IRP-RSP",form:"515",ico:"📊",color:"#6366F1",sinMov:false,freq:"anual",desc:"Impuesto a la Renta Personal. Una vez al año si superás G. 80 millones.",porQue:"Tenés la obligación 715 activa. Tus ingresos por servicios superan G. 80.000.000 anuales."},
  IVA:   {cod:"211",nombre:"IVA General",form:"120",ico:"💳",color:"#3B82F6",sinMov:true,freq:"mensual",desc:"Se declara todos los meses aunque no hayas vendido nada.",porQue:"Tenés la obligación 211 activa. Debés declarar IVA cada mes, incluso sin movimiento — multa G. 50.000."},
  IRE:   {cod:"701",nombre:"IRE SIMPLE",form:"500",ico:"🏢",color:"#F59E0B",sinMov:false,freq:"anual",desc:"Renta empresarial régimen SIMPLE. Anual con anticipos.",porQue:"Tenés la obligación 701 activa. Régimen de renta para actividades dentro del límite del SIMPLE."},
  RES:   {cod:"702",nombre:"IRE RESIMPLE",form:"152",ico:"🌱",color:"#10B981",sinMov:false,freq:"cuotas",desc:"DJ anual en febrero + cuotas trimestrales.",porQue:"Tenés la obligación 702 activa. El régimen más simple para pequeños emprendedores."},
  REG_M: {cod:"955",nombre:"Registro Mensual Comprobantes",form:"241",ico:"🧾",color:"#8B5CF6",sinMov:true,freq:"mensual",desc:"Confirmás tus facturas cada mes en Marangatu.",porQue:"El IVA General activa el registro mensual (955). Cada mes confirmás tus comprobantes — multa G. 100.000."},
  REG_A: {cod:"956",nombre:"Registro Anual Comprobantes",form:"241",ico:"📋",color:"#EC4899",sinMov:false,freq:"anual",desc:"Confirmás tus facturas del año en febrero.",porQue:"El IRP-RSP activa el registro anual (956). Se confirma en febrero antes del IRP de marzo."},
};

const ACCENT = "#4F46E5";
const GREEN = "#10B981";
const RED = "#EF4444";
const AMBER = "#F59E0B";

// ─── ERRORES FIREBASE EN ESPAÑOL ─────────────────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/user-not-found": "No existe una cuenta con ese email.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/email-already-in-use": "Ese email ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "El email no es válido.",
    "auth/too-many-requests": "Demasiados intentos. Intentá más tarde.",
    "auth/network-request-failed": "Sin conexión. Verificá tu internet.",
  };
  return map[code] || "Error inesperado. Intentá de nuevo.";
}

// ─── PANTALLA DE LOGIN ────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || (mode !== "reset" && !password)) {
      setError("Completá todos los campos."); return;
    }
    if (mode === "register" && password !== confirmPass) {
      setError("Las contraseñas no coinciden."); return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onAuth(cred.user);
      } else if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        onAuth(cred.user);
      } else {
        await sendPasswordResetEmail(auth, email);
        setError("✅ Revisá tu bandeja de entrada.");
        setMode("login");
      }
    } catch (e) {
      setError(friendlyError(e.code));
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{flex:1, backgroundColor:"#F0F4FF"}} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScrollView contentContainerStyle={{flexGrow:1, alignItems:"center", justifyContent:"center", padding:24}} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={{alignItems:"center", marginBottom:32}}>
          <View style={{width:72,height:72,borderRadius:20,backgroundColor:"#1A3C8F",alignItems:"center",justifyContent:"center",marginBottom:12,shadowColor:"#1A3C8F",shadowOffset:{width:0,height:8},shadowOpacity:0.3,shadowRadius:16,elevation:8}}>
            <Text style={{fontSize:36,color:"#fff",fontWeight:"800"}}>₲</Text>
          </View>
          <Text style={{fontSize:28,fontWeight:"800",color:"#1A3C8F",letterSpacing:-0.5}}>Conta<Text style={{color:"#E63946"}}>PY</Text></Text>
          <Text style={{fontSize:14,color:"#5A6A7A",marginTop:4}}>Tu asistente tributario</Text>
        </View>

        {/* Card */}
        <View style={{width:"100%",maxWidth:400,backgroundColor:"#fff",borderRadius:24,padding:24,shadowColor:"#000",shadowOffset:{width:0,height:4},shadowOpacity:0.08,shadowRadius:20,elevation:4}}>

          {/* Tabs */}
          {mode !== "reset" && (
            <View style={{flexDirection:"row",backgroundColor:"#F0F4FF",borderRadius:12,padding:4,marginBottom:24}}>
              {[{id:"login",label:"Ingresar"},{id:"register",label:"Registrarse"}].map(t=>(
                <TouchableOpacity key={t.id} onPress={()=>{setMode(t.id);setError("");}}
                  style={{flex:1,paddingVertical:10,borderRadius:10,alignItems:"center",backgroundColor:mode===t.id?"#fff":"transparent",shadowColor:mode===t.id?"#000":"transparent",shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:4,elevation:mode===t.id?2:0}}>
                  <Text style={{fontSize:14,fontWeight:mode===t.id?"700":"500",color:mode===t.id?"#1A3C8F":"#5A6A7A"}}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {mode === "reset" && (
            <Text style={{fontSize:20,fontWeight:"700",color:"#0D1B2A",marginBottom:20,textAlign:"center"}}>Recuperar contraseña</Text>
          )}

          {/* Inputs */}
          <TextInput
            style={{backgroundColor:"#F7F9FF",borderWidth:1.5,borderColor:"#D0DAF0",borderRadius:14,paddingHorizontal:16,paddingVertical:14,fontSize:15,color:"#0D1B2A",marginBottom:12}}
            placeholder="Email" placeholderTextColor="#5A6A7A"
            value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address"
          />

          {mode !== "reset" && (
            <View style={{flexDirection:"row",alignItems:"center",marginBottom:12}}>
              <TextInput
                style={{flex:1,backgroundColor:"#F7F9FF",borderWidth:1.5,borderColor:"#D0DAF0",borderRadius:14,paddingHorizontal:16,paddingVertical:14,fontSize:15,color:"#0D1B2A"}}
                placeholder="Contraseña" placeholderTextColor="#5A6A7A"
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={()=>setShowPass(!showPass)} style={{padding:12}}>
                <Text style={{fontSize:18}}>{showPass?"🙈":"👁"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === "register" && (
            <TextInput
              style={{backgroundColor:"#F7F9FF",borderWidth:1.5,borderColor:"#D0DAF0",borderRadius:14,paddingHorizontal:16,paddingVertical:14,fontSize:15,color:"#0D1B2A",marginBottom:12}}
              placeholder="Confirmar contraseña" placeholderTextColor="#5A6A7A"
              value={confirmPass} onChangeText={setConfirmPass}
              secureTextEntry={!showPass}
            />
          )}

          {/* Error */}
          {error !== "" && (
            <View style={{padding:12,borderRadius:12,backgroundColor:error.startsWith("✅")?"#10B98114":"#EF444414",borderWidth:1,borderColor:error.startsWith("✅")?"#10B98133":"#EF444433",marginBottom:12}}>
              <Text style={{fontSize:13,color:error.startsWith("✅")?"#0d7a5a":"#b91c1c"}}>{error}</Text>
            </View>
          )}

          {/* Botón principal */}
          <TouchableOpacity onPress={handleSubmit} disabled={loading}
            style={{backgroundColor:"#1A3C8F",borderRadius:14,paddingVertical:16,alignItems:"center",marginTop:4,shadowColor:"#1A3C8F",shadowOffset:{width:0,height:6},shadowOpacity:0.35,shadowRadius:12,elevation:6,opacity:loading?0.7:1}}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{fontSize:16,fontWeight:"700",color:"#fff",letterSpacing:0.3}}>
                  {mode==="login"?"Ingresar":mode==="register"?"Crear cuenta":"Enviar enlace"}
                </Text>
            }
          </TouchableOpacity>

          {/* Links */}
          {mode === "login" && (
            <TouchableOpacity onPress={()=>{setMode("reset");setError("");}}>
              <Text style={{textAlign:"center",color:"#2B5CE6",fontSize:14,marginTop:16,fontWeight:"500"}}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}
          {mode === "reset" && (
            <TouchableOpacity onPress={()=>{setMode("login");setError("");}}>
              <Text style={{textAlign:"center",color:"#2B5CE6",fontSize:14,marginTop:16,fontWeight:"500"}}>← Volver al login</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={{marginTop:24,fontSize:11,color:"#5A6A7A",textAlign:"center",lineHeight:17}}>
          Al continuar aceptás los Términos de Uso y la{"\n"}Política de Privacidad de Conta PY
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Escuchar estado de sesión
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (authLoading) return (
    <View style={{flex:1,backgroundColor:"#F0F4FF",alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:36,color:"#fff",fontWeight:"800",width:72,height:72,borderRadius:20,backgroundColor:"#1A3C8F",textAlign:"center",lineHeight:72}}>₲</Text>
      <Text style={{fontSize:24,fontWeight:"800",color:"#1A3C8F",marginTop:16}}>Conta<Text style={{color:"#E63946"}}>PY</Text></Text>
      <ActivityIndicator color="#1A3C8F" style={{marginTop:24}} />
    </View>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;

  return <MainApp user={user} onSignOut={() => signOut(auth).then(() => setUser(null))} />;
}

// ─── MAIN APP (dashboard + wizard) ───────────────────────────────────────────
function MainApp({ user, onSignOut }) {
  const [dark, setDark] = useState(false);
  const bg = dark ? "#1C1C1E" : "#F2F2F7";
  const card = dark ? "#2C2C2E" : "#FFFFFF";
  const txt = dark ? "#FFFFFF" : "#0D0D0D";
  const muted = "#8E8E93";
  const border = dark ? "#3A3A3C" : "#E5E5EA";
  const input = dark ? "#3A3A3C" : "#F2F2F7";

  const [step, setStep] = useState(0);
  const [rubro, setRubro] = useState(null);
  const [rucD, setRucD] = useState(null);
  const [ruc, setRuc] = useState("");
  const [ingAnual, setIngAnual] = useState("");
  const [regimen, setRegimen] = useState(null);
  const [sabeImp, setSabeImp] = useState(null);
  const [porQueModal, setPorQueModal] = useState(null);
  const [done, setDone] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [pensando, setPensando] = useState(false);

  const rubroObj = RUBROS.find(r => r.id === rubro);
  const combObj = regimen ? COMBIN[regimen] : null;
  const ingNum = parseFloat(String(ingAnual).replace(/\./g,"").replace(",",".")) || 0;
  const mesA = new Date().getMonth();
  const diaA = new Date().getDate();
  const anioA = new Date().getFullYear();

  const tareas = (() => {
    if (!combObj || rucD === null) return [];
    const res = [];
    combObj.obs.forEach(cod => {
      const ob = OBS[cod]; if (!ob) return;
      if (ob.freq === "mensual") res.push({cod, venc:`${CAL_IVA[rucD]}/${String(mesA+2>12?1:mesA+2).padStart(2,"0")}`, dias:CAL_IVA[rucD]-diaA});
      if (cod === "REG_A" && mesA === 1) res.push({cod, venc:`${CAL_DJI[rucD]}/02`, dias:CAL_DJI[rucD]-diaA});
      if (cod === "IRP" && mesA === 2 && ingNum > MNA) res.push({cod, venc:`${CAL_IVA[rucD]}/03`, dias:CAL_IVA[rucD]-diaA});
    });
    return res;
  })();

  const pend = tareas.filter(t => !done[t.cod]);

  const enviarMensaje = async () => {
    const texto = chatInput.trim();
    if (!texto || pensando) return;
    const nuevos = [...mensajes, {rol:"user", texto}];
    setMensajes(nuevos);
    setChatInput("");
    setPensando(true);
    try {
      const resp = await fetch("https://contapyapp.netlify.app/.netlify/functions/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          mensajes: nuevos,
          perfil: {rubro: rubroObj?.label || "", regimen: combObj?.label || "", rucDigito: rucD},
        }),
      });
      const data = await resp.json();
      setMensajes([...nuevos, {rol:"asistente", texto: data.respuesta || "No pude procesar tu consulta."}]);
    } catch(e) {
      setMensajes([...nuevos, {rol:"asistente", texto:"⚠ Error de conexión. Verificá tu internet."}]);
    }
    setPensando(false);
  };

  const Btn = ({label, onPress, disabled, color, textColor}) => (
    <TouchableOpacity onPress={onPress} disabled={disabled}
      style={{backgroundColor: color||ACCENT, borderRadius:16, padding:15, alignItems:"center", marginTop:12, opacity:disabled?0.4:1}}>
      <Text style={{color: textColor||"#fff", fontWeight:"700", fontSize:15}}>{label}</Text>
    </TouchableOpacity>
  );

  const BtnOut = ({label, onPress}) => (
    <TouchableOpacity onPress={onPress}
      style={{borderRadius:16, padding:15, alignItems:"center", marginTop:12, borderWidth:1.5, borderColor:border}}>
      <Text style={{color:txt, fontWeight:"700", fontSize:15}}>{label}</Text>
    </TouchableOpacity>
  );

  const Card = ({children, style}) => (
    <View style={[{backgroundColor:card, borderRadius:20, padding:16, marginBottom:14, borderWidth:1, borderColor:border}, style]}>
      {children}
    </View>
  );

  // WIZARD
  if (step < 4) return (
    <SafeAreaView style={{flex:1, backgroundColor:bg}}>
      <StatusBar barStyle={dark?"light-content":"dark-content"} />
      <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center", padding:16}}>
        <Text style={{fontWeight:"800", fontSize:22, color:txt}}>Conta<Text style={{color:ACCENT}}>PY</Text></Text>
        <View style={{flexDirection:"row", gap:8}}>
          <TouchableOpacity onPress={()=>setDark(!dark)} style={{width:36,height:36,borderRadius:18,backgroundColor:input,alignItems:"center",justifyContent:"center"}}>
            <Text style={{fontSize:16}}>{dark?"☀️":"🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignOut} style={{width:36,height:36,borderRadius:18,backgroundColor:input,alignItems:"center",justifyContent:"center"}}>
            <Text style={{fontSize:15}}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bienvenida con email */}
      {step === 0 && (
        <View style={{paddingHorizontal:16, paddingBottom:4}}>
          <Text style={{fontSize:12, color:muted}}>👋 Hola, {user.email}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{padding:16, paddingBottom:40}}>

        {step===0 && (<>
          <Text style={{fontWeight:"800",fontSize:26,color:txt,marginBottom:6}}>¿A qué te dedicás?</Text>
          <Text style={{fontSize:14,color:muted,marginBottom:18}}>Trabajás por tu cuenta — elegí tu actividad principal.</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>
            {RUBROS.map(r => (
              <TouchableOpacity key={r.id} onPress={()=>setRubro(r.id)}
                style={{width:"47%",padding:14,borderRadius:16,backgroundColor:card,borderWidth:1.5,borderColor:rubro===r.id?ACCENT:border,alignItems:"flex-start",gap:6}}>
                <Text style={{fontSize:26}}>{r.ico}</Text>
                <Text style={{fontSize:13,fontWeight:"700",color:rubro===r.id?ACCENT:txt}}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Btn label="Continuar →" onPress={()=>setStep(1)} disabled={!rubro} />
        </>)}

        {step===1 && (<>
          <Text style={{fontWeight:"800",fontSize:26,color:txt,marginBottom:6}}>Tu RUC</Text>
          <Text style={{fontSize:14,color:muted,marginBottom:18}}>Lo usamos para calcular tus fechas exactas de vencimiento.</Text>
          <TextInput style={{padding:13,borderRadius:14,borderWidth:1.5,borderColor:border,backgroundColor:input,fontSize:15,color:txt}} placeholder="Ej: 8000000" placeholderTextColor={muted} keyboardType="numeric" value={ruc}
            onChangeText={v=>{setRuc(v); const d=parseInt(v.trim().slice(-1)); if(!isNaN(d)) setRucD(d);}} />
          {rucD!==null && <View style={{padding:12,borderRadius:14,backgroundColor:"#10B98114",borderWidth:1,borderColor:"#10B98133",marginTop:10}}>
            <Text style={{color:"#0d7a5a",fontSize:13}}>✓ Dígito {rucD} — vencimientos: día {CAL_IVA[rucD]} (IVA/IRP) y día {CAL_DJI[rucD]} (registros).</Text>
          </View>}
          <Text style={{fontSize:13,color:muted,marginTop:16,marginBottom:8}}>¿Cuánto ganás al año? (opcional)</Text>
          <TextInput style={{padding:13,borderRadius:14,borderWidth:1.5,borderColor:border,backgroundColor:input,fontSize:15,color:txt}} placeholder="Ej: 80.000.000" placeholderTextColor={muted} keyboardType="numeric" value={ingAnual} onChangeText={setIngAnual} />
          {ingNum>0 && <View style={{padding:12,borderRadius:14,backgroundColor:ingNum>MNA?"#EF444414":"#10B98114",borderWidth:1,borderColor:ingNum>MNA?"#EF444433":"#10B98133",marginTop:10}}>
            <Text style={{color:ingNum>MNA?"#b91c1c":"#0d7a5a",fontSize:13}}>{ingNum>MNA?`Con ${fmt(ingNum)}/año superás G. 80M: el IRP te corresponde.`:`Con ${fmt(ingNum)}/año estás bajo el umbral del IRP.`}</Text>
          </View>}
          <View style={{flexDirection:"row",gap:10,marginTop:12}}>
            <BtnOut label="← Atrás" onPress={()=>setStep(0)} />
            <Btn label="Continuar →" onPress={()=>setStep(2)} disabled={rucD===null} />
          </View>
        </>)}

        {step===2 && (<>
          {sabeImp===null && (<>
            <Text style={{fontWeight:"800",fontSize:26,color:txt,marginBottom:6}}>Tu situación tributaria</Text>
            <Text style={{fontSize:14,color:muted,marginBottom:18}}>Una pregunta rápida antes de continuar:</Text>
            {[{v:true,ico:"🟢",l:"Sí, sé qué impuesto tengo",d:"Ya conozco mis obligaciones en Marangatu."},
              {v:false,ico:"🔵",l:"No estoy seguro/a",d:"Quiero verificarlo en Marangatu primero."}].map(op=>(
              <TouchableOpacity key={op.l} onPress={()=>setSabeImp(op.v)}
                style={{flexDirection:"row",alignItems:"center",gap:12,padding:15,borderRadius:16,borderWidth:1.5,borderColor:border,backgroundColor:card,marginBottom:10}}>
                <Text style={{fontSize:22}}>{op.ico}</Text>
                <View style={{flex:1}}><Text style={{fontWeight:"700",fontSize:15,color:txt}}>{op.l}</Text><Text style={{fontSize:12,color:muted,marginTop:2}}>{op.d}</Text></View>
              </TouchableOpacity>
            ))}
            <BtnOut label="← Atrás" onPress={()=>setStep(1)} />
          </>)}

          {sabeImp===false && (<>
            <Text style={{fontWeight:"800",fontSize:26,color:txt,marginBottom:6}}>Verificá en Marangatu</Text>
            <Text style={{fontSize:14,color:muted,marginBottom:16}}>Seguí estos pasos para ver tus obligaciones:</Text>
            {[{n:"1",t:"Ingresá a Marangatu con tu Clave de Acceso"},{n:"2",t:'Buscá la sección "Obligaciones"'},{n:"3",t:"Ahí ves los impuestos de tu RUC"},{n:"4",t:"Volvé y elegí el que corresponde"}].map(p=>(
              <View key={p.n} style={{flexDirection:"row",gap:12,paddingVertical:10,borderTopWidth:1,borderTopColor:border}}>
                <View style={{width:32,height:32,borderRadius:16,backgroundColor:ACCENT,alignItems:"center",justifyContent:"center"}}>
                  <Text style={{color:"#fff",fontWeight:"700"}}>{p.n}</Text>
                </View>
                <Text style={{flex:1,fontSize:14,color:txt,lineHeight:20,paddingTop:6}}>{p.t}</Text>
              </View>
            ))}
            <Btn label="🔐 Ver mis obligaciones en Marangatu" onPress={()=>Linking.openURL("https://marangatu.set.gov.py/eset/login")} color="#1F5FD0" />
            <TouchableOpacity onPress={()=>Linking.openURL("https://www.dnit.gov.py/web/portal-institucional/servicios-online-sin-clave-de-acceso")}
              style={{flexDirection:"row",alignItems:"center",gap:10,padding:12,borderRadius:12,borderWidth:1.5,borderColor:border,marginTop:10}}>
              <Text style={{fontSize:16}}>🔍</Text>
              <View style={{flex:1}}><Text style={{fontWeight:"700",fontSize:13,color:txt}}>Consultar RUC sin clave</Text><Text style={{fontSize:11,color:muted}}>Servicios públicos DNIT</Text></View>
              <Text style={{color:ACCENT}}>→</Text>
            </TouchableOpacity>
            <View style={{padding:12,borderRadius:14,backgroundColor:input,borderWidth:1,borderColor:border,marginTop:10}}>
              <Text style={{fontSize:12,color:muted}}>Cuando sepas cuáles tenés, tocá el botón de abajo.</Text>
            </View>
            <Btn label="Ya sé mis obligaciones ✓" onPress={()=>setSabeImp(true)} />
            <BtnOut label="← Atrás" onPress={()=>setSabeImp(null)} />
          </>)}

          {sabeImp===true && (<>
            <Text style={{fontWeight:"800",fontSize:26,color:txt,marginBottom:6}}>Tu régimen</Text>
            <Text style={{fontSize:14,color:muted,marginBottom:16}}>Elegí el que figura en tu RUC bajo "Obligaciones".</Text>
            {(rubroObj?.regs||[]).map(r=>{
              const c=COMBIN[r]; if(!c) return null;
              return (
                <TouchableOpacity key={r} onPress={()=>setRegimen(r)}
                  style={{flexDirection:"row",alignItems:"center",gap:12,padding:15,borderRadius:16,borderWidth:1.5,borderColor:regimen===r?c.color:border,backgroundColor:card,marginBottom:10}}>
                  <View style={{flex:1}}>
                    <Text style={{fontWeight:"700",fontSize:15,color:regimen===r?c.color:txt}}>{c.label}</Text>
                    <Text style={{fontSize:12,color:muted,marginTop:2}}>{c.desc}</Text>
                  </View>
                  {regimen===r && <Text style={{color:c.color,fontSize:18}}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <View style={{flexDirection:"row",gap:10,marginTop:4}}>
              <BtnOut label="← Atrás" onPress={()=>setSabeImp(null)} />
              <Btn label="Ver mi dashboard →" onPress={()=>setStep(3)} disabled={!regimen} />
            </View>
          </>)}
        </>)}

        {step===3 && setStep(4)}
      </ScrollView>
    </SafeAreaView>
  );

  // DASHBOARD
  return (
    <SafeAreaView style={{flex:1, backgroundColor:bg}}>
      <StatusBar barStyle={dark?"light-content":"dark-content"} />
      <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16}}>
        <Text style={{fontWeight:"800",fontSize:22,color:txt}}>Conta<Text style={{color:ACCENT}}>PY</Text></Text>
        <View style={{flexDirection:"row",gap:8}}>
          <TouchableOpacity onPress={()=>setDark(!dark)} style={{width:36,height:36,borderRadius:18,backgroundColor:input,alignItems:"center",justifyContent:"center"}}>
            <Text style={{fontSize:16}}>{dark?"☀️":"🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setStep(0);setRegimen(null);setSabeImp(null);}} style={{width:36,height:36,borderRadius:18,backgroundColor:input,alignItems:"center",justifyContent:"center"}}>
            <Text style={{fontSize:15}}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignOut} style={{width:36,height:36,borderRadius:18,backgroundColor:input,alignItems:"center",justifyContent:"center"}}>
            <Text style={{fontSize:15}}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding:16, paddingBottom:40}}>
        <View style={{backgroundColor:ACCENT,borderRadius:24,padding:20,marginBottom:14}}>
          <Text style={{fontSize:11,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Mi situación · {MESES[mesA]} {anioA}</Text>
          <Text style={{fontWeight:"800",fontSize:20,color:"#fff"}}>{rubroObj?.ico} {rubroObj?.label}</Text>
          <Text style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginTop:2}}>{combObj?.label} · RUC termina en {rucD}</Text>
          <Text style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2}}>👤 {user.email}</Text>
          <View style={{flexDirection:"row",gap:8,marginTop:14}}>
            {[{l:"Obligaciones",v:combObj?.obs.length},{l:"Este mes",v:pend.length},{l:"Urgentes",v:pend.filter(t=>t.dias<=5).length,alert:pend.filter(t=>t.dias<=5).length>0}].map(x=>(
              <View key={x.l} style={{flex:1,backgroundColor:x.alert?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.2)",borderRadius:14,padding:10,alignItems:"center"}}>
                <Text style={{fontSize:10,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:0.5}}>{x.l}</Text>
                <Text style={{fontWeight:"800",fontSize:18,color:"#fff",marginTop:2}}>{x.v}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={()=>setChatOpen(true)}
          style={{backgroundColor:card,borderRadius:20,padding:16,marginBottom:14,borderWidth:1.5,borderColor:ACCENT+"55",flexDirection:"row",alignItems:"center",gap:12}}>
          <Text style={{fontSize:30}}>🤖</Text>
          <View style={{flex:1}}>
            <Text style={{fontWeight:"700",fontSize:15,color:txt}}>Asistente IA</Text>
            <Text style={{fontSize:12,color:muted}}>Preguntá lo que sea sobre tus impuestos</Text>
          </View>
          <View style={{backgroundColor:ACCENT,borderRadius:100,paddingHorizontal:10,paddingVertical:4}}>
            <Text style={{color:"#fff",fontSize:11,fontWeight:"700"}}>Nuevo ✨</Text>
          </View>
        </TouchableOpacity>

        <Card>
          <Text style={{fontWeight:"700",fontSize:16,color:txt,marginBottom:10}}>🤖 ¿Qué hago este mes?</Text>
          {tareas.length===0 && <View style={{alignItems:"center",paddingVertical:16}}><Text style={{fontSize:32,marginBottom:8}}>🎉</Text><Text style={{fontWeight:"700",color:txt}}>¡Mes tranquilo!</Text><Text style={{fontSize:12,color:muted,marginTop:4}}>No tenés vencimientos este mes.</Text></View>}
          {pend.map(t=>{
            const ob=OBS[t.cod]; const u=t.dias<=5;
            return (
              <View key={t.cod} style={{flexDirection:"row",gap:12,paddingVertical:11,borderTopWidth:1,borderTopColor:border}}>
                <View style={{width:42,height:42,borderRadius:13,backgroundColor:ob.color+"22",alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:20}}>{ob.ico}</Text></View>
                <View style={{flex:1}}>
                  <Text style={{fontWeight:"700",fontSize:14,color:txt}}>{ob.nombre}</Text>
                  <Text style={{fontSize:12,color:muted,marginTop:2}}>{ob.desc}</Text>
                  <Text style={{fontSize:12,fontWeight:"600",color:u?RED:muted,marginTop:4}}>📅 Vence: {t.venc}{u?" · ¡URGENTE!":""}</Text>
                  {ob.sinMov && <Text style={{fontSize:11,color:AMBER,fontWeight:"700",marginTop:3}}>⚠ Presentar aunque no tengas movimiento</Text>}
                </View>
                <TouchableOpacity onPress={()=>setPorQueModal(t.cod)}><Text style={{color:ACCENT,fontSize:12,fontWeight:"700"}}>¿Por qué?</Text></TouchableOpacity>
              </View>
            );
          })}
          {pend.length===0&&tareas.length>0 && <View style={{padding:12,borderRadius:14,backgroundColor:"#10B98114",borderWidth:1,borderColor:"#10B98133",marginTop:8}}><Text style={{color:"#0d7a5a",fontSize:13}}>✓ ¡Todo al día en {MESES[mesA]}!</Text></View>}
        </Card>

        <Card>
          <Text style={{fontWeight:"700",fontSize:16,color:txt,marginBottom:10}}>🏛️ Hacer mis gestiones</Text>
          <TouchableOpacity onPress={()=>Linking.openURL("https://marangatu.set.gov.py/eset/login")}
            style={{backgroundColor:ACCENT,borderRadius:16,padding:16,flexDirection:"row",alignItems:"center",gap:12,marginBottom:10}}>
            <Text style={{fontSize:24}}>🔐</Text>
            <View style={{flex:1}}><Text style={{color:"#fff",fontWeight:"800",fontSize:15}}>Ingresar a Marangatu</Text><Text style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginTop:2}}>Declaraciones · Pagos · Comprobantes</Text></View>
            <Text style={{color:"#fff",fontSize:18}}>→</Text>
          </TouchableOpacity>
          <View style={{backgroundColor:input,borderRadius:14,padding:14}}>
            <Text style={{fontWeight:"700",fontSize:13,color:txt,marginBottom:10}}>📖 ¿Cómo entro?</Text>
            {["1️⃣ Tocá el botón azul de arriba","2️⃣ Ingresá tu RUC y Clave de Acceso","3️⃣ Buscá 'Declaraciones Juradas y Pagos'","4️⃣ Elegí el formulario que te indica Conta PY","5️⃣ Completá y enviá. ¡Listo!"].map(p=>(
              <Text key={p} style={{fontSize:13,color:txt,marginBottom:6,lineHeight:19}}>{p}</Text>
            ))}
          </View>
          <TouchableOpacity onPress={()=>Linking.openURL("https://www.dnit.gov.py/web/portal-institucional/clave-de-acceso")}
            style={{flexDirection:"row",alignItems:"center",gap:10,padding:12,borderRadius:12,borderWidth:1.5,borderColor:border,marginTop:10}}>
            <Text style={{fontSize:18}}>🔑</Text>
            <View style={{flex:1}}><Text style={{fontWeight:"700",fontSize:13,color:txt}}>Obtener mi Clave de Acceso</Text><Text style={{fontSize:11,color:muted}}>Gratis, se hace una sola vez</Text></View>
            <Text style={{color:ACCENT}}>→</Text>
          </TouchableOpacity>
        </Card>

        <Card>
          <Text style={{fontWeight:"700",fontSize:16,color:txt,marginBottom:6}}>🧾 Gastos deducibles</Text>
          <Text style={{fontSize:12,color:muted,marginBottom:10}}>Guardá facturas timbradas — cada una baja tu impuesto.</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
            {(rubroObj?.gastos||[]).map(g=>(
              <View key={g} style={{paddingHorizontal:12,paddingVertical:7,borderRadius:100,backgroundColor:input}}>
                <Text style={{fontSize:12,fontWeight:"600",color:txt}}>✓ {g}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={{textAlign:"center",fontSize:11,color:muted,marginTop:6,marginBottom:20}}>Conta PY · Basado en normativa DNIT Paraguay · Verificá en dnit.gov.py</Text>
      </ScrollView>

      <Modal visible={chatOpen} transparent animationType="slide" onRequestClose={()=>setChatOpen(false)}>
        <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"flex-end"}}>
          <View style={{backgroundColor:card,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,height:"85%",paddingBottom:36}}>
            <View style={{width:40,height:4,borderRadius:2,backgroundColor:border,alignSelf:"center",marginBottom:16}}/>
            <View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:14}}>
              <View style={{width:44,height:44,borderRadius:14,backgroundColor:ACCENT+"22",alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:22}}>🤖</Text></View>
              <View style={{flex:1}}><Text style={{fontWeight:"800",fontSize:17,color:txt}}>Asistente Conta PY</Text><Text style={{fontSize:12,color:muted}}>{rubroObj?.label} · {combObj?.label}</Text></View>
              <TouchableOpacity onPress={()=>setChatOpen(false)} style={{width:32,height:32,borderRadius:16,backgroundColor:input,alignItems:"center",justifyContent:"center"}}><Text style={{color:txt,fontSize:16}}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={{flex:1}} contentContainerStyle={{gap:10,paddingBottom:10}}>
              {mensajes.length===0 && (
                <View style={{alignItems:"center",padding:20}}>
                  <Text style={{fontSize:32,marginBottom:10}}>💬</Text>
                  <Text style={{fontWeight:"700",color:txt,marginBottom:6}}>¿En qué te ayudo?</Text>
                  <Text style={{fontSize:13,color:muted,marginBottom:16,textAlign:"center"}}>Preguntame sobre tus impuestos u obligaciones.</Text>
                  {["¿Qué tengo que hacer este mes?","Cobré G. 800.000, ¿qué registro?","¿Por qué tengo que declarar sin movimiento?"].map(s=>(
                    <TouchableOpacity key={s} onPress={()=>setChatInput(s)} style={{width:"100%",padding:12,borderRadius:12,borderWidth:1,borderColor:border,backgroundColor:input,marginBottom:8}}>
                      <Text style={{color:txt,fontSize:13}}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {mensajes.map((m,i)=>(
                <View key={i} style={{alignSelf:m.rol==="user"?"flex-end":"flex-start",maxWidth:"85%",padding:12,borderRadius:16,backgroundColor:m.rol==="user"?ACCENT:input}}>
                  <Text style={{color:m.rol==="user"?"#fff":txt,fontSize:14,lineHeight:20}}>{m.texto}</Text>
                </View>
              ))}
              {pensando && <View style={{alignSelf:"flex-start",padding:12,borderRadius:16,backgroundColor:input}}><Text style={{color:muted,fontSize:14}}>Pensando...</Text></View>}
            </ScrollView>
            <View style={{flexDirection:"row",gap:8,paddingTop:10,borderTopWidth:1,borderTopColor:border}}>
              <TextInput style={{flex:1,padding:12,borderRadius:14,borderWidth:1.5,borderColor:border,backgroundColor:input,fontSize:15,color:txt}} placeholder="Escribí tu consulta..." placeholderTextColor={muted} value={chatInput} onChangeText={setChatInput} onSubmitEditing={enviarMensaje} />
              <TouchableOpacity onPress={enviarMensaje} disabled={pensando||!chatInput.trim()}
                style={{padding:12,borderRadius:14,backgroundColor:ACCENT,alignItems:"center",justifyContent:"center",opacity:pensando||!chatInput.trim()?0.5:1}}>
                <Text style={{color:"#fff",fontSize:18,fontWeight:"700"}}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!porQueModal} transparent animationType="slide" onRequestClose={()=>setPorQueModal(null)}>
        <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"flex-end"}}>
          <View style={{backgroundColor:card,borderTopLeftRadius:28,borderTopRightRadius:28,padding:22,paddingBottom:36}}>
            <View style={{width:40,height:4,borderRadius:2,backgroundColor:border,alignSelf:"center",marginBottom:18}}/>
            {porQueModal && (<>
              <View style={{flexDirection:"row",gap:12,alignItems:"center",marginBottom:16}}>
                <View style={{width:52,height:52,borderRadius:16,backgroundColor:OBS[porQueModal].color+"22",alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:26}}>{OBS[porQueModal].ico}</Text></View>
                <View><Text style={{fontWeight:"800",fontSize:18,color:txt}}>{OBS[porQueModal].nombre}</Text><Text style={{fontSize:12,color:muted}}>Código {OBS[porQueModal].cod} · Formulario {OBS[porQueModal].form}</Text></View>
              </View>
              <Text style={{fontWeight:"700",fontSize:15,color:txt,marginBottom:6}}>¿Por qué tengo esta obligación?</Text>
              <Text style={{fontSize:13,color:muted,lineHeight:20,marginBottom:16}}>{OBS[porQueModal].porQue}</Text>
              <Text style={{fontWeight:"700",fontSize:15,color:txt,marginBottom:6}}>¿Qué significa?</Text>
              <Text style={{fontSize:13,color:muted,lineHeight:20,marginBottom:20}}>{OBS[porQueModal].desc}</Text>
              <TouchableOpacity onPress={()=>setPorQueModal(null)} style={{backgroundColor:ACCENT,borderRadius:16,padding:15,alignItems:"center"}}>
                <Text style={{color:"#fff",fontWeight:"700",fontSize:15}}>Entendido ✓</Text>
              </TouchableOpacity>
            </>)}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
