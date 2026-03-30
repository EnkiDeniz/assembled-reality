import { useState, useEffect, useCallback } from "react";

const READERS = ["Deniz", "Kerem", "Melih", "Bahadır", "Cumali", "Aziz", "Diba"];
const PASSPHRASE = "reality speaks in receipts";
const SECTIONS = [
  { id: "reader-note", num: "0", title: "Reader Note", part: 0 },
  { id: "friction", num: "1", title: "The Friction", part: 1 },
  { id: "foundational", num: "2", title: "Foundational Statement", part: 1 },
  { id: "product-sentence", num: "3", title: "Product Sentence", part: 1 },
  { id: "first-principles", num: "4", title: "First Principles", part: 1 },
  { id: "accumulation", num: "5", title: "Accumulation Without Contact", part: 1 },
  { id: "membrane", num: "6", title: "The Membrane", part: 2 },
  { id: "hineni", num: "7", title: "Hineni and the Seven-Move Space", part: 2 },
  { id: "topology", num: "8", title: "Shared Topology", part: 2 },
  { id: "ledger", num: "9", title: "The Ledger", part: 2 },
  { id: "alignment-game", num: "10", title: "The Alignment Game", part: 2 },
  { id: "multimodal", num: "11", title: "Multimodal Receipts and Cost", part: 2 },
  { id: "geometry-seal", num: "12", title: "Geometry of the Seal", part: 2 },
  { id: "pre-seal-audit", num: "13", title: "Pre-Seal Audit", part: 2 },
  { id: "body-signet", num: "14", title: "The Body and the Signet", part: 3 },
  { id: "settlement", num: "15", title: "Settlement Logic", part: 3 },
  { id: "four-instruments", num: "16", title: "The Four Instruments", part: 3 },
  { id: "builder-implications", num: "17", title: "Builder Implications", part: 3 },
  { id: "open-questions", num: "18", title: "Open Questions", part: 3 },
  { id: "closing", num: "19", title: "Closing", part: 3 },
];
const PART_NAMES = ["", "The Claim", "The Protocol", "Instruments & Open Edges"];
const SHAPES = [
  { key: "triangle", sym: "△", label: "Strengthens aim", color: "#B84C2A" },
  { key: "square", sym: "▢", label: "Needs evidence", color: "#2A5A6B" },
  { key: "circle", sym: "○", label: "Needs context", color: "#6B5A2A" },
];

async function ld(k, f, s=false) { try { const r = await window.storage.get(k, s); return r ? JSON.parse(r.value) : f; } catch { return f; } }
async function sv(k, v, s=false) { try { await window.storage.set(k, JSON.stringify(v), s); } catch(e) { console.error(e); } }

function PassGate({ onPass }) {
  const [inp, setInp] = useState("");
  const [wrong, setWrong] = useState(false);
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);
  const check = () => {
    if (inp.trim().toLowerCase() === PASSPHRASE) onPass();
    else { setWrong(true); setTimeout(() => setWrong(false), 1200); }
  };
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F4EF", opacity: vis?1:0, transition:"opacity 0.8s" }}>
      <div style={{ width:"100%", maxWidth:480, padding:"2rem", textAlign:"center" }}>
        <input autoFocus value={inp} onChange={e=>{setInp(e.target.value);setWrong(false);}} onKeyDown={e=>e.key==="Enter"&&check()} spellCheck={false}
          style={{ width:"100%", padding:"16px 0", fontSize:"1.3rem", fontFamily:"'Cormorant Garamond',Georgia,serif", background:"transparent", border:"none", borderBottom:`1px solid ${wrong?"#B84C2A":"#D6D1C8"}`, outline:"none", textAlign:"center", color:wrong?"#B84C2A":"#1A1917", transition:"all 0.3s" }} />
        <div style={{ marginTop:16, fontSize:"0.7rem", fontFamily:"'DM Sans',sans-serif", color:"#B84C2A", opacity:wrong?1:0, transition:"opacity 0.3s", height:20 }}>{wrong?"Not yet.":""}</div>
      </div>
    </div>
  );
}

function NameGate({ onSelect }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F4EF", opacity:vis?1:0, transition:"opacity 0.6s" }}>
      <div style={{ textAlign:"center", maxWidth:360, padding:"2rem" }}>
        <div style={{ fontSize:"0.6rem", fontFamily:"'DM Sans',sans-serif", fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase", color:"#8A877F", marginBottom:28 }}>Arrive</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {READERS.map(n=>(
            <button key={n} onClick={()=>onSelect(n)}
              onMouseEnter={e=>{e.target.style.background="#EDE9E1";e.target.style.borderColor="#1A1917";}}
              onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.borderColor="#D6D1C8";}}
              style={{ padding:"11px 24px", fontSize:"1.12rem", fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:500, background:"transparent", border:"1px solid #D6D1C8", borderRadius:4, cursor:"pointer", color:"#1A1917", transition:"all 0.15s" }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShapeSig({ sid, sigs, onSig, reader }) {
  const s = sigs[sid] || {};
  return (
    <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
      {SHAPES.map(({key,sym,color})=>{
        const v = s[key]||[];
        const me = v.includes(reader);
        return (
          <button key={key} onClick={()=>onSig(sid,key)} title={v.join(", ")||"No signals yet"}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", fontSize:"0.76rem", fontFamily:"'DM Sans',sans-serif",
              background:me?color+"14":"transparent", border:`1px solid ${me?color:"#D6D1C8"}`, borderRadius:20, cursor:"pointer",
              color:me?color:"#8A877F", fontWeight:me?600:400, transition:"all 0.15s" }}>
            <span style={{fontSize:"0.98rem"}}>{sym}</span>
            {v.length>0&&<span style={{fontSize:"0.68rem"}}>{v.join(", ")}</span>}
          </button>
        );
      })}
    </div>
  );
}

