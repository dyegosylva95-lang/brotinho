"use client";
import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════
//  CONFIG STRIPE — substitua com suas chaves reais
// ═══════════════════════════════════════════════════════════
const STRIPE_CONFIG = {
  publishableKey: "pk_test_SUA_CHAVE_AQUI", // <-- sua chave pública Stripe
  priceId: "price_SEU_PRICE_ID_AQUI",        // <-- price ID do produto R$29,90/mês
  successUrl: "https://brotinho-azure.vercel.app/?stripe=success",
  cancelUrl:  "https://brotinho-azure.vercel.app/?stripe=cancel",
};

// ═══════════════════════════════════════════════════════════
//  PLANO FREEMIUM — o que é bloqueado no gratuito
// ═══════════════════════════════════════════════════════════
const PLAN_LIMITS = {
  free: {
    articles: 3,          // apenas 3 artigos liberados
    chatMessages: 5,      // 5 mensagens por dia na IA
    healthTracking: false, // saúde bloqueada
    diary: false,          // diário bloqueado
    exams: false,          // exames bloqueado
    enxoval: true,         // liberado
    babyDev: true,         // liberado
    notifications: true,   // liberado
  },
  premium: {
    articles: Infinity,
    chatMessages: Infinity,
    healthTracking: true,
    diary: true,
    exams: true,
    enxoval: true,
    babyDev: true,
    notifications: true,
  },
};

// IDs dos artigos liberados no plano gratuito (os 3 primeiros)
const FREE_ARTICLE_IDS = [1, 4, 9];

// ═══════════════════════════════════════════════════════════
//  PALETA & DADOS GLOBAIS
// ═══════════════════════════════════════════════════════════
const C = {
  bg:"#f7f5f0",card:"#ffffff",dark:"#1a1a2e",dark2:"#16213e",
  mint:"#4ecba1",mint2:"#2a9d72",mintLight:"#e8f8f2",
  peach:"#ff8a65",peach2:"#f4714e",peachLight:"#fff0eb",
  yellow:"#ffd54f",yellowLight:"#fffde7",
  lilac:"#b388ff",lilacLight:"#f3eeff",
  sky:"#64b5f6",skyLight:"#e3f2fd",
  rose:"#f06292",roseLight:"#fce4ec",
  muted:"#8a8a9a",border:"#ebebf0",warm:"#f2ede4",
  gold:"#f59e0b",goldLight:"#fffbeb",
  premium:"#7c3aed",premiumLight:"#ede9fe",
};

const WEEKS=[
  {w:4,fruit:"🫐",name:"Mirtilo",size:"0.4cm",weight:"1g",desc:"O coração começa a bater! Estrutura do cérebro se forma."},
  {w:6,fruit:"🍇",name:"Uva",size:"0.6cm",weight:"2g",desc:"Olhos, nariz e boca começam a aparecer. Braços surgem."},
  {w:8,fruit:"🫒",name:"Azeitona",size:"1.6cm",weight:"3g",desc:"Todos os órgãos essenciais já existem. Bebê se mexe!"},
  {w:10,fruit:"🍓",name:"Morango",size:"3cm",weight:"4g",desc:"Unhas e cabelos começam a crescer. Reflexos aparecem."},
  {w:12,fruit:"🍋",name:"Limão",size:"5.4cm",weight:"14g",desc:"Fim do 1º trimestre! Risco de aborto cai bastante."},
  {w:14,fruit:"🥝",name:"Kiwi",size:"8.7cm",weight:"43g",desc:"Bebê faz caretas! Já pode chupar o dedinho."},
  {w:16,fruit:"🥑",name:"Abacate",size:"11cm",weight:"100g",desc:"Você pode começar a sentir os primeiros movimentos."},
  {w:20,fruit:"🍌",name:"Banana",size:"16cm",weight:"300g",desc:"Morfológico! Bebê ouve sua voz e reage a sons."},
  {w:24,fruit:"🌽",name:"Milho",size:"30cm",weight:"600g",desc:"Bebê abre os olhos! Tem padrão de sono e vigília."},
  {w:28,fruit:"🍆",name:"Berinjela",size:"35cm",weight:"1kg",desc:"3º trimestre! Bebê pisca e sonha durante o sono REM."},
  {w:32,fruit:"🥦",name:"Brócolis",size:"42cm",weight:"1.8kg",desc:"Bebê pratica a respiração. Pulmões quase prontos."},
  {w:36,fruit:"🥬",name:"Alface",size:"47cm",weight:"2.6kg",desc:"Considerado a termo a partir da semana 37. Quase lá!"},
  {w:40,fruit:"🍉",name:"Melancia",size:"51cm",weight:"3.4kg",desc:"Data prevista do parto! Bebê completamente desenvolvido."},
];

const EXAMS=[
  {name:"Beta HCG",week:"4–5",done:true,desc:"Confirma a gravidez"},
  {name:"Ultrassom transvaginal",week:"6–8",done:true,desc:"Batimento cardíaco"},
  {name:"Hemograma completo",week:"8–12",done:true,desc:"Saúde geral da mãe"},
  {name:"Tipagem sanguínea",week:"8–12",done:true,desc:"Fator Rh importante"},
  {name:"Toxoplasmose (IgG/IgM)",week:"8–12",done:false,next:true,desc:"Proteção fetal"},
  {name:"TSH (tireoide)",week:"8–12",done:false,desc:"Função da tireoide"},
  {name:"Translucência nucal",week:"11–14",done:false,desc:"Rastreio cromossômico"},
  {name:"Morfológico 1º tri",week:"11–14",done:false,desc:"Anatomia completa"},
  {name:"Glicemia de jejum",week:"24–28",done:false,desc:"Diabetes gestacional"},
  {name:"Morfológico 2º tri",week:"20–24",done:false,desc:"Sexo + anatomia detalhada"},
  {name:"Teste tolerância glicose",week:"24–28",done:false,desc:"DTG - diabetes"},
  {name:"Estreptococo grupo B",week:"35–37",done:false,desc:"Segurança no parto"},
];

const SYMPTOMS=[
  {emoji:"😴",label:"Cansaço"},{emoji:"🤢",label:"Náusea"},{emoji:"😊",label:"Bem"},
  {emoji:"😰",label:"Ansiedade"},{emoji:"💪",label:"Energia"},{emoji:"😭",label:"Choro"},
  {emoji:"🔥",label:"Azia"},{emoji:"💤",label:"Insônia"},
];

const DIARY_INIT=[
  {date:"Hoje",mood:"😊",text:"Senti o bebê se mexer pela primeira vez! Foi incrível, como uma borboleta na barriga.",week:14},
  {date:"3 dias atrás",mood:"🤢",text:"Náusea voltou de manhã. Biscoito de água ajudou bastante.",week:13},
  {date:"1 semana atrás",mood:"💪",text:"Ultrassom incrível! Vi o coração bater e chorei muito.",week:13},
];

const TIPS=[
  {emoji:"💊",tip:"Ácido fólico até a 12ª semana reduz defeitos do tubo neural em até 70%."},
  {emoji:"🚶",tip:"Caminhada leve de 30 min/dia melhora o sono e reduz inchaço."},
  {emoji:"🥦",tip:"Ferro + vitamina C juntos: a absorção do ferro aumenta 3x."},
  {emoji:"🧘",tip:"Meditação pré-natal reduz ansiedade e pode facilitar o parto."},
  {emoji:"💧",tip:"2,3 litros de água por dia durante a gestação é o recomendado."},
  {emoji:"🐟",tip:"Ômega-3 (sardinha, salmão) favorece o desenvolvimento cerebral."},
];

const NOTIFS_INIT=[
  {id:1,icon:"💉",title:"Toxoplasmose pendente",desc:"Exame da semana 8–12 ainda não marcado.",time:"Hoje",read:false,type:"exam"},
  {id:2,icon:"🥝",title:"Semana 14 — Kiwi!",desc:"Seu bebê tem o tamanho de um kiwi agora.",time:"Hoje",read:false,type:"week"},
  {id:3,icon:"🧘",title:"Hora da meditação",desc:"10 minutos de meditação fazem diferença!",time:"Ontem",read:false,type:"tip"},
  {id:4,icon:"💊",title:"Lembrete de vitaminas",desc:"Tomou o ácido fólico hoje?",time:"Ontem",read:true,type:"reminder"},
  {id:5,icon:"📅",title:"Consulta pré-natal",desc:"Próxima consulta na semana 16. Lembre o cartão.",time:"2 dias",read:true,type:"appointment"},
];

const ENXOVAL=[
  {cat:"🛏️ Quarto",items:[
    {name:"Berço ou moisés",done:false,priority:"alta",price:"R$200–800"},
    {name:"Colchão firme para berço",done:false,priority:"alta",price:"R$80–200"},
    {name:"Kit berço (2–3 jogos)",done:true,priority:"alta",price:"R$60–150"},
    {name:"Trocador",done:false,priority:"alta",price:"R$50–200"},
    {name:"Luminária noturna",done:false,priority:"média",price:"R$30–100"},
  ]},
  {cat:"👕 Roupinhas",items:[
    {name:"Bodies 0–3 meses: 7–10 peças",done:true,priority:"alta",price:"R$20–50 cada"},
    {name:"Macacões: 5 peças",done:true,priority:"alta",price:"R$25–60 cada"},
    {name:"Meias: 6–8 pares",done:false,priority:"alta",price:"R$15–30 pack"},
    {name:"Luvas para bebê: 3 pares",done:false,priority:"alta",price:"R$10–20"},
    {name:"Toucas de algodão: 4 und.",done:false,priority:"média",price:"R$10–25 cada"},
  ]},
  {cat:"🍼 Alimentação",items:[
    {name:"Bomba de amamentar",done:false,priority:"alta",price:"R$150–500"},
    {name:"Copinhos de silicone p/ leite",done:false,priority:"alta",price:"R$40–80"},
    {name:"Mamadeiras (2–3 unidades)",done:false,priority:"média",price:"R$30–80 cada"},
    {name:"Esterilizador",done:false,priority:"média",price:"R$80–200"},
  ]},
  {cat:"🛁 Higiene",items:[
    {name:"Banheira de bebê",done:true,priority:"alta",price:"R$60–200"},
    {name:"Termômetro digital",done:false,priority:"alta",price:"R$30–80"},
    {name:"Aspirador nasal",done:false,priority:"alta",price:"R$20–60"},
    {name:"Fraldas RN (2 pacotes)",done:true,priority:"alta",price:"R$40–70 cada"},
    {name:"Lenços umedecidos s/ álcool",done:true,priority:"alta",price:"R$15–30 pack"},
    {name:"Pomada para assaduras",done:false,priority:"alta",price:"R$15–40"},
  ]},
  {cat:"🚗 Segurança",items:[
    {name:"Bebê conforto (lei!)",done:false,priority:"URGENTE",price:"R$200–600"},
    {name:"Carrinho de bebê",done:false,priority:"alta",price:"R$300–1500"},
    {name:"Bolsa maternidade",done:true,priority:"alta",price:"R$80–250"},
  ]},
];

const MILESTONES=[
  {week:0,emoji:"🤱",title:"Recém-nascido",done:true,topics:["Pega no peito","Coto umbilical","Sono 16–18h/dia","Choro = comunicação"]},
  {week:4,emoji:"👀",title:"1 mês",done:true,topics:["Foca rostos a 25cm","Primeiros sorrisos","Segura o dedo","Vacina: Hep B 2ª dose"]},
  {week:8,emoji:"😄",title:"2 meses",done:false,current:true,topics:["Sorriso social real","Balbucia sons","Reconhece sua voz","Vacinas: Pentavalente, Pneumo"]},
  {week:12,emoji:"🙃",title:"3 meses",done:false,topics:["Sustenta a cabeça","Chupeta ok!","Rola de um lado","Tummy time 3x/dia"]},
  {week:24,emoji:"🥣",title:"6 meses",done:false,topics:["Introdução alimentar!","Senta com apoio","Primeiros dentinhos","Vacina: Meningocócica C"]},
  {week:36,emoji:"🚶",title:"9 meses",done:false,topics:["Engatinha","Fica em pé com apoio","Diz mama/papa","Pinça digital"]},
  {week:52,emoji:"🎂",title:"1 aninho!",done:false,topics:["Primeiros passos!","2–5 palavras","Bebe no copo","Festa de 1 ano 🎉"]},
];

const VACCINES_BABY=[
  {name:"Hepatite B",when:"Ao nascer",done:true},{name:"BCG",when:"Ao nascer",done:true},
  {name:"Hepatite B (2ª)",when:"1 mês",done:true},
  {name:"Pentavalente (1ª)",when:"2 meses",done:false,next:true},
  {name:"VIP Pólio (1ª)",when:"2 meses",done:false},
  {name:"Pneumocócica 10 (1ª)",when:"2 meses",done:false},
  {name:"Rotavírus (1ª)",when:"2 meses",done:false},
  {name:"Meningocócica C",when:"3 meses",done:false},
  {name:"Pentavalente (2ª)",when:"4 meses",done:false},
  {name:"Tríplice Viral",when:"12 meses",done:false},
];

