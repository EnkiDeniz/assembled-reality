import { useState, useEffect } from "react";
import { PASSPHRASE } from "../../constants";

export default function PassGate({ onPass }) {
  const [inp, setInp] = useState("");
  const [wrong, setWrong] = useState(false);
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);
  const check = () => {
    if (inp.trim().toLowerCase() === PASSPHRASE) onPass();
    else { setWrong(true); setTimeout(() => setWrong(false), 1200); }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F4EF", opacity: vis ? 1 : 0, transition: "opacity 0.8s" }}>
      <div style={{ width: "100%", maxWidth: 480, padding: "2rem 1.2rem", textAlign: "center" }}>
        <input autoFocus value={inp} onChange={e => { setInp(e.target.value); setWrong(false); }} onKeyDown={e => e.key === "Enter" && check()} spellCheck={false}
          style={{
            width: "100%", padding: "16px 0", fontSize: "1.3rem",
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            background: "transparent", border: "none",
            borderBottom: `1px solid ${wrong ? "#B84C2A" : "#D6D1C8"}`,
            outline: "none", textAlign: "center",
            color: wrong ? "#B84C2A" : "#1A1917",
            transition: "all 0.3s",
          }} />
        <div style={{ marginTop: 16, fontSize: "0.7rem", fontFamily: "'DM Sans',sans-serif", color: "#B84C2A", opacity: wrong ? 1 : 0, transition: "opacity 0.3s", height: 20 }}>{wrong ? "Not yet." : ""}</div>
      </div>
    </div>
  );
}