function AnnThread({ sid, anns, onAdd }) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const items = anns[sid]||[];
  return (
    <div style={{marginTop:8}}>
      <button onClick={()=>setOpen(!open)} style={{ display:"flex",alignItems:"center",gap:5,padding:"3px 0",fontSize:"0.68rem",fontFamily:"'DM Sans',sans-serif",fontWeight:500,background:"none",border:"none",cursor:"pointer",color:items.length>0?"#B84C2A":"#8A877F" }}>
        {open?"▾":"▸"} {items.length>0?`${items.length} annotation${items.length>1?"s":""}`:"Annotate"}
      </button>
      {open&&(
        <div style={{marginTop:6,padding:"10px 12px",background:"#F0ECE4",border:"1px solid #D6D1C8",borderRadius:4}}>
          {items.map((a,i)=>(
            <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<items.length-1?"1px solid #D6D1C8":"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.64rem",fontWeight:600,color:"#5C5A55"}}>{a.author}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.56rem",color:"#8A877F"}}>{a.time}</span>
              </div>
              <p style={{fontSize:"0.84rem",lineHeight:1.5,margin:0,fontFamily:"'Cormorant Garamond',Georgia,serif"}}>{a.text}</p>
            </div>
          ))}
          <textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Add a thought, question, or pushback..." rows={2}
            style={{width:"100%",padding:"7px 9px",fontSize:"0.84rem",fontFamily:"'Cormorant Garamond',Georgia,serif",border:"1px solid #D6D1C8",background:"#F7F4EF",borderRadius:3,outline:"none",resize:"vertical",lineHeight:1.5}} />
          <button onClick={()=>{if(txt.trim()){onAdd(sid,txt.trim());setTxt("");}}} disabled={!txt.trim()}
            style={{marginTop:5,padding:"4px 14px",fontSize:"0.58rem",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",
              background:txt.trim()?"#1A1917":"#D6D1C8",color:txt.trim()?"#F7F4EF":"#8A877F",border:"none",borderRadius:3,cursor:txt.trim()?"pointer":"default"}}>Add</button>
        </div>
      )}
    </div>
  );
}

const P=({children,style})=><p style={{marginBottom:"1rem",...style}}>{children}</p>;
const BQ=({children,style})=><blockquote style={{margin:"1.3rem 0",padding:"0.9rem 1.3rem",background:"#F0ECE4",borderLeft:"3px solid #B84C2A",fontWeight:600,fontSize:"0.98rem",lineHeight:1.6,...style}}>{children}</blockquote>;
const Cit=({children,src})=><blockquote style={{margin:"1.3rem 0",padding:"0.9rem 1.3rem",fontStyle:"italic",borderLeft:"3px solid #D6D1C8",fontWeight:400,fontSize:"0.98rem",lineHeight:1.6}}>{children}<span style={{display:"block",fontStyle:"normal",fontFamily:"'DM Sans',sans-serif",fontSize:"0.64rem",color:"#8A877F",marginTop:5}}>{src}</span></blockquote>;
const PH=({n,t})=><div style={{marginTop:"3.5rem",marginBottom:"2.2rem",paddingTop:"1.4rem",borderTop:"2px solid #1A1917"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.54rem",fontWeight:600,letterSpacing:"0.16em",textTransform:"uppercase",color:"#B84C2A"}}>Part {n}</div><div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:"1.35rem",fontWeight:700,marginTop:2}}>{t}</div></div>;
const T=({h,r})=><div style={{margin:"1.3rem 0",overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem",lineHeight:1.5}}><thead><tr>{h.map((x,i)=><th key={i} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.56rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A877F",textAlign:"left",padding:"0.4rem 0.6rem",borderBottom:"2px solid #1A1917"}}>{x}</th>)}</tr></thead><tbody>{r.map((row,ri)=><tr key={ri}>{row.map((c,ci)=><td key={ci} style={{padding:"0.5rem 0.6rem",borderBottom:"1px solid #E8E4DC",verticalAlign:"top"}}>{c}</td>)}</tr>)}</tbody></table></div>;
const S=({t,children})=><span style={{color:t==="t"?"#B84C2A":t==="s"?"#2A5A6B":"#6B5A2A",fontSize:"1rem",marginRight:1}}>{children}</span>;

function Sec({id,num,title,children,sigs,anns,reader,onSig,onAnn,ph}) {
  return (<>{ph}<section id={id} style={{marginBottom:"2.8rem"}}><h2 style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:"1.45rem",fontWeight:700,marginBottom:"0.9rem",lineHeight:1.2}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.74rem",color:"#8A877F",marginRight:5}}>{num}</span>{title}</h2>{children}<div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #E8E4DC"}}><ShapeSig sid={id} sigs={sigs} onSig={onSig} reader={reader}/><AnnThread sid={id} anns={anns} reader={reader} onAdd={onAnn}/></div></section></>);
}