// ═══════════════════════════════════════════════════════════
//  LOGO & ÍCONES
// ═══════════════════════════════════════════════════════════
function Logo({size=32,glow=false}){
  return(
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <defs>
        <radialGradient id="lg" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#5dd6b0"/><stop offset="100%" stopColor="#2a9d72"/>
        </radialGradient>
        <radialGradient id="lb" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffe4cc"/><stop offset="100%" stopColor="#ffcba4"/>
        </radialGradient>
        {glow&&<filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#4ecba1" floodOpacity="0.5"/></filter>}
      </defs>
      <rect width="200" height="200" rx="48" fill="url(#lg)" filter={glow?"url(#glow)":undefined}/>
      <path d="M100 155 C60 130 30 110 30 82 C30 65 43 55 58 55 C72 55 84 64 100 78 C116 64 128 55 142 55 C157 55 170 65 170 82 C170 110 140 130 100 155Z" fill="rgba(255,255,255,0.1)"/>
      <ellipse cx="100" cy="115" rx="38" ry="32" fill="url(#lb)" transform="rotate(-15 100 115)"/>
      <circle cx="78" cy="88" r="26" fill="url(#lb)"/>
      <ellipse cx="70" cy="80" rx="10" ry="7" fill="rgba(255,255,255,0.2)" transform="rotate(-20 70 80)"/>
      <path d="M70 88 Q74 85 78 88" stroke="#c8855a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M82 87 Q86 84 90 87" stroke="#c8855a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M76 98 Q80 102 84 98" stroke="#c8855a" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M100 100 Q115 92 122 102 Q128 112 118 118 Q110 122 104 114" fill="url(#lb)"/>
      <path d="M88 140 Q80 155 90 162 Q100 167 105 155 Q108 145 100 138Z" fill="url(#lb)"/>
      <path d="M110 138 Q118 150 112 160 Q106 168 98 160 Q92 152 96 142Z" fill="#ffcba4"/>
      <path d="M148 28 C148 28 136 18 124 26 C118 30 116 38 120 44 C126 52 140 48 148 40Z" fill="#fff" opacity="0.9"/>
      <circle cx="30" cy="40" r="3" fill="rgba(255,255,255,0.4)"/>
      <circle cx="170" cy="35" r="2" fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}

const Wordmark=({dark=false})=>(
  <span style={{fontFamily:"'Baloo 2',cursive",fontSize:20,fontWeight:800,color:dark?C.dark:"#fff"}}>
    broti<span style={{color:C.mint}}>nho</span><span style={{color:C.peach}}>.</span>
  </span>
);

function Ico({d,size=20,color=C.dark,fill="none",sw="1.8"}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}
const IcoHome  = p=><Ico {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/>;
const IcoBaby  = p=><svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke={p.color||C.dark} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="5"/><path d="M12 13c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"/></svg>;
const IcoHeart = p=><Ico {...p} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={p.filled?p.color:"none"}/>;
const IcoBell  = p=><Ico {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0"/>;
const IcoChat  = p=><Ico {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>;
const IcoSend  = p=><Ico {...p} d="M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z"/>;
const IcoCheck = p=><Ico {...p} d="M20 6L9 17l-5-5" sw="2.5"/>;
const IcoPlus  = p=><Ico {...p} d="M12 5v14 M5 12h14"/>;
const IcoX     = p=><Ico {...p} d="M18 6L6 18 M6 6l12 12"/>;
const IcoBag   = p=><Ico {...p} d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0"/>;
const IcoPulse = p=><Ico {...p} d="M22 12h-4l-3 9L9 3l-3 9H2"/>;
const IcoBack  = p=><Ico {...p} d="M19 12H5 M12 5l-7 7 7 7"/>;
const IcoStar  = p=><Ico {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={p.filled?"currentColor":"none"}/>;
const IcoLock  = p=><Ico {...p} d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4"/>;
const IcoCrown = p=><svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill={p.fill||"none"} stroke={p.color||C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M5 20l-1-9 5 4 3-7 3 7 5-4-1 9H5z"/></svg>;

// ═══════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════
function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:16,...style,cursor:onClick?"pointer":"default"}}>{children}</div>;
}
function Chip({label,color=C.mint,bg=C.mintLight,style={}}){
  return <span style={{display:"inline-block",background:bg,color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100,letterSpacing:0.5,...style}}>{label}</span>;
}
function ScreenHeader({label,title,rightContent}){
  return(
    <div style={{background:C.dark,padding:"52px 22px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(255,255,255,0.35)",marginBottom:6}}>{label}</div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontSize:26,fontWeight:800,color:"#fff",letterSpacing:-0.5,lineHeight:1.15}}>{title}</div>
        </div>
        {rightContent}
      </div>
    </div>
  );
}

// ─── Paywall Component ─────────────────────────────────────
function PaywallBanner({feature,onUpgrade,compact=false}){
  const features={
    saude:{icon:"📊",title:"Monitoramento de Saúde",desc:"Registre peso, pressão e circunferência. Visualize gráficos da sua gestação."},
    diary:{icon:"📖",title:"Diário da Gestação",desc:"Crie memórias inesquecíveis para o seu bebê. Registre emoções e momentos."},
    exams:{icon:"🧪",title:"Controle de Exames",desc:"Acompanhe todos os exames pré-natais com lembretes automáticos."},
    articles:{icon:"📰",title:"Biblioteca Completa",desc:"Acesse todos os 14 artigos sobre nutrição, saúde, desenvolvimento e parto."},
    chat:{icon:"🤖",title:"IA Ilimitada",desc:"Converse sem limites com a IA especialista em obstetrícia e pediatria."},
  };
  const f=features[feature]||features.articles;

  if(compact){
    return(
      <div onClick={onUpgrade} style={{background:`linear-gradient(135deg,${C.premium},#9333ea)`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:12}}>
        <div style={{fontSize:24,flexShrink:0}}>👑</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:13,color:"#fff",marginBottom:2}}>Desbloqueie com Premium</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.75)"}}>R$29,90/mês · Cancele quando quiser</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"5px 12px",fontSize:11,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>Ver planos →</div>
      </div>
    );
  }

  return(
    <div style={{padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
      <div style={{width:80,height:80,borderRadius:24,background:`linear-gradient(135deg,${C.premium}22,${C.gold}22)`,border:`2px solid ${C.premium}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:16}}>{f.icon}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <IcoLock size={14} color={C.premium}/>
        <span style={{fontSize:11,color:C.premium,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Recurso Premium</span>
      </div>
      <div style={{fontFamily:"'Baloo 2',cursive",fontSize:20,fontWeight:800,color:C.dark,marginBottom:8,lineHeight:1.2}}>{f.title}</div>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:24,maxWidth:280}}>{f.desc}</div>
      <button onClick={onUpgrade} style={{background:`linear-gradient(135deg,${C.premium},#9333ea)`,border:"none",borderRadius:14,padding:"14px 32px",fontSize:14,fontWeight:800,fontFamily:"'Baloo 2',cursive",color:"#fff",cursor:"pointer",width:"100%",maxWidth:280,boxShadow:`0 8px 24px ${C.premium}44`}}>
        👑 Ver planos Premium
      </button>
      <div style={{fontSize:11,color:C.muted,marginTop:10}}>R$29,90/mês · Cancele quando quiser</div>
    </div>
  );
}

// ─── Onboarding shared ────────────────────────────────────
function OInput({label,type="text",value,onChange,placeholder,icon,error,hint}){
  const [show,setShow]=useState(false);
  const isP=type==="password";
  return(
    <div style={{marginBottom:15}}>
      {label&&<div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:5}}>{label}</div>}
      <div style={{position:"relative"}}>
        {icon&&<div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:17,pointerEvents:"none"}}>{icon}</div>}
        <input type={isP&&show?"text":type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",border:`1.5px solid ${error?C.peach:C.border}`,borderRadius:13,
            padding:`13px ${isP?44:13}px 13px ${icon?42:13}px`,fontSize:14,fontFamily:"inherit",
            outline:"none",color:C.dark,background:C.card,transition:"border-color 0.2s",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor=error?C.peach:C.mint}
          onBlur={e=>e.target.style.borderColor=error?C.peach:C.border}/>
        {isP&&<div onClick={()=>setShow(!show)} style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:17,opacity:0.5}}>{show?"🙈":"👁️"}</div>}
      </div>
      {error&&<div style={{fontSize:11,color:C.peach,marginTop:4,fontWeight:600}}>⚠️ {error}</div>}
      {hint&&!error&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{hint}</div>}
    </div>
  );
}

function OBtn({children,onClick,variant="primary",disabled=false,loading=false,style={}}){
  const s={
    primary:{background:`linear-gradient(135deg,${C.mint},${C.mint2})`,color:"#fff",border:"none"},
    dark:{background:C.dark,color:"#fff",border:"none"},
    outline:{background:"transparent",color:C.dark,border:`1.5px solid ${C.border}`},
    ghost:{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.12)"},
    premium:{background:`linear-gradient(135deg,${C.premium},#9333ea)`,color:"#fff",border:"none"},
  };
  return(
    <button onClick={onClick} disabled={disabled||loading}
      style={{width:"100%",padding:"14px",borderRadius:13,fontSize:14,fontWeight:700,fontFamily:"'Baloo 2',cursive",
        cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled?0.5:1,transition:"all 0.2s",...s[variant],...style}}>
      {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{width:15,height:15,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
        Aguarde…</span>:children}
    </button>
  );
}

function ProgressDots({step,total}){
  return(
    <div style={{display:"flex",gap:6,marginBottom:24}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{flex:1,height:4,borderRadius:100,background:i<step?C.mint:C.border,transition:"background 0.3s"}}/>
      ))}
    </div>
  );
}

function BackBtn({onClick}){
  return(
    <div onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:13,fontWeight:600,marginBottom:18}}>
      <IcoBack size={16} color="rgba(255,255,255,0.5)"/>Voltar
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TELA DE PLANOS — Premium R$29,90/mês
// ═══════════════════════════════════════════════════════════
function PlansScreen({onClose,onSuccess,currentPlan="free"}){
  const [loading,setLoading]=useState(false);
  const [annual,setAnnual]=useState(false);
  const [stripeLoaded,setStripeLoaded]=useState(false);

  // Carrega Stripe.js dinamicamente
  useEffect(()=>{
    if(window.Stripe){setStripeLoaded(true);return;}
    const script=document.createElement("script");
    script.src="https://js.stripe.com/v3/";
    script.onload=()=>setStripeLoaded(true);
    document.head.appendChild(script);
  },[]);

  const monthlyPrice=29.90;
  const annualPrice=(monthlyPrice*12*0.8).toFixed(2); // 20% off anual
  const annualMonthly=(monthlyPrice*0.8).toFixed(2);

  const handleCheckout=async()=>{
    setLoading(true);
    try{
      // ── Opção 1: Stripe Checkout (redireciona para página do Stripe)
      // Use esta se você tiver um backend/edge function criando a Checkout Session
      //
      // const res = await fetch("/api/create-checkout-session", {
      //   method: "POST",
      //   headers: {"Content-Type":"application/json"},
      //   body: JSON.stringify({ priceId: STRIPE_CONFIG.priceId, annual }),
      // });
      // const { url } = await res.json();
      // window.location.href = url;

      // ── Opção 2: Stripe.js direto (sem backend — só para testar)
      // ATENÇÃO: em produção, crie a session no servidor!
      if(!window.Stripe){
        alert("Stripe não carregado. Verifique sua conexão.");
        setLoading(false);
        return;
      }
      const stripe=window.Stripe(STRIPE_CONFIG.publishableKey);
      await stripe.redirectToCheckout({
        lineItems:[{price: STRIPE_CONFIG.priceId, quantity:1}],
        mode:"subscription",
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl:  STRIPE_CONFIG.cancelUrl,
        locale:"pt-BR",
      });
    }catch(err){
      console.error("Stripe error:",err);
      alert("Erro ao iniciar pagamento. Tente novamente.");
    }
    setLoading(false);
  };

  // Verifica retorno do Stripe (após redirect)
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("stripe")==="success"){
      onSuccess?.();
      window.history.replaceState({},"",window.location.pathname);
    }
  },[]);

  const freeFeatures=[
    {ok:true,  label:"Desenvolvimento do bebê semana a semana"},
    {ok:true,  label:"3 artigos da biblioteca"},
    {ok:true,  label:"Checklist do enxoval"},
    {ok:true,  label:"5 mensagens/dia na IA"},
    {ok:false, label:"Monitoramento de saúde (peso, pressão)"},
    {ok:false, label:"Diário da gestação"},
    {ok:false, label:"Controle de exames pré-natais"},
    {ok:false, label:"Biblioteca completa (14 artigos)"},
    {ok:false, label:"IA ilimitada 24h"},
    {ok:false, label:"Relatórios para o obstetra"},
  ];

  const premFeatures=[
    {ok:true,label:"Tudo do plano Gratuito"},
    {ok:true,label:"📊 Saúde: peso, pressão, barriga"},
    {ok:true,label:"📖 Diário ilimitado da gestação"},
    {ok:true,label:"🧪 Controle de todos os exames"},
    {ok:true,label:"📰 Biblioteca completa (14 artigos)"},
    {ok:true,label:"🤖 IA Brotinho ilimitada 24h"},
    {ok:true,label:"📈 Relatórios para o médico"},
    {ok:true,label:"🔔 Lembretes personalizados"},
    {ok:true,label:"⭐ Suporte prioritário"},
    {ok:true,label:"✨ Sem anúncios, para sempre"},
  ];

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:C.bg,overflowY:"auto",maxWidth:430,margin:"0 auto"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(160deg,${C.dark} 0%,#2d1b69 100%)`,padding:"52px 22px 36px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.3),transparent)"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(78,203,161,0.15),transparent)"}}/>
        {onClose&&(
          <div onClick={onClose} style={{position:"absolute",top:52,right:22,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <IcoX size={15} color="rgba(255,255,255,0.7)"/>
          </div>
        )}
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#f59e0b,#d97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 8px 20px rgba(245,158,11,0.4)"}}>👑</div>
            <div>
              <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:18,color:"#fff",lineHeight:1}}>Brotinho Premium</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2}}>Tudo para viver cada fase com amor</div>
            </div>
          </div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontSize:26,fontWeight:800,color:"#fff",lineHeight:1.2,marginBottom:6}}>
            Cuide melhor de você<br/>e do seu <span style={{color:C.mint}}>brotinho</span> 🌱
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Mais de 5.000 mães já escolheram o Premium</div>
        </div>
      </div>

      <div style={{padding:"22px 20px"}}>
        {/* Toggle Mensal/Anual */}
        <div style={{display:"flex",background:C.warm,borderRadius:13,padding:4,marginBottom:20,gap:4}}>
          {[[false,"Mensal"],[true,"Anual · 20% OFF 🎉"]].map(([val,label])=>(
            <div key={String(val)} onClick={()=>setAnnual(val)} style={{flex:1,textAlign:"center",padding:"10px 8px",borderRadius:10,background:annual===val?C.card:"transparent",fontSize:12,fontWeight:annual===val?700:400,color:annual===val?C.dark:C.muted,cursor:"pointer",transition:"all 0.2s",boxShadow:annual===val?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>{label}</div>
          ))}
        </div>

        {/* Cards de Plano */}
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:22}}>

          {/* Plano Gratuito */}
          <div style={{background:C.card,border:`2px solid ${currentPlan==="free"?C.mint:C.border}`,borderRadius:20,overflow:"hidden"}}>
            {currentPlan==="free"&&<div style={{background:`linear-gradient(90deg,${C.mint},${C.mint2})`,padding:"6px 16px",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>✓ Seu plano atual</div>}
            <div style={{padding:"18px 18px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:18,color:C.dark}}>Gratuito</div>
                  <div style={{fontSize:12,color:C.muted}}>Para começar a jornada</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:C.dark}}>R$0</div>
                  <div style={{fontSize:10,color:C.muted}}>para sempre</div>
                </div>
              </div>
              {freeFeatures.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:7}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:f.ok?C.mintLight:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    {f.ok?<IcoCheck size={10} color={C.mint2}/>:<IcoX size={9} color={C.muted}/>}
                  </div>
                  <span style={{fontSize:12,color:f.ok?C.dark:C.muted,lineHeight:1.5,textDecoration:f.ok?"none":"none"}}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plano Premium */}
          <div style={{background:`linear-gradient(160deg,#1a0533,#2d1b69)`,border:`2px solid ${C.premium}`,borderRadius:20,overflow:"hidden",position:"relative",boxShadow:`0 16px 48px ${C.premium}33`}}>
            <div style={{background:`linear-gradient(90deg,${C.gold},#f97316)`,padding:"6px 16px",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>
              <span>👑</span> Mais popular · Recomendado
            </div>
            {/* Estrelas decorativas */}
            <div style={{position:"absolute",top:50,right:20,fontSize:20,opacity:0.3,animation:"logoF 3s ease-in-out infinite"}}>✨</div>
            <div style={{position:"absolute",top:80,right:50,fontSize:12,opacity:0.2,animation:"logoF 4s ease-in-out infinite reverse"}}>⭐</div>

            <div style={{padding:"18px 18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:18,color:"#fff"}}>Premium</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Experiência completa</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {annual&&<div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textDecoration:"line-through",marginBottom:2}}>R${monthlyPrice.toFixed(2)}/mês</div>}
                  <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:"#fff"}}>
                    R${annual?annualMonthly:monthlyPrice.toFixed(2)}
                  </div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>
                    {annual?`/mês · R$${annualPrice}/ano`:"por mês"}
                  </div>
                  {annual&&<div style={{background:"rgba(245,158,11,0.2)",border:"1px solid rgba(245,158,11,0.4)",borderRadius:100,padding:"2px 9px",fontSize:10,color:C.gold,fontWeight:700,marginTop:4}}>Economize R${(monthlyPrice*12*0.2).toFixed(2)}/ano</div>}
                </div>
              </div>
              {premFeatures.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:8}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(78,203,161,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    <IcoCheck size={10} color={C.mint}/>
                  </div>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.85)",lineHeight:1.5}}>{f.label}</span>
                </div>
              ))}

              <button onClick={handleCheckout} disabled={loading||currentPlan==="premium"}
                style={{width:"100%",marginTop:18,background:currentPlan==="premium"?"rgba(255,255,255,0.1)":`linear-gradient(135deg,${C.gold},#f97316)`,border:"none",borderRadius:14,padding:"15px",fontSize:14,fontWeight:800,fontFamily:"'Baloo 2',cursive",color:"#fff",cursor:currentPlan==="premium"?"default":"pointer",boxShadow:currentPlan==="premium"?"none":"0 8px 24px rgba(245,158,11,0.4)",transition:"all 0.2s"}}>
                {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span style={{width:15,height:15,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                  Redirecionando…</span>
                :currentPlan==="premium"?"✓ Você já é Premium! 🎉":"👑 Assinar Premium agora →"}
              </button>
              {currentPlan!=="premium"&&<div style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:10}}>🔒 Pagamento seguro · Cancele quando quiser · Sem fidelidade</div>}
            </div>
          </div>
        </div>

        {/* Depoimentos */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:12,textAlign:"center"}}>O que dizem as mães</div>
          {[
            {name:"Ana C., SP",stars:5,text:"A IA respondeu às 3h da manhã quando meu bebê não parava de chorar. Salvou minha sanidade! 😭"},
            {name:"Júlia M., RJ",stars:5,text:"O controle de exames me lembrou de um que eu esqueci. Não sei o que faria sem o Brotinho."},
            {name:"Fernanda L., BH",stars:5,text:"Vale cada centavo. Uso todo dia da gestação. Estou na semana 28 e não abro mão!"},
          ].map((t,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:9}}>
              <div style={{display:"flex",gap:2,marginBottom:8}}>
                {Array(t.stars).fill(0).map((_,j)=><span key={j} style={{color:C.gold,fontSize:13}}>★</span>)}
              </div>
              <div style={{fontSize:13,color:C.dark,lineHeight:1.6,marginBottom:8,fontStyle:"italic"}}>"{t.text}"</div>
              <div style={{fontSize:11,color:C.muted,fontWeight:700}}>— {t.name}</div>
            </div>
          ))}
        </div>

        {/* FAQ rápido */}
        <div style={{background:C.warm,borderRadius:16,padding:"16px 18px",marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:12}}>Perguntas frequentes</div>
          {[
            ["Posso cancelar quando quiser?","Sim! Cancele a qualquer momento direto pelo Stripe, sem burocracia."],
            ["Funciona no iOS e Android?","Sim, o Brotinho funciona em qualquer navegador mobile."],
            ["Minha assinatura vale na gestação e pós-parto?","Sim! Uma assinatura cobre todas as funcionalidades dos dois modos."],
          ].map(([q,a],i)=>(
            <div key={i} style={{marginBottom:i<2?12:0}}>
              <div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:3}}>❓ {q}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6,paddingLeft:18}}>{a}</div>
              {i<2&&<div style={{borderBottom:`1px solid ${C.border}`,marginTop:12}}/>}
            </div>
          ))}
        </div>

        {onClose&&(
          <button onClick={onClose} style={{width:"100%",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:13,padding:"13px",fontSize:13,fontWeight:600,fontFamily:"inherit",color:C.muted,cursor:"pointer"}}>
            Continuar com o plano gratuito
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ONBOARDING SCREENS
// ═══════════════════════════════════════════════════════════

function Splash({onDone}){
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),700);
    const t2=setTimeout(()=>setPhase(2),2100);
    const t3=setTimeout(onDone,2800);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:C.dark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,zIndex:999,transition:"opacity 0.7s ease",opacity:phase===2?0:1}}>
      <div style={{position:"absolute",width:360,height:360,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.18),transparent)`,animation:"blobF 5s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,138,101,0.12),transparent)`,bottom:-60,right:-40,animation:"blobF 7s ease-in-out infinite reverse"}}/>
      <div style={{transform:phase>=0?"scale(1)":"scale(0.4)",opacity:phase>=0?1:0,transition:"all 0.7s cubic-bezier(0.34,1.56,0.64,1)",animation:phase===1?"logoF 2s ease-in-out infinite":"none",position:"relative",zIndex:2}}>
        <Logo size={100} glow/>
      </div>
      <div style={{textAlign:"center",transform:phase>=1?"translateY(0)":"translateY(20px)",opacity:phase>=1?1:0,transition:"all 0.6s ease 0.1s",position:"relative",zIndex:2}}>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:44,fontWeight:800,color:"#fff",letterSpacing:-2,lineHeight:1}}>
          broti<span style={{color:C.mint}}>nho</span><span style={{color:C.peach}}>.</span>
        </div>
        <div style={{fontSize:11,letterSpacing:4,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginTop:8}}>cada fase, com amor</div>
      </div>
    </div>
  );
}

function Welcome({onLogin,onRegister}){
  const slides=[
    {emoji:"🤰",title:"Acompanhe sua gestação",desc:"Semana a semana, do mirtilo à melancia. Saiba o que está acontecendo com seu bebê hoje."},
    {emoji:"📊",title:"Monitore sua saúde",desc:"Peso, pressão e barriga em um só lugar. Gráficos claros para você e seu obstetra."},
    {emoji:"🤖",title:"IA Pediatra 24h",desc:"Dúvida às 3h da manhã? Nossa IA responde na hora com base em pediatria brasileira."},
    {emoji:"👶",title:"Do pré-natal ao 1º aninho",desc:"Não para após o parto. Marcos, vacinas, enxoval e muito mais para toda a família."},
  ];
  const [cur,setCur]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setCur(c=>(c+1)%slides.length),3200);return()=>clearInterval(t);},[]);
  return(
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.12),transparent)`,top:-120,left:-120}}/>
      <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,138,101,0.1),transparent)`,bottom:220,right:-80}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 28px 32px",position:"relative"}}>
        <div style={{animation:"logoF 3s ease-in-out infinite",marginBottom:24}}><Logo size={88} glow/></div>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:42,fontWeight:800,color:"#fff",letterSpacing:-2,lineHeight:1,textAlign:"center",marginBottom:6}}>
          broti<span style={{color:C.mint}}>nho</span><span style={{color:C.peach}}>.</span>
        </div>
        <div style={{fontSize:11,letterSpacing:3,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:36}}>cada fase, com amor</div>
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:22,padding:"22px 24px",width:"100%",maxWidth:360,backdropFilter:"blur(10px)",minHeight:138}}>
          <div key={cur} style={{animation:"slideIn 0.4s ease both"}}>
            <div style={{fontSize:30,marginBottom:10}}>{slides[cur].emoji}</div>
            <div style={{fontFamily:"'Baloo 2',cursive",fontSize:17,fontWeight:800,color:"#fff",marginBottom:7,lineHeight:1.3}}>{slides[cur].title}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.65}}>{slides[cur].desc}</div>
          </div>
          <div style={{display:"flex",gap:5,marginTop:14}}>
            {slides.map((_,i)=><div key={i} onClick={()=>setCur(i)} style={{height:4,flex:i===cur?3:1,borderRadius:100,background:i===cur?C.mint:"rgba(255,255,255,0.15)",transition:"all 0.4s",cursor:"pointer"}}/>)}
          </div>
        </div>
      </div>
      <div style={{padding:"0 22px 44px",display:"flex",flexDirection:"column",gap:10}}>
        <OBtn onClick={onRegister} variant="primary">🌱 Criar conta grátis</OBtn>
        <OBtn onClick={onLogin} variant="ghost">Já tenho conta — Entrar</OBtn>
        <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:2}}>Ao continuar você aceita os Termos de Uso e Política de Privacidade</div>
      </div>
    </div>
  );
}

function Login({onBack,onSuccess,onForgot}){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [errs,setErrs]=useState({});
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    const e={};
    if(!email.trim())e.email="Email obrigatório";
    else if(!/\S+@\S+\.\S+/.test(email))e.email="Email inválido";
    if(!pass)e.pass="Senha obrigatória";
    else if(pass.length<6)e.pass="Mínimo 6 caracteres";
    if(Object.keys(e).length){setErrs(e);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,1600));
    setLoading(false);
    onSuccess({name:"Ana",email,week:14,mode:"gestacao",babyName:"",babyGender:null,plan:"free"});
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.dark,padding:"52px 22px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.12),transparent)`}}/>
        <BackBtn onClick={onBack}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><Logo size={40}/><Wordmark/></div>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-1,lineHeight:1.1}}>Bem-vinda<br/>de volta! 👋</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:6}}>Entre na sua conta Brotinho</div>
      </div>
      <div style={{flex:1,padding:"28px 22px",animation:"fadeUp 0.5s ease both"}}>
        <OInput label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon="📧" error={errs.email}/>
        <OInput label="Senha" type="password" value={pass} onChange={setPass} placeholder="Sua senha" icon="🔒" error={errs.pass}/>
        <div style={{textAlign:"right",marginTop:-8,marginBottom:18}}>
          <span onClick={onForgot} style={{fontSize:12,color:C.mint2,cursor:"pointer",fontWeight:700}}>Esqueci minha senha</span>
        </div>
        <OBtn onClick={submit} variant="dark" loading={loading}>Entrar na minha conta →</OBtn>
        <div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:16}}>
          Não tem conta? <span onClick={onBack} style={{color:C.mint2,fontWeight:700,cursor:"pointer"}}>Criar agora</span>
        </div>
      </div>
    </div>
  );
}

function Register({onBack,onNext}){
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [conf,setConf]=useState("");
  const [errs,setErrs]=useState({});
  const [loading,setLoading]=useState(false);

  const strength=pass.length===0?0:pass.length<6?1:pass.length<10?2:/[A-Z]/.test(pass)&&/[0-9]/.test(pass)?4:3;
  const sLabel=["","Fraca 😬","Razoável 😐","Boa 👍","Forte! 💪"];
  const sColor=[C.border,C.peach,"#f5c842",C.mint,C.mint2];

  const submit=async()=>{
    const e={};
    if(!name.trim())e.name="Nome obrigatório";
    if(!email.trim())e.email="Email obrigatório";
    else if(!/\S+@\S+\.\S+/.test(email))e.email="Email inválido";
    if(pass.length<6)e.pass="Mínimo 6 caracteres";
    if(pass!==conf)e.conf="Senhas não coincidem";
    if(Object.keys(e).length){setErrs(e);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,1400));
    setLoading(false);
    onNext({name,email,plan:"free"});
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.dark,padding:"52px 22px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.12),transparent)`}}/>
        <BackBtn onClick={onBack}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Logo size={38}/><Wordmark/></div>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-1,lineHeight:1.1}}>Criar sua conta 🌱</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:5,marginBottom:22}}>É rápido e gratuito!</div>
        <ProgressDots step={1} total={3}/>
      </div>
      <div style={{flex:1,padding:"24px 22px",animation:"fadeUp 0.5s ease both",overflowY:"auto"}}>
        <OInput label="Seu nome" value={name} onChange={setName} placeholder="Como podemos te chamar?" icon="👤" error={errs.name}/>
        <OInput label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon="📧" error={errs.email}/>
        <OInput label="Senha" type="password" value={pass} onChange={setPass} placeholder="Crie uma senha forte" icon="🔒" error={errs.pass}/>
        {pass.length>0&&(
          <div style={{marginTop:-9,marginBottom:13}}>
            <div style={{display:"flex",gap:4,marginBottom:4}}>
              {[1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:100,background:i<=strength?sColor[strength]:C.border,transition:"all 0.3s"}}/>)}
            </div>
            <div style={{fontSize:11,color:sColor[strength],fontWeight:700}}>Senha {sLabel[strength]}</div>
          </div>
        )}
        <OInput label="Confirmar senha" type="password" value={conf} onChange={setConf} placeholder="Digite a senha novamente" icon="🔒" error={errs.conf}/>
        <OBtn onClick={submit} variant="primary" loading={loading}>Continuar →</OBtn>
        <div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:14}}>
          Já tem conta? <span onClick={onBack} style={{color:C.mint2,fontWeight:700,cursor:"pointer"}}>Entrar</span>
        </div>
      </div>
    </div>
  );
}