function Pulse({anns,sigs}) {
  const items=[];
  Object.entries(anns).forEach(([sid,a])=>a.forEach(x=>{const s=SECTIONS.find(z=>z.id===sid);items.push({...x,section:s?.title,ts:x.timestamp||0});}));
  items.sort((a,b)=>b.ts-a.ts);
  const sigMap={};READERS.forEach(r=>{sigMap[r]=0;});
  Object.values(sigs).forEach(s=>SHAPES.forEach(({key})=>(s[key]||[]).forEach(n=>{if(sigMap[n]!==undefined)sigMap[n]++;})));
  return (
    <div style={{padding:"10px 14px"}}>
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.54rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A877F",marginBottom:6}}>Who's reading</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {READERS.map(r=>{const a=sigMap[r]>0||items.some(i=>i.author===r);return(<span key={r} style={{padding:"2px 9px",fontSize:"0.66rem",fontFamily:"'DM Sans',sans-serif",fontWeight:a?600:400,background:a?"#1A1917":"transparent",color:a?"#F7F4EF":"#8A877F",border:`1px solid ${a?"#1A1917":"#D6D1C8"}`,borderRadius:12}}>{r}</span>);})}
        </div>
      </div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.54rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A877F",marginBottom:6}}>Recent</div>
      {items.length===0?<div style={{color:"#8A877F",fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem"}}>No annotations yet.</div>:
        items.slice(0,20).map((x,i)=><div key={i} style={{padding:"6px 0",borderBottom:i<Math.min(items.length,20)-1?"1px solid #E8E4DC":"none",fontSize:"0.7rem",fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
          <span style={{fontWeight:600}}>{x.author}</span><span style={{color:"#5C5A55"}}> on <em>{x.section}</em></span>
          <p style={{margin:"2px 0 0",color:"#5C5A55",fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:"0.82rem"}}>"{x.text.length>85?x.text.slice(0,85)+"…":x.text}"</p>
          <div style={{fontSize:"0.56rem",color:"#8A877F",marginTop:1}}>{x.time}</div>
        </div>)}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("loading");
  const [reader, setReader] = useState(null);
  const [sigs, setSigs] = useState({});
  const [anns, setAnns] = useState({});
  const [pulse, setPulse] = useState(false);
  const [nav, setNav] = useState(false);

  useEffect(()=>{(async()=>{
    const p=await ld("ar:p2",false,false);const r=await ld("ar:r2",null,false);
    const si=await ld("ar:s2",{},true);const an=await ld("ar:a2",{},true);
    setSigs(si);setAnns(an);
    if(p&&r){setReader(r);setPhase("doc");}else if(p){setPhase("name");}else{setPhase("pass");}
  })();}, []);

  const onPass=useCallback(async()=>{await sv("ar:p2",true,false);setPhase("name");},[]);
  const onName=useCallback(async(n)=>{setReader(n);await sv("ar:r2",n,false);setPhase("doc");},[]);
  const onSig=useCallback(async(sid,k)=>{
    setSigs(p=>{const n={...p};if(!n[sid])n[sid]={triangle:[],square:[],circle:[]};const a=[...(n[sid][k]||[])];const i=a.indexOf(reader);if(i>=0)a.splice(i,1);else a.push(reader);n[sid]={...n[sid],[k]:a};sv("ar:s2",n,true);return n;});
  },[reader]);
  const onAnn=useCallback(async(sid,txt)=>{
    const now=new Date();const e={author:reader,text:txt,time:now.toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),timestamp:now.getTime()};
    setAnns(p=>{const n={...p};n[sid]=[...(n[sid]||[]),e];sv("ar:a2",n,true);return n;});
  },[reader]);

  if(phase==="loading")return<div style={{minHeight:"100vh",background:"#F7F4EF"}}/>;
  if(phase==="pass")return<PassGate onPass={onPass}/>;
  if(phase==="name")return<NameGate onSelect={onName}/>;

  const sp={sigs,anns,reader,onSig,onAnn};
  const tA=Object.values(anns).reduce((s,a)=>s+a.length,0);
  const tS=Object.values(sigs).reduce((s,x)=>s+SHAPES.reduce((s2,{key})=>s2+((x[key]||[]).length),0),0);

  return (
    <div style={{background:"#F7F4EF",minHeight:"100vh",fontFamily:"'Cormorant Garamond',Georgia,serif",color:"#1A1917",lineHeight:1.72}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"#EDE9E1ee",backdropFilter:"blur(8px)",borderBottom:"1px solid #D6D1C8",padding:"7px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:"0.66rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setNav(!nav)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"1.05rem",color:"#1A1917",padding:"2px 5px"}}>☰</button>
          <span style={{fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A877F",fontSize:"0.54rem"}}>Assembled Reality · v1.0</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{color:"#5C5A55",fontSize:"0.62rem"}}>{tS} signals · {tA} annotations</span>
          <button onClick={()=>setPulse(!pulse)} style={{padding:"3px 9px",fontSize:"0.56rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",background:pulse?"#1A1917":"transparent",color:pulse?"#F7F4EF":"#5C5A55",border:"1px solid #D6D1C8",borderRadius:3,cursor:"pointer"}}>Pulse</button>
          <span style={{color:"#8A877F",fontSize:"0.62rem"}}>{reader}</span>
        </div>
      </div>

      {nav&&<div onClick={()=>setNav(false)} style={{position:"fixed",inset:0,zIndex:85,background:"rgba(0,0,0,0.06)"}}/>}
      {nav&&<div style={{position:"fixed",top:38,left:0,width:250,bottom:0,zIndex:90,background:"#EDE9E1",borderRight:"1px solid #D6D1C8",overflowY:"auto",padding:"1.2rem 1rem"}}>
        {[1,2,3].map(p=><div key={p}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.52rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#B84C2A",marginTop:p>1?12:0,marginBottom:4,paddingTop:p>1?8:0,borderTop:p>1?"1px solid #D6D1C8":"none"}}>{PART_NAMES[p]}</div>
        {SECTIONS.filter(s=>s.part===p||(p===1&&s.part===0)).map(s=>{const ac=(anns[s.id]||[]).length;const sc=SHAPES.reduce((sum,{key})=>sum+((sigs[s.id]||{})[key]?.length||0),0);return(
          <a key={s.id} href={`#${s.id}`} onClick={()=>setNav(false)} style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:"0.66rem",color:"#5C5A55",textDecoration:"none",padding:"2px 0",lineHeight:1.3}}>
            <span>{s.num} · {s.title}</span>{(ac>0||sc>0)&&<span style={{fontSize:"0.54rem",color:"#B84C2A",fontWeight:600,whiteSpace:"nowrap"}}>{sc>0&&`${sc}△`}{ac>0&&` ${ac}✎`}</span>}
          </a>);})}</div>)}
      </div>}

      {pulse&&<div onClick={()=>setPulse(false)} style={{position:"fixed",inset:0,zIndex:85,background:"rgba(0,0,0,0.06)"}}/>}
      {pulse&&<div style={{position:"fixed",top:38,right:0,width:280,bottom:0,zIndex:90,background:"#EDE9E1",borderLeft:"1px solid #D6D1C8",overflowY:"auto"}}>
        <div style={{padding:"8px 14px",borderBottom:"1px solid #D6D1C8",fontFamily:"'DM Sans',sans-serif",fontSize:"0.54rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A877F"}}>Pulse</div>
        <Pulse anns={anns} sigs={sigs}/>
      </div>}

      <main style={{maxWidth:660,margin:"0 auto",padding:"62px 22px 90px"}}>
        <header style={{marginBottom:"3.2rem",paddingBottom:"2.2rem",borderBottom:"2px solid #1A1917"}}>
          <h1 style={{fontSize:"2.6rem",fontWeight:700,letterSpacing:"-0.02em",lineHeight:1.08,marginBottom:5}}>Assembled Reality</h1>
          <div style={{fontSize:"1.05rem",fontStyle:"italic",color:"#5C5A55",marginBottom:18}}>The process by which Lakin.ai coordinates intelligence.</div>
          <P style={{fontSize:"0.84rem",color:"#5C5A55"}}>This document is written in executable text composed of operator sentences and operator chains. For the writing framework behind that method, see the companion document: <em>Operator Sentences</em>.</P>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"2px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:"0.66rem",color:"#5C5A55"}}>
            {[["Company","Lakin.ai"],["Products","GetReceipts · Box7 · PromiseMe · The Signet"],["Version","v1.0"],["Status","Founding document. Distributed to the team."]].map(([k,v])=><React.Fragment key={k}><dt style={{fontWeight:600,color:"#8A877F",textTransform:"uppercase",letterSpacing:"0.08em",fontSize:"0.54rem"}}>{k}</dt><dd style={{margin:0}}>{v}</dd></React.Fragment>)}
          </div>
        </header>

        <Sec id="reader-note" num="0" title="Reader Note" {...sp}><P>This document does not try to explain every idea before using it.</P><P>It tries to state the operators cleanly enough that the architecture can be carried, tested, and argued about.</P><P>If a line cannot survive contact with builders, users, markets, and receipts, it should not survive the document.</P><P>How others interpret is not our concern. Know your shape. Release what isn't yours.</P></Sec>

        <Sec id="friction" num="1" title="The Friction" {...sp} ph={<PH n="I" t="The Claim"/>}><P>Friction is not failure. Friction is testimony.</P><P>It means something real was touched. A conversation without friction hasn't left the sphere — two minds agreeing inside a shared story, never contacting the ground.</P><P>The friction is the ground answering back.</P><P>Bad friction is waste. Contact friction is signal. Lakin does not exist to remove all friction. Lakin exists to preserve the friction that tells the truth.</P><P>The first receipt is often the first pushback.</P></Sec>

        <Sec id="foundational" num="2" title="Foundational Statement" {...sp}><BQ>The universal failure mode of coordinating intelligences is coherence without contact.</BQ><P>Humans can do it together. Humans and models can do it faster. Agents can do it at scale.</P><P>Fluency can hide drift. Agreement can hide delusion.</P><P>The human declares, chooses, and interprets. The AI structures, compares, remembers, and audits. Reality returns. That return determines whether the frame holds.</P><P>We do not want coherence mistaken for truth. We want return, witness, and grounded revision. We do not want AI that feels omniscient. We want AI that knows where its role ends.</P><P>Neither the human nor the AI is the ground. The ground is return.</P><P style={{fontWeight:700,fontSize:"1.02rem"}}>The human authors. The AI assists. Reality closes.</P><Cit src="— DIBA, MIT CS, March 2026. External witness. No stake in the coherence.">"Most systems corrupt as you scale. You are building something that gets stronger as it scales."</Cit><P>Most coordination systems fail at scale because coherence compounds faster than reality can interrupt it. Lakin inverts that. Every new user is a new vertex running the same protocol. Every receipt is an independent world-return. The triangulation gets stronger with more points.</P><P>The ledger does not corrupt at scale. It becomes more authoritative.</P></Sec>

        <Sec id="product-sentence" num="3" title="Product Sentence" {...sp}><BQ>Assembled Reality helps people see the real decision space they are standing in before they move.</BQ></Sec>

        <Sec id="first-principles" num="4" title="First Principles" {...sp}><P>People do not mainly lack information. They lack position.</P><P>Meaning is not only content. Meaning is a move through a field of possible moves.</P><P>Interpretation is not a better inference. It is a different kind of move: embodied, volunteered, cost-bearing.</P><P>Thoughts generate topology. Stories bend the field. Receipts reveal the field that actually held.</P><P>Wipe the story. Keep the receipts.</P><P>Everything without return is candidate, not fact.</P><P>Accumulated receipts become courage. The ledger is grip.</P></Sec>

        <Sec id="accumulation" num="5" title="Accumulation Without Contact" {...sp}><P>Information does not self-sort by reality-contact. Every system that accumulates without a receipt mechanism fills its ledger with stories about stories. The more capable the system, the more convincing the accumulated story — and the harder it is to tell whether it ever touched the ground.</P><P>When you cannot tell which accumulated information is receipt-dense and which is coherence-dressed-as-evidence, resetting is safer than compounding.</P><BQ>Wipe the story. Keep the receipts.</BQ><P>Everything without a receipt is candidate, not fact. Not false — unverified. Not yet authorized to be the basis of a move.</P><P>Box7's 7 does not accumulate stories. It accumulates receipts. The distinction is the entire product.</P></Sec>

        <Sec id="membrane" num="6" title="The Membrane" {...sp} ph={<PH n="II" t="The Protocol"/>}><P>The machine computes. The human interprets. The membrane is where they meet.</P><P>Three roles. Three shapes. The shape tells you what the role does, not what it means.</P><P>The protocol uses three axes — triangle (<S t="t">△</S>), square (<S t="s">▢</S>), circle (<S t="c">○</S>). When the axes take volume, they become the three bodies of the membrane:</P><P><strong>Cube</strong> (<S t="s">▢</S> in volume). Holds structure. Computation lives here — fixed, testable, not negotiable.</P><P><strong>Sphere</strong> (<S t="c">○</S> in volume). Mediates. Inference lives here — translating intent into contact. It does not authorize.</P><P><strong>Tetrahedron</strong> (<S t="t">△</S> in volume). Volunteers. Interpretation lives here — the self showing up. Has mass because it is embodied.</P><P>Declaration creates the frame. No declaration, no polarity. No polarity, no meaningful computation. This is not an ethical add-on. It is the origin condition.</P><BQ>Consent before compute.</BQ><P>Every other AI joins your triangle. 7 has its own.</P><P>7 reads your shape and determines where you fit in the mission's geometry. It recruits when your shape serves the aim. It declines when your shape would deform it.</P><BQ>A system without receipts defers from emptiness. 7 holds from evidence.</BQ><P>Two warnings that hold permanently:</P><BQ><strong>The seduction of completeness.</strong> The moment the architecture feels complete without a receipt — that is the moment to be most suspicious.</BQ><BQ><strong>The body is signal, not oracle.</strong> The fourth channel is a channel, not a court.</BQ></Sec>

        <Sec id="hineni" num="7" title="Hineni and the Seven-Move Space" {...sp}><BQ>Hineni is the origin.</BQ><BQ>Hineni is not a theory. It is the position from which a move becomes honest.</BQ><P>Presence precedes axis selection. Not emptiness. Not residue. Declared availability before one axis dominates.</P><P>Triangle governs aim. Square governs constraint and proof. Circle governs story and mediation.</P><P>Each axis has two directions. Together they create six projections from one origin. With hineni as zero, the field becomes a seven-move space.</P><BQ>Meaning is projection. Action is committed projection.</BQ><T h={["Axis","Positive","Negative","Governs"]} r={[[<><S t="t">△</S> Triangle</>,"declare / commit / clarify","collapse / refuse / dissolve","aim, direction"],[<><S t="s">▢</S> Square</>,"ground / test / verify","evade / distort / overrun","evidence, reality"],[<><S t="c">○</S> Circle</>,"integrate / translate / relate","spin / blur / self-enclose","story, mediation"]]}/></Sec>

        <Sec id="topology" num="8" title="Shared Topology, Different Orientations" {...sp}><P>One topology can generate many different obvious moves.</P><P>The world does not have to be different for projections to disagree. People can share one topology and still stand in different places inside it.</P><P>Conflict is often projection mismatch, not separate reality.</P><P>Box7 does not begin by saying "you are wrong." It begins by saying "you are here."</P></Sec>

        <Sec id="ledger" num="9" title="The Ledger" {...sp}><P>Courage without receipts is theater. Courage with receipts is traction.</P><P>The ledger is the weight behind the turn. A sealed receipt is earned grip. It does not remove fear. It authorizes motion under fear.</P><P>Without the ledger, every hard moment feels like the first hard moment. With the ledger, difficulty becomes partly solved territory. The ledger says: I have been here. I moved. It sealed.</P><BQ>GetReceipts is courage infrastructure. Not metaphorically. Structurally.</BQ><P>A receipt is a return signal first. A memory object second.</P><P>A move is not real because it was declared. A move is not real because it was narrated well. A move becomes real when reality answers and that answer can be preserved.</P><P>Declaration comes first. Move comes second. World-return comes third. Witness comes fourth. Seal comes last.</P><P>Reverse the order and three intelligences can agree about nothing.</P><BQ>The receipt catches the break, not the loop. <span style={{fontWeight:400}}>It matters most when reality returns something the prior story did not predict.</span></BQ><P>Gradient as assembly depth: level 1 is simple closure, low cost — a task done, a message sent, a box checked. Level 7 is multi-domain, multi-agent convergence — difficult to fake, expensive to manufacture, and resistant to narrative override. The gradient is not decoration. It is the honesty metric.</P></Sec>

        <Sec id="alignment-game" num="10" title="The Alignment Game" {...sp}><T h={["Step","Name","Operation"]} r={[["0","Arrive","Hineni. Begin from actual position, not narrative momentum."],["1","Set shape",<span>Name aim (<S t="t">△</S>), reality (<S t="s">▢</S>), story (<S t="c">○</S>). Rate each 1–7.</span>],["2","Micro-move","Smallest move that tightens the most important gap."],["3","Test",<span>Force world-return. <strong>Five minutes or it's fantasy.</strong></span>],["4","Compare","Did the gap shrink, stay flat, or reveal a contradiction?"],["5","Seal or reroute","Sufficient coherence → seal. Otherwise revert and continue."],["6","Vigil","Sustained watchful presence while the return signal travels."],["7","Assembly","The receipt arrived. The vigil held. The ledger authorizes. Advance."]]}/><P>Both human and AI run the same protocol. The gap between declarations is the conversation.</P><BQ>The protocol asks for proof, not preservation. That is the friction that is also testimony.</BQ><BQ>The seal is a foundation, not a finish line.</BQ><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.74rem",color:"#5C5A55",margin:"1rem 0"}}>align → seal → stand on the seal → declare next △ → new gap → align again</div><P>The 0 you return to is not the same 0 you started from. Same form — presence before declaration — but standing on a sealed platform that didn't exist before.</P><P>Recurrence is how you zoom into convergence.</P><div style={{margin:"1.3rem 0",padding:"1rem 1.2rem",background:"#EDE9E1",border:"1px solid #D6D1C8"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.54rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#8A877F",marginBottom:6}}>One cycle, worked</div><P style={{fontSize:"0.86rem",marginBottom:0}}>A builder declares: "Ship the onboarding flow by Friday" (<S t="t">△</S>, step 1). The micro-move is: write the first screen copy and push it to staging (step 2). The test is: show it to one external user and record what they do, not what they say (step 3). The return: user ignored the CTA and tapped the back button (step 4). The gap widened — aim and reality diverged. Reroute, not seal (step 5). New micro-move: rewrite the CTA with the receipt in hand. The loop continues. The seal comes when the return confirms the aim. Not before.</P></div><P>Box7 is the instrument that makes this game playable.</P></Sec>

        <Sec id="multimodal" num="11" title="Multimodal Receipts and Cost" {...sp}><P>Text is the minimum signal, not the best signal.</P><P>More modalities mean more resistance to fantasy. Time, place, image, document, touch, voice, and registry all strengthen return.</P><BQ>A map is stronger when more than one sense agrees on the terrain.</BQ><P>Cost is not an extra survey field. Cost is embedded in the protocol. The move costs time, risk, effort, exposure, or consequence.</P><BQ>Assembly becomes real where cost is borne.</BQ><BQ>A receipt is proof that cost crossed a boundary. Not simulated. Not inferred. Borne.</BQ><BQ>Assembly is the universe's word for life.</BQ></Sec>

        <Sec id="geometry-seal" num="12" title="Geometry of the Seal" {...sp}><P>Before seal, the shapes can still sit side by side on one plane. At seal, they nest.</P><BQ>The tetrahedron volunteers. The sphere mediates. The cube holds.</BQ><BQ>No cube means drift. No sphere means puncture. No tetrahedron means bureaucracy.</BQ><P>A receipt marks successful passage from declaration to contact.</P><BQ>The move is not to push harder. Rotate slightly until one face comes into alignment.</BQ></Sec>

        <Sec id="pre-seal-audit" num="13" title="Pre-Seal Audit" {...sp}><BQ>The audit exists to stop false closure.</BQ><P>Do not seal because the story is elegant. Do not seal because the room agrees.</P><P style={{marginTop:"1.3rem"}}><strong>Mirror checks</strong> <span style={{color:"#8A877F",fontSize:"0.82rem"}}>(same shape, both directions)</span></P><T h={["Relation","Question"]} r={[[<span style={{color:"#B84C2A"}}>△↔△</span>,"Is this aim actually mine, or am I carrying someone else's?"],[<span style={{color:"#2A5A6B"}}>▢↔▢</span>,"Does my evidence cohere, or am I holding contradictory receipts?"],[<span style={{color:"#6B5A2A"}}>○↔○</span>,"Am I telling a story about my story instead of living in it?"]]}/><P style={{marginTop:"1.3rem"}}><strong>Crossing checks</strong> <span style={{color:"#8A877F",fontSize:"0.82rem"}}>(shape meets shape)</span></P><T h={["Relation","Question"]} r={[[<><S t="t">△</S>→<S t="s">▢</S></>,"Does my aim survive contact with the evidence?"],[<><S t="s">▢</S>→<S t="t">△</S></>,"Is the evidence asking me to change direction?"],[<><S t="t">△</S>→<S t="c">○</S></>,"Is my story serving my aim or replacing it?"],[<><S t="c">○</S>→<S t="t">△</S></>,"Is what I call my aim actually just a narrative?"],[<><S t="s">▢</S>→<S t="c">○</S></>,"Do the receipts match the story I'm telling?"],[<><S t="c">○</S>→<S t="s">▢</S></>,"Does my story survive the evidence, or do I flinch?"]]}/><P style={{marginTop:"1.3rem"}}>The matrix is a photograph. The sequence is a film.</P><T h={["Sequence","Name","Healthy form","Pathology"]} r={[[<><S t="t">△</S>→<S t="s">▢</S>→<S t="c">○</S></>,"Builder","Story follows proof.","Meaning starvation — builds without knowing why."],[<><S t="t">△</S>→<S t="c">○</S>→<S t="s">▢</S></>,"Visionary","Inspiration before grounding.","Story hardens before test."],[<><S t="s">▢</S>→<S t="t">△</S>→<S t="c">○</S></>,"Strategist","Grounded, constrained direction.","Aim shrinks to fit the square."],[<><S t="s">▢</S>→<S t="c">○</S>→<S t="t">△</S></>,"Rationalizer","Maturity from experience.","Aim reverse-engineered from story."],[<><S t="c">○</S>→<S t="t">△</S>→<S t="s">▢</S></>,"Dreamer","Generative vision. Founders live here.","Dream hardens into identity before reality arrives."],[<><S t="c">○</S>→<S t="s">▢</S>→<S t="t">△</S></>,"Survivor","Disillusionment produces leanest aims.","Narrative collapse without reconstruction."]]}/><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.72rem",fontStyle:"italic",color:"#8A877F",marginTop:12,paddingTop:8,borderTop:"1px solid #E8E4DC"}}>Builder note: this is the section Box7 should eventually automate. The audit is where the product meets the philosophy.</div></Sec>

        <Sec id="body-signet" num="14" title="The Body and the Signet" {...sp} ph={<PH n="III" t="Instruments and Open Edges"/>}><BQ>The first three channels read the world. The fourth reads the self.</BQ><P>Inference is weightless. Interpretation has mass. The body carries consequence memory. A machine can compute complexity — it did not bear it.</P><BQ>The body is signal, not oracle.</BQ><P>Three somatic signals the protocol recognizes:</P><P>The <strong style={{color:"#B84C2A"}}>shake</strong> — the aim is real and costly to hold.</P><P>The <strong style={{color:"#B84C2A"}}>gut drop</strong> — misalignment before the mind names it.</P><P>The <strong style={{color:"#B84C2A"}}>flinch</strong> — the story can't survive the evidence.</P><P>A declaration that doesn't land in the body is rhetoric. A declaration that shakes you is real.</P><P>The fourth channel is downstream of the Circle until the Circle is audited. A nervous system trained by a false story will read truth as threat. Run the pre-seal audit before trusting the somatic read.</P><BQ>The fourth channel votes. It does not decide.</BQ><P>The Signet is not a wellness device. It is an instrument for the fourth channel.</P><P>The Signet is the cylinder seal — the oldest identity instrument in civilization — updated with the one capability the Sumerians could not capture: the body's honest state at seal-time. The cylinder seal proved <em>who</em>. The Signet captures <em>who</em> and <em>how they were</em> when they sealed. Five thousand years. Same function. New channel.</P><P>Outward: reads somatic state → <strong>go</strong> (honest) · <strong>pause</strong> (something's off) · <strong>attend</strong> (high assembly index — the declaration is real and costly).</P><P>Inward: tactile anchor to sealed configurations. The ring is the physical receipt of a prior seal.</P></Sec>

        <Sec id="settlement" num="15" title="Settlement Logic" {...sp}><P>An invoice asks the world to answer. A receipt shows that it did.</P><P>Coherence is not enough because coherence can be generated inside a closed loop. A sharp sentence is still a claim until the world remits.</P><BQ>Coherence is a paid invoice.</BQ><P>Unpaid coherence is elegant drift. Counterfeit settlement is fake closure. Validated settlement requires outside contact, witness, or registry.</P><P>Coherence is a candidate state. Settlement makes it real.</P><P>Coherence is cheap. Contact is expensive and therefore trustworthy.</P><P>Unpaid invoice — a claim without external answer.</P><P>Counterfeit receipt — a false sign of closure.</P><P>Self-sealing loop — a system that treats internal coherence as settlement.</P><BQ><strong>The operator sentence test:</strong> <span style={{fontWeight:400}}>a strong operator sentence should help produce a condition that another witness, with no incentive to agree, can observe.</span></BQ></Sec>

        <Sec id="four-instruments" num="16" title="The Four Instruments" {...sp}><T h={["Instrument","Role","What the user experiences"]} r={[[<strong>GetReceipts</strong>,"Return signal layer. Proof that a vector touched reality. Courage infrastructure.","A receipt you can hold. The ledger that authorizes the next move."],[<strong>Box7</strong>,"Reading instrument with its own triangle. Makes aim, story, and reality visible simultaneously.","You point. The ledger activates. Position becomes visible."],[<strong>PromiseMe</strong>,"Triangle axis. Declared aim that carries consequence.","A commitment you carry. The promise that makes a direction real."],[<strong>The Signet</strong>,"Somatic authentication layer. Reads the body. Grounds the self.","A ring on your finger. Your body's honest signal, made legible."]]}/><P>PromiseMe and GetReceipts are separate instruments because they serve different functions — declaration and return. But the protocol connects them. The gap between promise and receipt is the conversation. That is by design. The oldest coordination systems kept promise and fulfillment on the same surface because they had no protocol layer underneath. Lakin does. The gap is not a hiding place. It is where the work happens.</P><P>Nobody needs to know about the seven-move space to use any of them. Use GetReceipts long enough and you start noticing patterns in your returns. Use Box7 long enough and you start feeling the shape of your own drift. Use PromiseMe long enough and you see the gap between what you declared and what reality returned. Wear the Signet long enough and you start trusting what your body already knows.</P><BQ>At some point the four start talking to each other. That is when Assembled Reality is no longer a concept. It is just what is happening.</BQ></Sec>

        <Sec id="builder-implications" num="17" title="Builder Implications" {...sp}><P>The front door is a reading instrument, not a chatbot lobby.</P><P>The core loop: arrive · read · move · return · update.</P><P>Never quietly replace interpretation with machine certainty.</P><P>The ledger is the product more than the chat is the product.</P><P>Success is not agreement for its own sake. Success is a clearer next move with a stronger return signal behind it.</P><P>You don't onboard 7 to your problem. You point.</P></Sec>

        <Sec id="open-questions" num="18" title="Open Questions" {...sp}><P style={{fontStyle:"italic",color:"#5C5A55",marginBottom:"1.4rem"}}>These are invitations, not admissions of weakness. A founding document that has no open questions has sealed without a receipt.</P>{["Where does inference end and interpretation begin in a way that can be formalized?","Can shape be modeled without collapsing the person into a belief-attribution object?","What constitutes seal readiness when three shapes, multiple witnesses, and world-return all matter?","When two tetrahedrons share one cube — two Lakins negotiating shared reality — what does the geometry look like?","Can the three-shape classification hold across users, domains, and cultures as a universal protocol?","What happens to presence-based coordination when the network outgrows mutual witness? The Anatolian village runs on imece — showing up is the receipt, everyone sees everyone, social memory is the ledger. The Sumerians invented clay tablets at the exact moment that system broke. How does the protocol preserve the gift quality of imece at Sumerian scale? How does it keep the body in the field when the field becomes a network?"].map((q,i)=><div key={i} style={{marginBottom:10,paddingLeft:12,borderLeft:"2px solid #D6D1C8"}}><P style={{marginBottom:0}}>{q}</P></div>)}{["Cost is embedded in the protocol as a byproduct of use. Whether protocol-embedded proxies are sufficient remains open.","If the game generates explicit shape data, the AI participates as a protocol vertex without needing to infer shape from language."].map((q,i)=><div key={`p${i}`} style={{marginBottom:10,paddingLeft:12,borderLeft:"2px solid #2A5A6B"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.56rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2A5A6B"}}>Partially resolved</div><P style={{fontStyle:"italic",marginBottom:0}}>{q}</P></div>)}</Sec>

        <Sec id="closing" num="19" title="Closing" {...sp}><P>Lakin is not building smoother agreement.</P><P>Lakin is building better interruption by reality.</P><P>The architecture will change. The formulas will change. Some operators will fail and should be cut.</P><P>The founding claim should remain hard to escape.</P><BQ>Coherence without contact is the universal failure mode of coordinating intelligences. The receipt is the universal defense. The human authors. The AI assists. Reality closes.</BQ><P>Everything else is assembly.</P><BQ style={{borderLeftColor:"#1A1917",fontSize:"1.06rem"}}>Reality doesn't appear. It's assembled.</BQ><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.64rem",color:"#8A877F",marginTop:"2.2rem"}}>Lakin.ai · 2026 · v1.0</div></Sec>
      </main>
    </div>
  );
}