function ProfileMode({user,onBack,onNext}){
  const [mode,setMode]=useState(null);
  const opts=[
    {id:"gestacao",emoji:"🤰",title:"Estou grávida",sub:"Acompanhe a gestação semana a semana.",color:C.mint,bg:C.mintLight},
    {id:"tentando",emoji:"💕",title:"Tentando engravidar",sub:"Monitore ciclo, ovulação e fertilidade.",color:C.lilac,bg:C.lilacLight},
    {id:"post",emoji:"👶",title:"Já tive meu bebê",sub:"Marcos, vacinas, sono e guias do 1º ano.",color:C.peach,bg:C.peachLight},
    {id:"pai",emoji:"👨‍👩‍👧",title:"Sou pai acompanhando",sub:"Participe da gestação e desenvolvimento.",color:C.sky,bg:C.skyLight},
  ];
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.dark,padding:"52px 22px 28px"}}>
        <BackBtn onClick={onBack}/>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:14,fontWeight:700,color:C.mint,marginBottom:4}}>Olá, {user.name}! 👋</div>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-1,lineHeight:1.1}}>Qual é o seu<br/>momento? ✨</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:5,marginBottom:22}}>Personalizamos tudo para você</div>
        <ProgressDots step={2} total={3}/>
      </div>
      <div style={{flex:1,padding:"22px 22px",display:"flex",flexDirection:"column"}}>
        {opts.map(o=>(
          <div key={o.id} onClick={()=>setMode(o.id)}
            style={{background:mode===o.id?o.bg:C.card,border:`2px solid ${mode===o.id?o.color:C.border}`,borderRadius:17,padding:"16px 18px",marginBottom:10,cursor:"pointer",display:"flex",gap:13,alignItems:"center",transition:"all 0.2s"}}>
            <div style={{width:50,height:50,borderRadius:15,background:mode===o.id?o.color+"22":C.warm,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{o.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:15,color:C.dark,marginBottom:2}}>{o.title}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{o.sub}</div>
            </div>
            <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${mode===o.id?o.color:C.border}`,background:mode===o.id?o.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
              {mode===o.id&&<div style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}/>}
            </div>
          </div>
        ))}
        <div style={{marginTop:"auto",paddingTop:10}}>
          <OBtn onClick={()=>mode&&onNext(mode)} variant="dark" disabled={!mode}>Continuar →</OBtn>
        </div>
      </div>
    </div>
  );
}

function ProfileDetails({user,mode,onBack,onDone}){
  const [babyName,setBabyName]=useState("");
  const [dpp,setDpp]=useState("");
  const [babyBirth,setBabyBirth]=useState("");
  const [gender,setGender]=useState(null);
  const [partner,setPartner]=useState("");
  const [loading,setLoading]=useState(false);

  const calcGestWeek=d=>{
    if(!d)return null;
    const dppDate=new Date(d);
    const conc=new Date(dppDate);
    conc.setDate(conc.getDate()-280);
    const weeks=Math.round((new Date()-conc)/(1000*60*60*24*7));
    return Math.max(1,Math.min(40,weeks));
  };
  const calcBabyWeeks=d=>{
    if(!d)return null;
    const birth=new Date(d);
    const weeks=Math.floor((new Date()-birth)/(1000*60*60*24*7));
    return Math.max(0,weeks);
  };

  const gestWeek=calcGestWeek(dpp);
  const babyWeeksOld=calcBabyWeeks(babyBirth);

  const submit=async()=>{
    setLoading(true);await new Promise(r=>setTimeout(r,1600));setLoading(false);
    onDone({...user,mode,babyName,gender,dpp,babyBirth,partner,
      week:mode==="post"?null:(gestWeek||null),
      babyWeeks:babyWeeksOld,
      plan:"free",
    });
  };

  const info={gestacao:{emoji:"🤰",title:"Sobre sua gestação"},tentando:{emoji:"💕",title:"Sobre você"},post:{emoji:"👶",title:"Sobre seu bebê"},pai:{emoji:"👨‍👩‍👧",title:"Sobre sua família"}}[mode];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.dark,padding:"52px 22px 28px"}}>
        <BackBtn onClick={onBack}/>
        <div style={{fontSize:34,marginBottom:8}}>{info.emoji}</div>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-1,lineHeight:1.1}}>{info.title}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:5,marginBottom:22}}>Quanto mais preencher, melhor!</div>
        <ProgressDots step={3} total={3}/>
      </div>
      <div style={{flex:1,padding:"22px 22px",animation:"fadeUp 0.5s ease both",overflowY:"auto"}}>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.dark,marginBottom:7}}>{mode==="post"?"Gênero do bebê":"Já sabe o gênero?"}</div>
          <div style={{display:"flex",gap:8}}>
            {[{id:"menino",label:"👦 Menino",color:C.sky,bg:C.skyLight},{id:"menina",label:"👧 Menina",color:C.rose,bg:C.roseLight},{id:"surpresa",label:"🎁 Surpresa",color:C.yellow,bg:C.yellowLight}].map(g=>(
              <div key={g.id} onClick={()=>setGender(g.id)}
                style={{flex:1,textAlign:"center",padding:"10px 6px",borderRadius:11,background:gender===g.id?g.bg:C.card,border:`1.5px solid ${gender===g.id?g.color:C.border}`,cursor:"pointer",fontSize:12,fontWeight:gender===g.id?700:400,color:gender===g.id?g.color:C.muted,transition:"all 0.2s"}}>{g.label}</div>
            ))}
          </div>
        </div>
        <OInput label={mode==="post"?"Nome do bebê":"Nome do bebê (se já escolheu)"} value={babyName} onChange={setBabyName} placeholder={mode==="post"?"Ex: Pedro, Sofia...":"Ex: Pedro, Sofia ou Brotinho 🌱"} icon="✨" hint="Pode deixar em branco"/>
        {mode==="post"
          ?(
            <div>
              <OInput label="Data de nascimento do bebê" type="date" value={babyBirth} onChange={setBabyBirth} icon="🎂"
                hint={babyWeeksOld!==null?`${babyName||"Seu bebê"} tem ${babyWeeksOld} semanas de vida ✨`:"Informe a data de nascimento"}/>
              {babyWeeksOld!==null&&babyBirth&&(
                <div style={{background:C.peachLight,border:`1px solid ${C.peach}33`,borderRadius:11,padding:"9px 13px",fontSize:12,color:C.peach2,fontWeight:700,marginTop:-9,marginBottom:13}}>
                  👶 {babyWeeksOld<4?`${babyWeeksOld} semana${babyWeeksOld!==1?"s":""} de vida`:
                      babyWeeksOld<52?`${babyWeeksOld} semanas (${Math.floor(babyWeeksOld/4)} ${Math.floor(babyWeeksOld/4)===1?"mês":"meses"})`:
                      `${Math.floor(babyWeeksOld/52)} ano${Math.floor(babyWeeksOld/52)!==1?"s":""}!`}
                </div>
              )}
            </div>
          )
          :mode!=="tentando"&&(
            <div>
              <OInput label="Data prevista do parto (DPP)" type="date" value={dpp} onChange={setDpp} icon="📅"
                hint={gestWeek?`Semana ${gestWeek} de gestação detectada! ✨`:"Encontre na carteirinha de pré-natal"}/>
              {gestWeek&&<div style={{background:C.mintLight,border:`1px solid ${C.mint}33`,borderRadius:11,padding:"9px 13px",fontSize:12,color:C.mint2,fontWeight:700,marginTop:-9,marginBottom:13}}>🌱 Você está na semana {gestWeek} de gestação!</div>}
            </div>
          )
        }
        <OInput label="Nome do parceiro(a) (opcional)" value={partner} onChange={setPartner} placeholder="Para personalizar as mensagens" icon="💑"/>
        <OBtn onClick={submit} variant="primary" loading={loading}>🌱 Entrar no Brotinho!</OBtn>
        <div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:11,cursor:"pointer"}}
          onClick={()=>onDone({...user,mode,babyName:"",gender:null,week:null,babyWeeks:null,plan:"free"})}>
          Pular e configurar depois
        </div>
      </div>
    </div>
  );
}

function Success({user,onEnter}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),120);},[]);
  const firstName=user?.name?.split(" ")[0]||"";
  const items=[
    user?.mode==="gestacao"&&{icon:"🥝",text:user?.week?`Semana ${user.week} detectada — acompanhe o desenvolvimento`:"Configure sua DPP para ver o desenvolvimento semana a semana"},
    user?.mode==="post"&&{icon:"👶",text:`${user.babyName||"Bebê"} — marcos e vacinas ativos`},
    user?.mode==="tentando"&&{icon:"💕",text:"Monitoramento de ciclo e fertilidade ativo"},
    {icon:"🤖",text:"IA Brotinho pronta para responder suas dúvidas"},
    {icon:"🔔",text:"Notificações de exames e vacinas ativadas"},
    {icon:"🎁",text:"Plano Gratuito ativo — upgrade para Premium a qualquer hora"},
  ].filter(Boolean);

  return(
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 22px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:380,height:380,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.15),transparent)`,top:-100,left:-100}}/>
      <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,138,101,0.1),transparent)`,bottom:-80,right:-80}}/>
      <div style={{position:"relative",transition:"all 0.8s cubic-bezier(0.34,1.56,0.64,1)",transform:vis?"scale(1)":"scale(0)",opacity:vis?1:0,marginBottom:24}}>
        <Logo size={96} glow/>
        <div style={{position:"absolute",top:-6,right:-6,width:30,height:30,borderRadius:"50%",background:C.mint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,animation:"fadeIn 0.4s ease 0.6s both"}}>✓</div>
      </div>
      <div style={{transition:"all 0.6s ease 0.3s",transform:vis?"translateY(0)":"translateY(30px)",opacity:vis?1:0}}>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:32,fontWeight:800,color:"#fff",letterSpacing:-1.5,marginBottom:8,lineHeight:1.1}}>
          Tudo pronto,<br/><span style={{color:C.mint}}>{firstName}!</span> 🎉
        </div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.7,marginBottom:28,maxWidth:290,margin:"0 auto 28px"}}>
          Sua conta foi criada! O Brotinho está personalizado para o seu momento.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>
          {items.map((it,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:13,padding:"11px 15px",display:"flex",gap:11,alignItems:"center",animation:`fadeUp 0.4s ease ${0.5+i*0.1}s both`}}>
              <span style={{fontSize:19}}>{it.icon}</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",textAlign:"left",lineHeight:1.5}}>{it.text}</span>
            </div>
          ))}
        </div>
        <OBtn onClick={onEnter} variant="primary">Explorar o Brotinho 🚀</OBtn>
      </div>
    </div>
  );
}

function Forgot({onBack}){
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!email.trim())return;
    setLoading(true);await new Promise(r=>setTimeout(r,1400));
    setLoading(false);setSent(true);
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.dark,padding:"52px 22px 28px"}}>
        <BackBtn onClick={onBack}/>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-1}}>{sent?"Email enviado! 📬":"Recuperar senha 🔑"}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:5}}>{sent?`Instruções enviadas para ${email}`:"Digite seu email para receber o link"}</div>
      </div>
      <div style={{flex:1,padding:"28px 22px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:sent?"center":"flex-start"}}>
        {sent?(
          <div style={{textAlign:"center",animation:"fadeUp 0.5s ease both"}}>
            <div style={{fontSize:60,marginBottom:18}}>📬</div>
            <div style={{fontFamily:"'Baloo 2',cursive",fontSize:20,fontWeight:800,color:C.dark,marginBottom:8}}>Verifique seu email</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:28,maxWidth:260,margin:"0 auto 28px"}}>Enviamos um link para <strong>{email}</strong>. Verifique também o spam!</div>
            <OBtn onClick={onBack} variant="dark">Voltar para o login</OBtn>
          </div>
        ):(
          <div style={{width:"100%",animation:"fadeUp 0.5s ease both"}}>
            <div style={{background:C.mintLight,border:`1px solid ${C.mint}33`,borderRadius:13,padding:"13px 15px",marginBottom:20,fontSize:12,color:C.mint2,lineHeight:1.6}}>
              💡 Insira o email que você usou para criar sua conta Brotinho.
            </div>
            <OInput label="Email da conta" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon="📧"/>
            <OBtn onClick={submit} variant="primary" loading={loading} disabled={!email.trim()}>Enviar link de recuperação</OBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP SCREENS
// ═══════════════════════════════════════════════════════════

function HomeScreen({profile,onNav,mode,unreadCount,onLogout,plan,onUpgrade}){
  const currentWeek=profile.week||14;
  const wd=WEEKS.find(w=>w.w>=currentWeek)||WEEKS[WEEKS.length-1];
  const [tipIdx]=useState(Math.floor(Math.random()*TIPS.length));
  const prog=Math.round((currentWeek/40)*100);
  const isPost=mode==="post";
  const isPremium=plan==="premium";
  const fn=profile.name?.split(" ")[0]||profile.name;

  const babyAgeText=profile.babyAge?`${profile.babyName} tem ${profile.babyAge} 👶`:`${profile.babyName} está crescendo! 👶`;
  const gestText=profile.week?`Semana ${profile.week} — ${wd.fruit} tamanho de um ${wd.name}`:`Olá! Configure sua DPP para ver o desenvolvimento 🌱`;

  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:C.dark,padding:"52px 22px 26px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.15),transparent)`}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Logo size={34}/><Wordmark/></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {!isPremium&&(
              <div onClick={onUpgrade} style={{display:"flex",alignItems:"center",gap:5,background:"linear-gradient(135deg,rgba(245,158,11,0.2),rgba(124,58,237,0.2))",border:"1px solid rgba(245,158,11,0.3)",borderRadius:100,padding:"5px 12px",cursor:"pointer"}}>
                <span style={{fontSize:12}}>👑</span>
                <span style={{fontSize:11,fontWeight:700,color:C.gold}}>Premium</span>
              </div>
            )}
            {isPremium&&(
              <div style={{display:"flex",alignItems:"center",gap:5,background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(124,58,237,0.15))",border:"1px solid rgba(245,158,11,0.25)",borderRadius:100,padding:"5px 12px"}}>
                <span style={{fontSize:12}}>👑</span>
                <span style={{fontSize:11,fontWeight:700,color:C.gold}}>Premium</span>
              </div>
            )}
            {unreadCount>0&&<div onClick={()=>onNav("notifs")} style={{position:"relative",cursor:"pointer"}}>
              <IcoBell size={20} color="rgba(255,255,255,0.6)"/>
              <div style={{position:"absolute",top:-4,right:-4,width:15,height:15,borderRadius:"50%",background:C.peach,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{unreadCount}</div>
            </div>}
            <div onClick={onLogout} style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.mint},${C.mint2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
              {fn?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{position:"relative"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Olá, {fn}! ✨</div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontSize:21,fontWeight:800,color:"#fff",lineHeight:1.2,marginBottom:10}}>
            {isPost?babyAgeText:gestText}
          </div>
          {!isPost&&profile.week&&<>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:1}}>PROGRESSO DA GESTAÇÃO</span>
              <span style={{fontSize:10,color:C.mint,fontWeight:700}}>{prog}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:100,height:5,marginBottom:10}}>
              <div style={{width:`${prog}%`,height:"100%",background:`linear-gradient(90deg,${C.mint},${C.mint2})`,borderRadius:100}}/>
            </div>
          </>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Chip label={isPost?"👶 Pós-parto":"🤰 Gestação"} color={isPost?C.peach:C.mint} bg={isPost?"rgba(255,138,101,0.2)":"rgba(78,203,161,0.15)"}/>
            {!isPremium&&<Chip label="🎁 Plano Gratuito" color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.08)"/>}
            {isPremium&&<Chip label="👑 Premium" color={C.gold} bg="rgba(245,158,11,0.15)"/>}
          </div>
        </div>
      </div>

      <div style={{padding:"14px 16px 0"}}>
        {/* Banner Premium para usuários free */}
        {!isPremium&&(
          <div onClick={onUpgrade} style={{background:`linear-gradient(135deg,#1a0533,#2d1b69)`,border:`1px solid ${C.premium}44`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:12}}>
            <div style={{fontSize:28}}>👑</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:13,color:"#fff",marginBottom:2}}>Desbloqueie o Premium</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>Saúde, Diário, Exames, IA ilimitada · R$29,90/mês</div>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.gold},#f97316)`,borderRadius:100,padding:"6px 14px",fontSize:11,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>Ver →</div>
          </div>
        )}

        {!isPost&&profile.week&&(
          <Card style={{marginBottom:12,background:`linear-gradient(135deg,${C.mintLight},#fff)`,border:`1.5px solid ${C.mint}22`}}>
            <div style={{display:"flex",gap:13,alignItems:"center"}}>
              <div style={{fontSize:46,lineHeight:1}}>{wd.fruit}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,letterSpacing:2,color:C.mint2,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Seu bebê esta semana</div>
                <div style={{fontFamily:"'Baloo 2',cursive",fontSize:15,fontWeight:800,color:C.dark,marginBottom:3}}>{wd.size} · {wd.weight}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{wd.desc}</div>
              </div>
            </div>
          </Card>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {(isPost?[
            {label:"Desenvolvimento",sub:"Marcos do bebê",emoji:"📅",color:C.mint,bg:C.mintLight,nav:"baby",free:true},
            {label:"Vacinas",sub:"Próxima: 2 meses",emoji:"💉",color:C.peach,bg:C.peachLight,nav:"baby",free:true},
            {label:"Enxoval",sub:"Checklist completo",emoji:"🛍️",color:C.lilac,bg:C.lilacLight,nav:"enxoval",free:true},
            {label:"IA Pediatra",sub:"Online agora",emoji:"🤖",color:C.sky,bg:C.skyLight,nav:"chat",free:true},
          ]:[
            {label:"Saúde",sub:isPremium?"Peso · Pressão":"🔒 Premium",emoji:"📊",color:C.rose,bg:C.roseLight,nav:isPremium?"saude":"plans",free:false},
            {label:"Exames",sub:isPremium?"5 pendentes":"🔒 Premium",emoji:"🧪",color:C.peach,bg:C.peachLight,nav:isPremium?"exams":"plans",free:false},
            {label:"Enxoval",sub:"Checklist",emoji:"🛍️",color:C.lilac,bg:C.lilacLight,nav:"enxoval",free:true},
            {label:"IA Brotinho",sub:"Online agora",emoji:"🤖",color:C.sky,bg:C.skyLight,nav:"chat",free:true},
          ]).map(a=>(
            <div key={a.nav+a.label} onClick={()=>onNav(a.nav)}
              style={{background:a.bg,border:`1.5px solid ${a.color}22`,borderRadius:15,padding:"15px 13px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
              {!a.free&&!isPremium&&(
                <div style={{position:"absolute",top:8,right:8}}>
                  <IcoLock size={11} color={C.premium}/>
                </div>
              )}
              <div style={{fontSize:21,marginBottom:7}}>{a.emoji}</div>
              <div style={{fontWeight:700,fontSize:13,color:C.dark,marginBottom:2}}>{a.label}</div>
              <div style={{fontSize:11,color:!a.free&&!isPremium?C.premium:a.color}}>{a.sub}</div>
            </div>
          ))}
        </div>

        <Card style={{background:C.yellowLight,border:`1.5px solid ${C.yellow}55`,marginBottom:12}}>
          <div style={{fontSize:10,letterSpacing:2,color:"#b8860b",fontWeight:700,textTransform:"uppercase",marginBottom:7}}>💡 Dica da semana</div>
          <div style={{fontSize:13,color:C.dark,lineHeight:1.65}}>{TIPS[tipIdx].emoji} {TIPS[tipIdx].tip}</div>
        </Card>

        {!isPost&&profile.week&&WEEKS.filter(w=>w.w>profile.week).slice(0,2).map(w=>(
          <Card key={w.w} style={{marginBottom:8,display:"flex",alignItems:"center",gap:11}} onClick={()=>onNav("baby")}>
            <div style={{width:42,height:42,borderRadius:12,background:C.mintLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{w.fruit}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13}}>Semana {w.w} — {w.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{w.size} · {w.weight} · em {w.w-profile.week} semanas</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BabyScreen({profile,mode}){
  const [sel,setSel]=useState(null);
  const [vacines,setVacines]=useState(VACCINES_BABY);
  const [tab,setTab]=useState(mode==="post"?"marcos":"semanas");
  const isPost=mode==="post";
  const curIdx=WEEKS.reduce((acc,w,i)=>w.w<=profile.week?i:acc,0);
  const donePct=Math.round(vacines.filter(v=>v.done).length/vacines.length*100);

  return(
    <div style={{paddingBottom:100}}>
      <ScreenHeader label={isPost?"Pós-parto":"Desenvolvimento"} title={isPost?"Bebê & Vacinas 👶":"Semana a Semana 🌱"}/>
      <div style={{padding:"14px 16px 0"}}>
        {isPost&&(
          <div style={{display:"flex",background:C.warm,borderRadius:13,padding:3,marginBottom:13,gap:3}}>
            {[["marcos","📅 Marcos"],["vacinas","💉 Vacinas"]].map(([id,label])=>(
              <div key={id} onClick={()=>setTab(id)} style={{flex:1,textAlign:"center",padding:"9px 6px",borderRadius:11,background:tab===id?C.card:"transparent",fontSize:12,fontWeight:tab===id?700:400,color:tab===id?C.dark:C.muted,cursor:"pointer",transition:"all 0.15s",boxShadow:tab===id?"0 2px 8px rgba(0,0,0,0.07)":"none"}}>{label}</div>
            ))}
          </div>
        )}
        {(!isPost||tab==="marcos")&&(isPost?MILESTONES:WEEKS).map((item,i)=>{
          const isPast=isPost?item.done:i<curIdx;
          const isCur=isPost?item.current:i===curIdx;
          const isOpen=sel===i;
          return(
            <div key={i} style={{marginBottom:8}}>
              <div onClick={()=>setSel(isOpen?null:i)} style={{background:isCur?C.dark:C.card,border:`1.5px solid ${isCur?C.mint:C.border}`,borderRadius:15,padding:"13px 15px",cursor:"pointer",display:"flex",alignItems:"center",gap:11,opacity:!isPast&&!isCur?.5:1}}>
                <div style={{width:44,height:44,borderRadius:12,background:isCur?"rgba(78,203,161,0.15)":C.mintLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{isPost?item.emoji:item.fruit}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                    <span style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14,color:isCur?"#fff":C.dark}}>
                      {isPost?item.title:`Semana ${item.w} — ${item.name}`}
                    </span>
                    {isCur&&<Chip label="AGORA" color={C.mint} bg="rgba(78,203,161,0.2)"/>}
                    {isPast&&!isCur&&<IcoCheck size={13} color={C.mint}/>}
                  </div>
                  <div style={{fontSize:11,color:isCur?"rgba(255,255,255,0.4)":C.muted}}>
                    {isPost?`Semana ${item.week} de vida`:`${item.size} · ${item.weight}`}
                  </div>
                </div>
                <span style={{fontSize:13,color:isCur?"rgba(255,255,255,0.4)":C.muted}}>{isOpen?"▲":"▼"}</span>
              </div>
              {isOpen&&(
                <div style={{background:C.mintLight,border:`1.5px solid ${C.mint}22`,borderTop:"none",borderRadius:"0 0 15px 15px",padding:13,marginTop:-7}}>
                  {isPost?(item.topics||[]).map((t,j)=>(
                    <div key={j} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7,paddingBottom:7,borderBottom:j<item.topics.length-1?`1px solid ${C.mint}22`:"none"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:C.mint2,marginTop:7,flexShrink:0}}/>
                      <div style={{fontSize:13,color:C.dark,lineHeight:1.6}}>{t}</div>
                    </div>
                  )):(
                    <>
                      <div style={{fontSize:13,color:C.dark,lineHeight:1.7,marginBottom:11}}>{item.desc}</div>
                      <div style={{display:"flex",gap:9}}>
                        <div style={{flex:1,background:"#fff",borderRadius:11,padding:"9px 12px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:C.muted,marginBottom:2}}>TAMANHO</div>
                          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:15,color:C.mint2}}>{item.size}</div>
                        </div>
                        <div style={{flex:1,background:"#fff",borderRadius:11,padding:"9px 12px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:C.muted,marginBottom:2}}>PESO</div>
                          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:15,color:C.mint2}}>{item.weight}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {isPost&&tab==="vacinas"&&(
          <>
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14}}>{vacines.filter(v=>v.done).length} de {vacines.length} vacinas</div>
                <span style={{fontFamily:"'Baloo 2',cursive",fontSize:14,fontWeight:800,color:C.mint2}}>{donePct}%</span>
              </div>
              <div style={{background:C.border,borderRadius:100,height:7,overflow:"hidden",marginBottom:7}}>
                <div style={{width:`${donePct}%`,height:"100%",background:`linear-gradient(90deg,${C.mint},${C.mint2})`,borderRadius:100,transition:"width 0.5s ease"}}/>
              </div>
              <div style={{fontSize:11,color:C.muted}}>💉 Próxima: Pentavalente aos 2 meses</div>
            </Card>
            {vacines.map((v,i)=>(
              <div key={i} onClick={()=>setVacines(p=>p.map((vv,j)=>j===i?{...vv,done:!vv.done}:vv))}
                style={{background:v.done?C.mintLight:C.card,border:`1.5px solid ${v.done?C.mint+"44":C.border}`,borderRadius:13,padding:"12px 15px",marginBottom:7,display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"all 0.2s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:v.done?C.mint:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {v.done&&<IcoCheck size={12} color="#fff"/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.dark,textDecoration:v.done?"line-through":"none",opacity:v.done?.6:1}}>{v.name}</div>
                  <div style={{fontSize:11,color:v.next&&!v.done?C.peach:C.muted,fontWeight:v.next&&!v.done?700:400}}>{v.when}{v.next&&!v.done?" · ⚡ Próxima!":""}</div>
                </div>
                <Chip label={v.done?"Feita":"Pendente"} color={v.done?C.mint2:C.muted} bg={v.done?C.mintLight:C.border}/>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Saúde (Premium) ──────────────────────────────────────
function SaudeScreen({profile,plan,onUpgrade}){
  if(plan!=="premium"){
    return(
      <div style={{paddingBottom:100}}>
        <ScreenHeader label="Monitoramento" title="Saúde da Gestação 📊"/>
        <PaywallBanner feature="saude" onUpgrade={onUpgrade}/>
      </div>
    );
  }

  const [tab,setTab]=useState("peso");
  const [weights,setWeights]=useState([{week:6,val:58.0},{week:8,val:58.3},{week:10,val:58.7},{week:12,val:59.1},{week:14,val:59.8}]);
  const [pressures,setPressures]=useState([{week:8,sys:112,dia:72},{week:10,sys:110,dia:70},{week:12,sys:114,dia:74},{week:14,sys:116,dia:75}]);
  const [bellies,setBellies]=useState([{week:10,val:84},{week:12,val:86},{week:14,val:89}]);
  const [showForm,setShowForm]=useState(false);
  const [nv,setNv]=useState("");const [ns,setNs]=useState("");const [nd,setNd]=useState("");

  const lw=weights[weights.length-1];const lp=pressures[pressures.length-1];const lb=bellies[bellies.length-1];
  const gain=(lw.val-weights[0].val).toFixed(1);
  const okP=lp.sys<=135&&lp.dia<=85;
  const maxW=Math.max(...weights.map(w=>w.val));const minW=Math.min(...weights.map(w=>w.val));

  const add=()=>{
    if(tab==="peso"&&nv)setWeights(p=>[...p,{week:profile.week+1,val:parseFloat(nv)}]);
    else if(tab==="pressao"&&ns&&nd)setPressures(p=>[...p,{week:profile.week+1,sys:parseInt(ns),dia:parseInt(nd)}]);
    else if(tab==="barriga"&&nv)setBellies(p=>[...p,{week:profile.week+1,val:parseInt(nv)}]);
    setNv("");setNs("");setNd("");setShowForm(false);
  };

  return(
    <div style={{paddingBottom:100}}>
      <ScreenHeader label="Monitoramento" title="Saúde da Gestação 📊"
        rightContent={<Chip label="👑 Premium" color={C.gold} bg="rgba(245,158,11,0.15)"/>}/>
      <div style={{padding:"14px 16px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
          {[{label:"Peso",val:`${lw.val}kg`,sub:`+${gain}kg`,color:C.rose,bg:C.roseLight},{label:"Pressão",val:`${lp.sys}/${lp.dia}`,sub:okP?"✓ Normal":"⚠️ Atenção",color:okP?C.mint2:C.peach,bg:okP?C.mintLight:C.peachLight},{label:"Barriga",val:`${lb.val}cm`,sub:"Circunf.",color:C.lilac,bg:C.lilacLight}].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:13,padding:"12px 9px",textAlign:"center",border:`1px solid ${s.color}22`}}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{s.label}</div>
              <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:16,color:s.color,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",background:C.warm,borderRadius:13,padding:3,marginBottom:12,gap:3}}>
          {[["peso","⚖️ Peso"],["pressao","🩺 Pressão"],["barriga","📏 Barriga"]].map(([id,l])=>(
            <div key={id} onClick={()=>setTab(id)} style={{flex:1,textAlign:"center",padding:"9px 5px",borderRadius:11,background:tab===id?C.card:"transparent",fontSize:11,fontWeight:tab===id?700:400,color:tab===id?C.dark:C.muted,cursor:"pointer",transition:"all 0.15s",boxShadow:tab===id?"0 2px 8px rgba(0,0,0,0.07)":"none"}}>{l}</div>
          ))}
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14,marginBottom:3}}>Histórico</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>Por semana de gestação</div>
          {tab==="peso"&&(
            <>
              <div style={{display:"flex",alignItems:"flex-end",gap:7,height:84,marginBottom:9}}>
                {weights.map((w,i)=>{const p=((w.val-minW+0.5)/(maxW-minW+1))*75+22;const il=i===weights.length-1;return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{fontSize:9,color:il?C.rose:C.muted,fontWeight:il?700:400}}>{w.val}</div>
                    <div style={{width:"100%",borderRadius:5,background:il?C.rose:C.roseLight,height:`${p}%`}}/>
                    <div style={{fontSize:9,color:il?C.rose:C.muted}}>S{w.week}</div>
                  </div>
                );})}
              </div>
              <div style={{background:C.roseLight,borderRadius:9,padding:"9px 12px",fontSize:11,color:C.rose}}>📈 Ganho: +{gain}kg · Meta: 11–16kg total</div>
            </>
          )}
          {tab==="pressao"&&pressures.map((p,i)=>{const ok=p.sys<=135&&p.dia<=85;const il=i===pressures.length-1;return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 11px",background:il?(ok?C.mintLight:C.peachLight):C.warm,borderRadius:11,marginBottom:7,border:`1px solid ${il?(ok?C.mint:C.peach):C.border}`}}>
              <div style={{fontSize:10,color:C.muted,minWidth:38}}>S{p.week}</div>
              <div style={{flex:1,fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:15,color:ok?C.mint2:C.peach}}>{p.sys}/{p.dia}</div>
              <Chip label={ok?"Normal":"Atenção"} color={ok?C.mint2:C.peach} bg={ok?C.mintLight:C.peachLight}/>
            </div>
          );})}
          {tab==="barriga"&&(
            <div style={{display:"flex",alignItems:"flex-end",gap:9,height:84}}>
              {bellies.map((b,i)=>{const p=((b.val-80)/(100-80))*75+20;const il=i===bellies.length-1;return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{fontSize:9,color:il?C.lilac:C.muted,fontWeight:il?700:400}}>{b.val}cm</div>
                  <div style={{width:"100%",borderRadius:5,background:il?C.lilac:C.lilacLight,height:`${p}%`}}/>
                  <div style={{fontSize:9,color:il?C.lilac:C.muted}}>S{b.week}</div>
                </div>
              );})}
            </div>
          )}
        </Card>
        <div onClick={()=>setShowForm(!showForm)} style={{background:C.dark,borderRadius:13,padding:"12px 17px",display:"flex",alignItems:"center",gap:9,cursor:"pointer",marginBottom:showForm?9:12}}>
          <IcoPlus size={17} color="#fff"/>
          <span style={{color:"#fff",fontSize:13,fontWeight:700}}>Registrar nova medição</span>
        </div>
        {showForm&&(
          <Card style={{marginBottom:12,border:`1.5px solid ${C.rose}33`}}>
            {tab==="pressao"?(
              <div style={{display:"flex",gap:9,marginBottom:11}}>
                <input value={ns} onChange={e=>setNs(e.target.value)} placeholder="Sistólica (115)" style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",color:C.dark}}/>
                <input value={nd} onChange={e=>setNd(e.target.value)} placeholder="Diastólica (75)" style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",color:C.dark}}/>
              </div>
            ):(
              <input value={nv} onChange={e=>setNv(e.target.value)} placeholder={tab==="peso"?"Ex: 60.5":"Ex: 92"} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",color:C.dark,marginBottom:11,boxSizing:"border-box"}}/>
            )}
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>setShowForm(false)} style={{flex:1,background:C.warm,border:`1px solid ${C.border}`,borderRadius:9,padding:9,fontSize:12,fontFamily:"inherit",cursor:"pointer",color:C.muted}}>Cancelar</button>
              <button onClick={add} style={{flex:2,background:C.rose,border:"none",borderRadius:9,padding:9,fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer",color:"#fff"}}>Salvar 💾</button>
            </div>
          </Card>
        )}
        <Card style={{background:C.roseLight,border:`1px solid ${C.rose}22`}}>
          <div style={{fontSize:10,letterSpacing:2,color:C.rose,fontWeight:700,textTransform:"uppercase",marginBottom:7}}>⚠️ Sinais de alerta</div>
          {["Pressão acima de 140/90 — vá ao médico imediatamente","Inchaço repentino nas mãos e rosto","Dor de cabeça intensa + visão turva"].map((t,i)=>(
            <div key={i} style={{fontSize:12,color:C.dark,lineHeight:1.6,paddingBottom:5,marginBottom:5,borderBottom:i<2?`1px solid ${C.rose}15`:"none"}}>🔴 {t}</div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Exames (Premium) ─────────────────────────────────────
function ExamsScreen({plan,onUpgrade}){
  if(plan!=="premium"){
    return(
      <div style={{paddingBottom:100}}>
        <ScreenHeader label="Pré-natal" title="Exames & Consultas 🧪"/>
        <PaywallBanner feature="exams" onUpgrade={onUpgrade}/>
      </div>
    );
  }

  const [exams,setExams]=useState(EXAMS);
  const done=exams.filter(e=>e.done).length;const pct=Math.round((done/exams.length)*100);
  return(
    <div style={{paddingBottom:100}}>
      <ScreenHeader label="Pré-natal" title="Exames & Consultas 🧪"
        rightContent={<Chip label="👑 Premium" color={C.gold} bg="rgba(245,158,11,0.15)"/>}/>
      <div style={{padding:"14px 16px 0"}}>
        <Card style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
            <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14}}>{done} de {exams.length} realizados</div>
            <span style={{fontFamily:"'Baloo 2',cursive",fontSize:14,fontWeight:800,color:C.mint2}}>{pct}%</span>
          </div>
          <div style={{background:C.border,borderRadius:100,height:7,overflow:"hidden",marginBottom:7}}>
            <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.mint},${C.mint2})`,borderRadius:100,transition:"width 0.5s ease"}}/>
          </div>
          <div style={{fontSize:11,color:C.muted}}>💉 Próximo: Toxoplasmose — sem. 8–12</div>
        </Card>
        {exams.map((e,i)=>(
          <div key={i} onClick={()=>setExams(p=>p.map((ex,j)=>j===i?{...ex,done:!ex.done}:ex))}
            style={{background:e.done?C.mintLight:C.card,border:`1.5px solid ${e.done?C.mint+"44":C.border}`,borderRadius:13,padding:"12px 15px",marginBottom:7,display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:e.done?C.mint:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {e.done&&<IcoCheck size={12} color="#fff"/>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:C.dark,textDecoration:e.done?"line-through":"none",opacity:e.done?.6:1}}>{e.name}</div>
              <div style={{fontSize:11,color:e.next&&!e.done?C.peach:C.muted,fontWeight:e.next&&!e.done?700:400}}>Sem. {e.week} · {e.desc}{e.next&&!e.done?" · ⚡ Próximo!":""}</div>
            </div>
            <Chip label={e.done?"Feito":"Pendente"} color={e.done?C.mint2:C.muted} bg={e.done?C.mintLight:C.border}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Diário (Premium) ─────────────────────────────────────
function DiaryScreen({profile,plan,onUpgrade}){
  if(plan!=="premium"){
    return(
      <div style={{paddingBottom:100}}>
        <ScreenHeader label="Memórias" title="Diário da Gestação 📖"/>
        <PaywallBanner feature="diary" onUpgrade={onUpgrade}/>
      </div>
    );
  }

  const [entries,setEntries]=useState(DIARY_INIT);
  const [adding,setAdding]=useState(false);
  const [txt,setTxt]=useState("");const [mood,setMood]=useState(null);
  const save=()=>{
    if(!txt.trim())return;
    setEntries(p=>[{date:"Agora",mood:mood||"😊",text:txt,week:profile.week},...p]);
    setTxt("");setMood(null);setAdding(false);
  };
  return(
    <div style={{paddingBottom:100}}>
      <ScreenHeader label="Memórias" title="Diário da Gestação 📖"
        rightContent={<Chip label="👑 Premium" color={C.gold} bg="rgba(245,158,11,0.15)"/>}/>
      <div style={{padding:"14px 16px 0"}}>
        <div onClick={()=>setAdding(!adding)} style={{background:C.peach,borderRadius:13,padding:"12px 17px",display:"flex",alignItems:"center",gap:9,cursor:"pointer",marginBottom:12}}>
          <IcoPlus size={17} color="#fff"/><span style={{color:"#fff",fontSize:13,fontWeight:700}}>Registrar memória de hoje</span>
        </div>
        {adding&&(
          <Card style={{marginBottom:12,border:`1.5px solid ${C.peach}44`}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:9}}>Como está se sentindo?</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>
              {SYMPTOMS.map(s=>(
                <div key={s.label} onClick={()=>setMood(s.emoji)} style={{background:mood===s.emoji?C.peach:C.warm,borderRadius:100,padding:"5px 11px",fontSize:12,cursor:"pointer",border:`1.5px solid ${mood===s.emoji?C.peach:C.border}`,color:mood===s.emoji?"#fff":C.dark,fontWeight:mood===s.emoji?700:400,transition:"all 0.15s"}}>{s.emoji} {s.label}</div>
              ))}
            </div>
            <textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Escreva para o seu bebê…" rows={4} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:11,padding:"11px 13px",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",color:C.dark,lineHeight:1.6,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:7,marginTop:9}}>
              <button onClick={()=>setAdding(false)} style={{flex:1,background:C.warm,border:`1px solid ${C.border}`,borderRadius:9,padding:9,fontSize:12,fontFamily:"inherit",cursor:"pointer",color:C.muted}}>Cancelar</button>
              <button onClick={save} style={{flex:2,background:C.peach,border:"none",borderRadius:9,padding:9,fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer",color:"#fff"}}>Salvar 💾</button>
            </div>
          </Card>
        )}
        {entries.map((e,i)=>(
          <Card key={i} style={{marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{fontSize:21}}>{e.mood}</div>
                <div><div style={{fontWeight:700,fontSize:12,color:C.dark}}>{e.date}</div><div style={{fontSize:10,color:C.muted}}>Semana {e.week}</div></div>
              </div>
              <IcoHeart size={15} color={C.peach} filled/>
            </div>
            <div style={{fontSize:13,color:C.dark,lineHeight:1.7,borderLeft:`3px solid ${C.peach}44`,paddingLeft:11}}>{e.text}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EnxovalScreen(){
  const [items,setItems]=useState(ENXOVAL);
  const [open,setOpen]=useState(0);
  const toggle=(ci,ii)=>setItems(p=>p.map((c,i)=>i!==ci?c:{...c,items:c.items.map((it,j)=>j!==ii?it:{...it,done:!it.done})}));
  const total=items.reduce((a,c)=>a+c.items.length,0);
  const done=items.reduce((a,c)=>a+c.items.filter(i=>i.done).length,0);
  const pct=Math.round((done/total)*100);
  const pc={URGENTE:C.peach2,alta:C.peach,média:C.yellow,baixa:C.mint};
  const pb={URGENTE:C.peachLight,alta:"#fff5f0",média:C.yellowLight,baixa:C.mintLight};
  return(
    <div style={{paddingBottom:100}}>
      <ScreenHeader label="Preparação" title="Enxoval do Bebê 🛍️"/>
      <div style={{padding:"14px 16px 0"}}>
        <Card style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
            <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14}}>{done} de {total} itens</div>
            <span style={{fontFamily:"'Baloo 2',cursive",fontSize:14,fontWeight:800,color:C.mint2}}>{pct}%</span>
          </div>
          <div style={{background:C.border,borderRadius:100,height:7,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.mint},${C.lilac})`,borderRadius:100,transition:"width 0.5s"}}/>
          </div>
        </Card>
        {items.map((cat,ci)=>{
          const cd=cat.items.filter(i=>i.done).length;const isO=open===ci;
          return(
            <div key={ci} style={{marginBottom:8}}>
              <div onClick={()=>setOpen(isO?-1:ci)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 15px",cursor:"pointer",display:"flex",alignItems:"center",gap:11}}>
                <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14,flex:1,color:C.dark}}>{cat.cat}</div>
                <div style={{fontSize:11,color:C.muted}}>{cd}/{cat.items.length}</div>
                <div style={{width:30,height:5,background:C.border,borderRadius:100,overflow:"hidden",marginRight:3}}>
                  <div style={{width:`${(cd/cat.items.length)*100}%`,height:"100%",background:C.mint,borderRadius:100}}/>
                </div>
                <span style={{fontSize:12,color:C.muted}}>{isO?"▲":"▼"}</span>
              </div>
              {isO&&(
                <div style={{background:C.warm,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:"7px 11px",marginTop:-7}}>
                  {cat.items.map((it,ii)=>(
                    <div key={ii} onClick={()=>toggle(ci,ii)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 7px",borderBottom:ii<cat.items.length-1?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:it.done?C.mint:C.card,border:`2px solid ${it.done?C.mint:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                        {it.done&&<IcoCheck size={11} color="#fff"/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:it.done?400:600,color:C.dark,textDecoration:it.done?"line-through":"none",opacity:it.done?.6:1}}>{it.name}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:1}}>{it.price}</div>
                      </div>
                      <Chip label={it.priority} color={pc[it.priority]||C.mint} bg={pb[it.priority]||C.mintLight} style={{fontSize:9}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotifsScreen({notifs,setNotifs}){
  const unread=notifs.filter(n=>!n.read).length;
  const tc={exam:C.peach,week:C.mint,tip:C.yellow,reminder:C.lilac,appointment:C.sky};
  const tb={exam:C.peachLight,week:C.mintLight,tip:C.yellowLight,reminder:C.lilacLight,appointment:C.skyLight};
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:C.dark,padding:"52px 22px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(255,255,255,0.35)",marginBottom:6}}>Avisos</div>
            <div style={{fontFamily:"'Baloo 2',cursive",fontSize:26,fontWeight:800,color:"#fff",letterSpacing:-0.5}}>Notificações 🔔</div>
          </div>
          {unread>0&&<div onClick={()=>setNotifs(p=>p.map(n=>({...n,read:true})))} style={{fontSize:11,color:C.mint,cursor:"pointer",padding:"5px 12px",background:"rgba(78,203,161,0.15)",borderRadius:100}}>Marcar lidas</div>}
        </div>
        {unread>0&&<div style={{marginTop:11,background:"rgba(255,138,101,0.15)",borderRadius:11,padding:"7px 13px",fontSize:12,color:C.peach,fontWeight:600}}>{unread} notificação{unread>1?"ões":""} não lida{unread>1?"s":""}</div>}
      </div>
      <div style={{padding:"14px 16px 0"}}>
        {notifs.map(n=>(
          <div key={n.id} onClick={()=>setNotifs(p=>p.map(nn=>nn.id===n.id?{...nn,read:true}:nn))}
            style={{background:n.read?C.card:`linear-gradient(135deg,${tb[n.type]||C.mintLight},${C.card})`,border:`1.5px solid ${n.read?C.border:(tc[n.type]||C.mint)+"33"}`,borderRadius:15,padding:"13px 15px",marginBottom:9,display:"flex",gap:11,alignItems:"flex-start",cursor:"pointer",position:"relative"}}>
            {!n.read&&<div style={{position:"absolute",top:13,right:13,width:7,height:7,borderRadius:"50%",background:tc[n.type]||C.mint}}/>}
            <div style={{width:40,height:40,borderRadius:12,background:n.read?C.warm:(tb[n.type]||C.mintLight),display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{n.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:n.read?500:700,fontSize:13,color:C.dark,marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:5}}>{n.desc}</div>
              <div style={{fontSize:10,color:tc[n.type]||C.mint,fontWeight:600}}>{n.time}</div>
            </div>
            <div onClick={e=>{e.stopPropagation();setNotifs(p=>p.filter(nn=>nn.id!==n.id));}} style={{padding:3,cursor:"pointer",opacity:0.4,flexShrink:0}}>
              <IcoX size={13} color={C.muted}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat com limite freemium ─────────────────────────────
function ChatScreen({profile,mode,plan,onUpgrade}){
  const [msgs,setMsgs]=useState([{role:"ai",text:`Olá! 🌱 Sou a IA do Brotinho!\n\nEstou aqui para tirar suas dúvidas sobre ${mode==="post"?"o bebê, desenvolvimento e pediatria":"a gravidez, saúde e desenvolvimento do bebê"} — a qualquer hora.\n\nO que você gostaria de saber?`}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [msgCount,setMsgCount]=useState(0);
  const endRef=useRef(null);
  const isPremium=plan==="premium";
  const limit=PLAN_LIMITS.free.chatMessages;
  const atLimit=!isPremium&&msgCount>=limit;

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send=async()=>{
    const q=input.trim();if(!q||loading||atLimit)return;
    setInput("");
    setMsgs(p=>[...p,{role:"user",text:q}]);
    setMsgCount(c=>c+1);
    setLoading(true);
    try{
      const hist=msgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:1000,
        system:`Você é a IA especialista em ${mode==="post"?"pediatria e desenvolvimento infantil":"obstetrícia e gravidez"} do app Brotinho. Responda em português do Brasil, tom caloroso e científico. Use diretrizes da ${mode==="post"?"SBP":"Febrasgo + SBP"}. Contexto: ${mode==="post"?`bebê de ${profile.babyWeeks||8} semanas`:`semana ${profile.week||14} de gestação`}. Regras: nunca indique medicamentos com doses; para emergências, oriente ir ao pronto-socorro; parágrafos curtos; emojis com moderação.`,
        messages:[...hist,{role:"user",content:q}]
      })});
      const data=await res.json();
      setMsgs(p=>[...p,{role:"ai",text:data.content?.[0]?.text||"Não consegui processar. Tente novamente."}]);
    }catch{setMsgs(p=>[...p,{role:"ai",text:"Erro de conexão. Verifique sua internet."}]);}
    setLoading(false);
  };

  const suggs=mode==="post"?["Meu bebê chora muito, normal?","Quando começa introdução alimentar?","Febre no bebê o que fazer?","Como fazer tummy time?"]:["O que comer no 2º trimestre?","Enjoo: como aliviar?","Posso me exercitar grávida?","Quando ir à emergência?"];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",paddingBottom:80}}>
      <div style={{background:C.dark,padding:"52px 22px 20px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.mint},${C.mint2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>🌱</div>
            <div>
              <div style={{fontFamily:"'Baloo 2',cursive",fontSize:15,fontWeight:800,color:"#fff"}}>IA Brotinho</div>
              <div style={{fontSize:11,color:C.mint}}>● especialista em {mode==="post"?"pediatria":"gravidez"}</div>
            </div>
          </div>
          {!isPremium&&(
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:2}}>Mensagens hoje</div>
              <div style={{fontSize:13,fontWeight:700,color:msgCount>=limit?C.peach:C.mint}}>{msgCount}/{limit}</div>
            </div>
          )}
          {isPremium&&<Chip label="👑 Ilimitado" color={C.gold} bg="rgba(245,158,11,0.15)"/>}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"13px 15px",display:"flex",flexDirection:"column",gap:9}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"11px 15px",borderRadius:m.role==="user"?"17px 17px 4px 17px":"17px 17px 17px 4px",background:m.role==="user"?C.dark:C.card,color:m.role==="user"?"#fff":C.dark,fontSize:13,lineHeight:1.65,border:m.role==="ai"?`1px solid ${C.border}`:"none",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              {m.text.split("\n").map((l,j)=><div key={j} style={{marginBottom:l===""?5:0}}>{l}</div>)}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"17px 17px 17px 4px",padding:"13px 17px",display:"flex",gap:5,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce 1.2s ease ${i*.2}s infinite`}}/>)}</div></div>}
        <div ref={endRef}/>
      </div>

      {/* Paywall do chat */}
      {atLimit&&(
        <div style={{padding:"0 13px 9px",flexShrink:0}}>
          <div style={{background:`linear-gradient(135deg,#1a0533,#2d1b69)`,border:`1px solid ${C.premium}44`,borderRadius:16,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:6}}>🔒</div>
            <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14,color:"#fff",marginBottom:4}}>Limite diário atingido</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginBottom:12}}>Upgrade para Premium e converse sem limites com a IA!</div>
            <button onClick={onUpgrade} style={{background:`linear-gradient(135deg,${C.gold},#f97316)`,border:"none",borderRadius:11,padding:"10px 24px",fontSize:13,fontWeight:700,fontFamily:"'Baloo 2',cursive",color:"#fff",cursor:"pointer"}}>
              👑 Ver planos Premium
            </button>
          </div>
        </div>
      )}

      {msgs.length<=1&&!atLimit&&<div style={{padding:"0 11px 7px",display:"flex",gap:7,overflowX:"auto",flexShrink:0}}>
        {suggs.map((s,i)=><div key={i} onClick={()=>setInput(s)} style={{background:C.warm,border:`1px solid ${C.border}`,borderRadius:100,padding:"6px 13px",fontSize:12,color:C.dark,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0}}>{s}</div>)}
      </div>}

      <div style={{padding:"9px 13px",background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",gap:9,alignItems:"flex-end",flexShrink:0}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder={atLimit?"Limite atingido — faça upgrade para continuar":"Pergunte qualquer coisa…"}
          disabled={atLimit}
          rows={1} style={{flex:1,border:`1.5px solid ${atLimit?C.premium:C.border}`,borderRadius:13,padding:"11px 13px",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",background:atLimit?C.premiumLight:C.card,color:C.dark,lineHeight:1.5}}/>
        <button onClick={send} disabled={!input.trim()||loading||atLimit}
          style={{width:42,height:42,borderRadius:12,background:input.trim()&&!atLimit?C.mint:C.border,border:"none",cursor:input.trim()&&!atLimit?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
          <IcoSend size={15} color={input.trim()&&!atLimit?"#fff":C.muted}/>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ARTIGOS COM FREEMIUM
// ═══════════════════════════════════════════════════════════
const ARTICLES=[
  {id:1,cat:"Nutrição",emoji:"🥗",color:"#4ecba1",bg:"#e8f8f2",tri:[1,2,3],tag:"Dica rápida",title:"Alimentos que você deve evitar na gravidez",intro:"Alguns alimentos podem oferecer riscos para o bebê. Saiba o que evitar durante os 9 meses.",body:`Durante a gestação, alguns alimentos precisam ser evitados para proteger você e seu bebê:\n\n🚫 **Queijos moles** (brie, camembert, gorgonzola) — risco de listeria\n🚫 **Peixes com alto teor de mercúrio** (atum, cação, tubarão)\n🚫 **Carnes e ovos crus** — risco de salmonela e toxoplasmose\n🚫 **Embutidos** (salame, presunto cru) — risco de listeria\n🚫 **Álcool** — não existe quantidade segura na gravidez\n🚫 **Cafeína em excesso** — limite máximo de 200mg/dia (1 café)\n\n✅ **O que comer à vontade:** frutas, legumes cozidos, carnes bem passadas, ovos cozidos, iogurte pasteurizado.`,read:4},
  {id:2,cat:"Nutrição",emoji:"💊",color:"#4ecba1",bg:"#e8f8f2",tri:[1],tag:"Essencial",title:"Ácido fólico: por que é tão importante?",intro:"O ácido fólico é a vitamina mais importante do 1º trimestre. Descubra o motivo.",body:`O ácido fólico (vitamina B9) é fundamental para o desenvolvimento do tubo neural do bebê.\n\n**Quanto tomar?**\n• Dose padrão: 400 mcg/dia\n• Para quem tem histórico de defeitos: 4.000 mcg/dia\n\n**Até quando tomar?**\nIdealmente começar antes de engravidar e continuar até a 12ª semana.\n\n**Fontes naturais:**\n🥦 Brócolis · 🫘 Feijão · 🥬 Espinafre · 🍊 Laranja · 🥑 Abacate`,read:3},
  {id:3,cat:"Nutrição",emoji:"🐟",color:"#4ecba1",bg:"#e8f8f2",tri:[2,3],tag:"Artigo",title:"Ômega-3 na gravidez: benefícios para o bebê",intro:"O ômega-3 é essencial para o desenvolvimento cerebral do bebê.",body:`O DHA favorece o desenvolvimento cognitivo e visual do bebê.\n\n**Peixes seguros:**\n🐟 Sardinha · Salmão · Atum em lata (moderação)\n\n**Fontes vegetais:**\n🌰 Linhaça · Chia · Nozes · Azeite de oliva`,read:5},
  {id:4,cat:"Saúde",emoji:"🩺",color:"#ff8a65",bg:"#fff0eb",tri:[1,2,3],tag:"Essencial",title:"Sinais de alerta que exigem ida ao médico",intro:"Aprenda a identificar sintomas que precisam de atenção médica imediata.",body:`🚨 **Vá à emergência AGORA se tiver:**\n• Sangramento vaginal\n• Dor abdominal intensa\n• Pressão acima de 140/90 mmHg\n• Inchaço súbito nas mãos e rosto\n• Febre acima de 38°C`,read:4},
  {id:5,cat:"Saúde",emoji:"😴",color:"#ff8a65",bg:"#fff0eb",tri:[1,2,3],tag:"Dica rápida",title:"Como dormir melhor durante a gravidez",intro:"O sono muda muito na gestação. Veja as melhores posições.",body:`**Melhor posição:** Lado esquerdo (SOS)\n✅ Melhora fluxo de sangue\n✅ Reduz pressão nos rins\n\n🛏️ Use travesseiro entre os joelhos`,read:3},
  {id:6,cat:"Saúde",emoji:"🏃",color:"#ff8a65",bg:"#fff0eb",tri:[1,2,3],tag:"Artigo",title:"Exercícios seguros durante a gravidez",intro:"Manter-se ativa traz benefícios enormes.",body:`✅ Reduz dores nas costas\n✅ Controla ganho de peso\n✅ Melhora humor\n\n🚶 Caminhada · 🏊 Natação · 🧘 Yoga para gestantes`,read:6},
  {id:7,cat:"Emocional",emoji:"💆",color:"#b388ff",bg:"#f3eeff",tri:[1,2,3],tag:"Artigo",title:"Ansiedade na gravidez: é normal e como lidar",intro:"Sentir ansiedade durante a gestação é muito comum.",body:`15-20% das gestantes experienciam ansiedade significativa.\n\n**Como lidar:**\n🧘 Meditação e respiração profunda\n📝 Escrever os medos no diário\n🤝 Conversar com pessoas de confiança`,read:6},
  {id:8,cat:"Emocional",emoji:"💑",color:"#b388ff",bg:"#f3eeff",tri:[1,2,3],tag:"Dica rápida",title:"Como manter o relacionamento forte na gravidez",intro:"A gravidez transforma o relacionamento.",body:`❤️ Inclua o parceiro nas consultas\n❤️ Compartilhem as preocupações\n❤️ Datas simples: filmes, jantares em casa`,read:4},
  {id:9,cat:"Desenvolvimento",emoji:"👶",color:"#64b5f6",bg:"#e3f2fd",tri:[1],tag:"Artigo",title:"1º trimestre: o que está acontecendo com seu bebê",intro:"Das células ao feto: o incrível desenvolvimento nas primeiras 12 semanas.",body:`**Semana 4-6:** O coração começa a bater!\n**Semana 7-9:** Olhos, nariz, boca se formam\n**Semana 10-12:** Unhas e cabelos crescem`,read:7},
  {id:10,cat:"Desenvolvimento",emoji:"🌱",color:"#64b5f6",bg:"#e3f2fd",tri:[2],tag:"Artigo",title:"2º trimestre: a fase mais tranquila da gestação",intro:"O segundo trimestre costuma ser o mais tranquilo.",body:`🌟 **Semana 16-18:** Você começa a sentir o bebê!\n🌟 **Semana 20:** Morfológico — pode descobrir o sexo\n🌟 **Semana 22-24:** Bebê já ouve sua voz`,read:5},
  {id:11,cat:"Desenvolvimento",emoji:"🏁",color:"#64b5f6",bg:"#e3f2fd",tri:[3],tag:"Artigo",title:"3º trimestre: preparando para o grande dia",intro:"As últimas semanas são de preparação intensa.",body:`🧠 Cérebro se desenvolve em ritmo acelerado\n💪 Bebê ganha gordura corporal\n\n📦 Monte a mala maternidade\n📚 Faça curso de gestantes`,read:7},
  {id:12,cat:"Parto",emoji:"🏥",color:"#f06292",bg:"#fce4ec",tri:[3],tag:"Essencial",title:"Parto normal x cesárea: entenda as diferenças",intro:"Qual a melhor opção? Entenda indicações e benefícios.",body:`**Parto Normal:**\n✅ Recuperação mais rápida\n✅ Menor risco cirúrgico\n\n**Cesárea:**\n✅ Indicada em situações específicas\n⚠️ Recuperação de 4-6 semanas`,read:6},
  {id:13,cat:"Parto",emoji:"🧘",color:"#f06292",bg:"#fce4ec",tri:[2,3],tag:"Dica rápida",title:"Técnicas de respiração para o trabalho de parto",intro:"Respirar corretamente pode fazer toda a diferença.",body:`**Técnica 1 — Respiração lenta:**\nInspire 4 → Segure 2 → Expire 6\n\n**Técnica 2 — Superficial:**\n"hee-hee-hoo" nas contrações intensas`,read:4},
  {id:14,cat:"Amamentação",emoji:"🤱",color:"#ffd54f",bg:"#fffde7",tri:[3],tag:"Essencial",title:"Tudo que você precisa saber sobre amamentação",intro:"O leite materno é o melhor alimento para o bebê.",body:`✅ Protege contra infecções e alergias\n✅ Fortalece o vínculo mãe-bebê\n\n**Pega correta:** O bebê abocanha não só o bico, mas a aréola.\n✓ Não dói · ✓ Boca bem aberta`,read:8},
];

function ArticlesScreen({profile,plan,onUpgrade}){
  const [filter,setFilter]=useState("Todos");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [saved,setSaved]=useState([]);
  const isPremium=plan==="premium";

  const cats=["Todos","Nutrição","Saúde","Emocional","Desenvolvimento","Parto","Amamentação"];
  const week=profile?.week||14;
  const tri=week<=12?1:week<=27?2:3;

  const filtered=ARTICLES.filter(a=>{
    const matchCat=filter==="Todos"||a.cat===filter;
    const matchSearch=!search||a.title.toLowerCase().includes(search.toLowerCase())||a.intro.toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchSearch;
  });

  const toggleSave=(id)=>setSaved(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const isLocked=(id)=>!isPremium&&!FREE_ARTICLE_IDS.includes(id);

  const handleArticleClick=(id)=>{
    if(isLocked(id)){onUpgrade();return;}
    setSelected(id);
  };

  if(selected){
    const art=ARTICLES.find(a=>a.id===selected);
    return(
      <div style={{paddingBottom:100,minHeight:"100vh",background:C.bg}}>
        <div style={{background:art.color,padding:"52px 22px 28px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
          <div onClick={()=>setSelected(null)} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",color:"rgba(255,255,255,0.8)",fontSize:13,fontWeight:600,marginBottom:16,background:"rgba(255,255,255,0.15)",padding:"6px 14px",borderRadius:100}}>
            ← Voltar
          </div>
          <div style={{display:"inline-block",background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"3px 12px",fontSize:10,color:"#fff",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{art.tag}</div>
          <div style={{fontSize:32,marginBottom:10}}>{art.emoji}</div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.2,marginBottom:8}}>{art.title}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{art.cat} · {art.read} min de leitura</div>
        </div>
        <div style={{padding:"24px 20px"}}>
          <div style={{background:art.bg,border:`1.5px solid ${art.color}33`,borderRadius:16,padding:"16px 18px",marginBottom:20,fontSize:14,color:C.dark,lineHeight:1.7,fontWeight:500,fontStyle:"italic"}}>{art.intro}</div>
          {art.body.split("\n").map((line,i)=>{
            if(!line.trim())return <div key={i} style={{height:12}}/>;
            if(line.startsWith("**")&&line.endsWith("**"))
              return <div key={i} style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:15,color:C.dark,marginBottom:6,marginTop:8}}>{line.replace(/\*\*/g,"")}</div>;
            return <div key={i} style={{fontSize:14,color:"#2c2c3e",lineHeight:1.75,marginBottom:4}}>{line}</div>;
          })}
          <div style={{display:"flex",gap:10,marginTop:24}}>
            <div onClick={()=>toggleSave(art.id)} style={{flex:1,background:saved.includes(art.id)?art.color:C.card,border:`1.5px solid ${saved.includes(art.id)?art.color:C.border}`,borderRadius:13,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:700,color:saved.includes(art.id)?"#fff":C.dark,transition:"all 0.2s"}}>
              {saved.includes(art.id)?"❤️ Salvo":"🤍 Salvar"}
            </div>
            <div onClick={()=>setSelected(null)} style={{flex:1,background:C.dark,borderRadius:13,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff"}}>
              ← Voltar
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:C.dark,padding:"52px 22px 20px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,rgba(78,203,161,0.15),transparent)`}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:"'Baloo 2',cursive",fontSize:26,fontWeight:800,color:"#fff",letterSpacing:-0.5}}>📰 Artigos</div>
          {!isPremium&&<Chip label={`🔒 ${FREE_ARTICLE_IDS.length}/14 grátis`} color="rgba(255,255,255,0.6)" bg="rgba(255,255,255,0.08)"/>}
          {isPremium&&<Chip label="👑 14/14 artigos" color={C.gold} bg="rgba(245,158,11,0.15)"/>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.08)",borderRadius:13,padding:"10px 14px",border:"1px solid rgba(255,255,255,0.12)"}}>
          <span style={{fontSize:16,opacity:0.6}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar artigos..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:13,fontFamily:"inherit"}}/>
          {search&&<span onClick={()=>setSearch("")} style={{cursor:"pointer",opacity:0.5,fontSize:16}}>✕</span>}
        </div>
      </div>

      {/* Banner premium nos artigos */}
      {!isPremium&&(
        <div style={{padding:"12px 16px 0"}}>
          <PaywallBanner feature="articles" onUpgrade={onUpgrade} compact/>
        </div>
      )}

      <div style={{padding:"8px 0 0",overflowX:"auto",display:"flex",gap:8,paddingLeft:16,paddingBottom:4}}>
        {cats.map(c=>(
          <div key={c} onClick={()=>setFilter(c)} style={{flexShrink:0,padding:"7px 16px",borderRadius:100,background:filter===c?C.dark:C.card,color:filter===c?"#fff":C.muted,border:`1px solid ${filter===c?C.dark:C.border}`,fontSize:12,fontWeight:filter===c?700:400,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>{c}</div>
        ))}
        <div style={{width:8,flexShrink:0}}/>
      </div>

      {filter==="Todos"&&!search&&(()=>{
        const destaque=ARTICLES.find(a=>a.tri.includes(tri))||ARTICLES[0];
        const locked=isLocked(destaque.id);
        return(
          <div style={{padding:"14px 16px 0"}}>
            <div style={{fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>📌 Recomendado para a semana {week}</div>
            <div onClick={()=>handleArticleClick(destaque.id)} style={{background:`linear-gradient(135deg,${destaque.color},${destaque.color}cc)`,borderRadius:20,padding:"22px 20px",cursor:"pointer",position:"relative",overflow:"hidden",marginBottom:4}}>
              <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
              {locked&&<div style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.3)",borderRadius:100,padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
                <IcoLock size={10} color="#fff"/>
                <span style={{fontSize:10,color:"#fff",fontWeight:700}}>Premium</span>
              </div>}
              <div style={{display:"inline-block",background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"3px 12px",fontSize:10,color:"#fff",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{destaque.tag}</div>
              <div style={{fontSize:28,marginBottom:8}}>{destaque.emoji}</div>
              <div style={{fontFamily:"'Baloo 2',cursive",fontSize:18,fontWeight:800,color:"#fff",marginBottom:6,lineHeight:1.3}}>{destaque.title}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.5,marginBottom:12}}>{destaque.intro}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{destaque.read} min de leitura</span>
                <span style={{background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"5px 14px",fontSize:12,color:"#fff",fontWeight:700}}>{locked?"👑 Premium →":"Ler agora →"}</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{padding:"14px 16px 0"}}>
        {!search&&filter==="Todos"&&<div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:10,fontFamily:"'Baloo 2',cursive"}}>Todos os artigos</div>}
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
            <div style={{fontSize:40,marginBottom:10}}>🔍</div>
            <div style={{fontWeight:700,color:C.dark,marginBottom:4}}>Nenhum artigo encontrado</div>
          </div>
        )}
        {filtered.map((art)=>{
          const locked=isLocked(art.id);
          return(
            <div key={art.id} onClick={()=>handleArticleClick(art.id)}
              style={{background:locked?"#fafafa":C.card,border:`1px solid ${locked?C.border:C.border}`,borderRadius:16,padding:"14px 16px",marginBottom:10,cursor:"pointer",display:"flex",gap:13,alignItems:"flex-start",transition:"all 0.2s",opacity:locked?0.75:1}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=locked?C.premium:art.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{width:48,height:48,borderRadius:13,background:locked?"#f0f0f0":art.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,position:"relative"}}>
                {art.emoji}
                {locked&&<div style={{position:"absolute",bottom:-4,right:-4,width:18,height:18,borderRadius:"50%",background:C.premium,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <IcoLock size={9} color="#fff"/>
                </div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,background:art.bg,color:art.color,padding:"2px 8px",borderRadius:100,fontWeight:700,letterSpacing:0.5}}>{art.cat}</span>
                  {locked&&<span style={{fontSize:9,background:C.premiumLight,color:C.premium,padding:"2px 8px",borderRadius:100,fontWeight:700}}>👑 Premium</span>}
                  {!locked&&<span style={{fontSize:9,color:C.muted}}>{art.tag}</span>}
                </div>
                <div style={{fontFamily:"'Baloo 2',cursive",fontWeight:800,fontSize:14,color:C.dark,lineHeight:1.3,marginBottom:4}}>{art.title}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{art.intro}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                  <span style={{fontSize:11,color:C.muted}}>{art.read} min</span>
                  {!locked&&<div onClick={e=>{e.stopPropagation();toggleSave(art.id);}} style={{fontSize:16,cursor:"pointer"}}>
                    {saved.includes(art.id)?"❤️":"🤍"}
                  </div>}
                  {locked&&<span style={{fontSize:11,color:C.premium,fontWeight:700}}>Desbloquear →</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function calcGestWeekFromDPP(dpp){
  if(!dpp)return null;
  const dppDate=new Date(dpp);
  if(isNaN(dppDate.getTime()))return null;
  const conc=new Date(dppDate);
  conc.setDate(conc.getDate()-280);
  const now=new Date();
  const w=Math.round((now.getTime()-conc.getTime())/(1000*60*60*24*7));
  return Math.max(1,Math.min(40,w));
}
function calcBabyWeeksFromBirth(birth){
  if(!birth)return null;
  const parts=birth.split('-');
  if(parts.length!==3)return null;
  const year=parseInt(parts[0]);const month=parseInt(parts[1])-1;const day=parseInt(parts[2]);
  const currentYear=new Date().getFullYear();
  if(year<2000||year>currentYear)return null;
  const b=new Date(year,month,day);
  if(isNaN(b.getTime()))return null;
  const now=new Date();
  if(b>now)return null;
  const w=Math.floor((now.getTime()-b.getTime())/(1000*60*60*24*7));
  return Math.max(0,Math.min(520,w));
}
function formatBabyAge(weeks){
  if(weeks===null||weeks===undefined)return null;
  if(weeks===0)return "recém-nascido";
  if(weeks<4)return `${weeks} semana${weeks!==1?"s":""}`;
  const months=Math.floor(weeks/4);
  if(weeks<52)return `${months} ${months===1?"mês":"meses"} (${weeks} semanas)`;
  const yrs=Math.floor(weeks/52);
  const remMonths=Math.floor((weeks%52)/4);
  if(remMonths===0)return `${yrs} ano${yrs!==1?"s":""}`;
  return `${yrs} ano${yrs!==1?"s":""} e ${remMonths} ${remMonths===1?"mês":"meses"}`;
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
function MainApp({user,onLogout}){
  const [screen,setScreen]=useState("home");
  const [notifs,setNotifs]=useState(NOTIFS_INIT);
  const [appMode,setAppMode]=useState(user.mode||"gestacao");
  const [plan,setPlan]=useState(user.plan||"free"); // "free" | "premium"
  const [showPlans,setShowPlans]=useState(false);
  const unread=notifs.filter(n=>!n.read).length;
  const isPost=appMode==="post";

  const liveGestWeek=calcGestWeekFromDPP(user.dpp);
  const liveBabyWeeks=calcBabyWeeksFromBirth(user.babyBirth);
  const gestWeek=liveGestWeek??user.week??null;
  const babyWeeks=liveBabyWeeks??user.babyWeeks??null;

  const profile={
    name:user.name,
    week:gestWeek,
    babyName:user.babyName||"Brotinho",
    babyWeeks:babyWeeks,
    babyAge:formatBabyAge(babyWeeks),
    gender:user.gender,
    dpp:user.dpp,
    babyBirth:user.babyBirth,
  };

  const handleUpgrade=()=>{setShowPlans(true);setScreen("home");};
  const handlePlanSuccess=()=>{setPlan("premium");setShowPlans(false);};

  // Navega para telas — bloqueadas abrem o paywall
  const handleNav=(target)=>{
    if(target==="plans"){handleUpgrade();return;}
    setScreen(target);
  };

  const gestTabs=[
    {id:"home",Icon:IcoHome,label:"Início"},
    {id:"baby",Icon:IcoBaby,label:"Bebê"},
    {id:"artigos",Icon:p=><svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke={p.color||C.dark} strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,label:"Artigos"},
    {id:"saude",Icon:IcoPulse,label:"Saúde",locked:plan!=="premium"},
    {id:"chat",Icon:IcoChat,label:"IA"},
  ];
  const postTabs=[
    {id:"home",Icon:IcoHome,label:"Início"},
    {id:"baby",Icon:IcoBaby,label:"Bebê"},
    {id:"enxoval",Icon:IcoBag,label:"Enxoval"},
    {id:"notifs",Icon:IcoBell,label:"Avisos"},
    {id:"chat",Icon:IcoChat,label:"IA"},
  ];
  const tabs=isPost?postTabs:gestTabs;

  const screens={
    home:   <HomeScreen profile={profile} onNav={handleNav} mode={appMode} unreadCount={unread} onLogout={onLogout} plan={plan} onUpgrade={handleUpgrade}/>,
    baby:   <BabyScreen profile={profile} mode={appMode}/>,
    saude:  <SaudeScreen profile={profile} plan={plan} onUpgrade={handleUpgrade}/>,
    exams:  <ExamsScreen plan={plan} onUpgrade={handleUpgrade}/>,
    diary:  <DiaryScreen profile={profile} plan={plan} onUpgrade={handleUpgrade}/>,
    enxoval:<EnxovalScreen/>,
    notifs: <NotifsScreen notifs={notifs} setNotifs={setNotifs}/>,
    artigos:<ArticlesScreen profile={profile} plan={plan} onUpgrade={handleUpgrade}/>,
    chat:   <ChatScreen profile={profile} mode={appMode} plan={plan} onUpgrade={handleUpgrade}/>,
  };

  // Tela de planos sobrepõe tudo
  if(showPlans){
    return(
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet"/>
        <style>{CSS_GLOBAL}</style>
        <PlansScreen
          onClose={()=>setShowPlans(false)}
          onSuccess={handlePlanSuccess}
          currentPlan={plan}
        />
      </div>
    );
  }

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,position:"relative"}}>
      {/* MODE TOGGLE */}
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:200,display:"flex",justifyContent:"center",padding:"7px 14px",background:"rgba(26,26,46,0.96)",backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",background:"rgba(255,255,255,0.08)",borderRadius:100,padding:3,gap:2}}>
          {[["gestacao","🤰 Gestação"],["post","👶 Pós-parto"]].map(([id,label])=>(
            <div key={id} onClick={()=>{setAppMode(id);setScreen("home");}} style={{padding:"5px 14px",borderRadius:100,background:appMode===id?"#fff":"transparent",color:appMode===id?C.dark:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:appMode===id?700:400,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>{label}</div>
          ))}
        </div>
      </div>

      <div style={{paddingTop:38}}>{screens[screen]||screens.home}</div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>t.locked?handleUpgrade():setScreen(t.id)}
            style={{flex:1,border:"none",background:"none",padding:"10px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
            {t.id==="notifs"&&unread>0&&<div style={{position:"absolute",top:5,right:"calc(50% - 18px)",width:13,height:13,borderRadius:"50%",background:C.peach,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{unread}</div>}
            {t.locked&&<div style={{position:"absolute",top:7,right:"calc(50% - 18px)",width:11,height:11,borderRadius:"50%",background:C.premium,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <IcoLock size={6} color="#fff"/>
            </div>}
            <div style={{width:33,height:33,borderRadius:10,background:screen===t.id?C.dark:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              <t.Icon size={16} color={screen===t.id?"#fff":t.locked?C.premium:C.muted}/>
            </div>
            <span style={{fontSize:10,color:screen===t.id?C.dark:t.locked?C.premium:C.muted,fontWeight:screen===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CSS GLOBAL
// ═══════════════════════════════════════════════════════════
const CSS_GLOBAL=`
  *{box-sizing:border-box;margin:0;padding:0}
  input[type=date]::-webkit-calendar-picker-indicator{opacity:0.5;cursor:pointer}
  @keyframes blobF{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,-18px) scale(1.04)}}
  @keyframes logoF{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
  @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
`;

// ═══════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════
export default function Brotinho(){
  const [phase,setPhase]=useState("splash");
  const [userData,setUserData]=useState({});
  const [selMode,setSelMode]=useState(null);

  const flows={
    splash:   <Splash onDone={()=>setPhase("welcome")}/>,
    welcome:  <Welcome onLogin={()=>setPhase("login")} onRegister={()=>setPhase("register")}/>,
    login:    <Login onBack={()=>setPhase("welcome")} onForgot={()=>setPhase("forgot")} onSuccess={u=>{setUserData(u);setPhase("success");}}/>,
    register: <Register onBack={()=>setPhase("welcome")} onNext={u=>{setUserData(u);setPhase("mode");}}/>,
    mode:     <ProfileMode user={userData} onBack={()=>setPhase("register")} onNext={m=>{setSelMode(m);setPhase("details");}}/>,
    details:  <ProfileDetails user={userData} mode={selMode} onBack={()=>setPhase("mode")} onDone={u=>{setUserData(u);setPhase("success");}}/>,
    success:  <Success user={userData} onEnter={()=>setPhase("app")}/>,
    forgot:   <Forgot onBack={()=>setPhase("login")}/>,
    app:      <MainApp user={userData} onLogout={()=>{setPhase("welcome");setUserData({});}}/>,
  };

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet"/>
      <style>{CSS_GLOBAL}</style>
      {flows[phase]||flows.welcome}
    </div>
  );
}