import { useState, useEffect, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "./firebase.js";

const DB_REF = "marche";
const defaultData = () => ({
  stores: [
    { id: "gf",  name: "Grand Frais", color: "#2d8a4e", icon: "🌿" },
    { id: "lec", name: "Leclerc",     color: "#1a5fa8", icon: "🛒" },
  ],
  items: [], notes: [],
});

const Svg = ({ d }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1em", height: "1em" }}>{d}</svg>;
const ICheck = () => <Svg d={<polyline points="20 6 9 17 4 12" strokeWidth="2.5" />} />;
const ITrash = () => <Svg d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></>} />;
const IPlus  = () => <Svg d={<><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5" /><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" /></>} />;
const IMinus = () => <Svg d={<line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" />} />;
const IEdit  = () => <Svg d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>} />;
const ILink  = () => <Svg d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>} />;
const ISync  = () => <Svg d={<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>} />;
const IX     = () => <Svg d={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />;
const INote  = () => <Svg d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>} />;
const IEye   = () => <Svg d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />;

const CATS = ["🥦 Légumes","🍎 Fruits","🥩 Viande & Volaille","🐟 Poisson & Fruits de mer","🥐 Boulangerie","🧀 Crémerie & Œufs","🫙 Épicerie salée","🍫 Épicerie sucrée","❄️ Surgelés","🧴 Hygiène & Beauté","🍷 Boissons","🧹 Entretien","💊 Santé","🌿 Autre"];
const UNITS = ["pièce(s)","kg","L","boîte(s)"];
const PRESETS = {
  "🥦 Légumes": [{n:"Poireaux",e:"🧅"},{n:"Carottes",e:"🥕"},{n:"Pommes de terre",e:"🥔"},{n:"Tomates",e:"🍅"},{n:"Courgettes",e:"🥒"},{n:"Brocolis",e:"🥦"},{n:"Épinards",e:"🌿"},{n:"Salade",e:"🥬"},{n:"Oignons",e:"🧅"},{n:"Ail",e:"🧄"},{n:"Champignons",e:"🍄"},{n:"Poivrons",e:"🫑"},{n:"Aubergines",e:"🍆"},{n:"Concombre",e:"🥒"},{n:"Céleri",e:"🌿"},{n:"Fenouil",e:"🌿"},{n:"Haricots verts",e:"🫘"},{n:"Petits pois",e:"🫛"},{n:"Maïs",e:"🌽"},{n:"Asperges",e:"🌿"},{n:"Betterave",e:"🟣"},{n:"Chou-fleur",e:"🥦"},{n:"Chou",e:"🥬"},{n:"Potiron",e:"🎃"},{n:"Patate douce",e:"🍠"},{n:"Endives",e:"🥬"}],
  "🍎 Fruits": [{n:"Pommes",e:"🍎"},{n:"Bananes",e:"🍌"},{n:"Oranges",e:"🍊"},{n:"Citrons",e:"🍋"},{n:"Fraises",e:"🍓"},{n:"Raisins",e:"🍇"},{n:"Poires",e:"🍐"},{n:"Pêches",e:"🍑"},{n:"Mangues",e:"🥭"},{n:"Ananas",e:"🍍"},{n:"Kiwis",e:"🥝"},{n:"Cerises",e:"🍒"},{n:"Myrtilles",e:"🫐"},{n:"Framboises",e:"🍓"},{n:"Melon",e:"🍈"},{n:"Pastèque",e:"🍉"},{n:"Abricots",e:"🍑"},{n:"Prunes",e:"🍑"},{n:"Noix",e:"🌰"},{n:"Amandes",e:"🌰"},{n:"Clémentines",e:"🍊"},{n:"Citron vert",e:"🍋"}],
  "🥩 Viande & Volaille": [{n:"Steaks hachés",e:"🥩"},{n:"Poulet entier",e:"🍗"},{n:"Escalopes de poulet",e:"🍗"},{n:"Cordons bleus",e:"🐓"},{n:"Cuisses de poulet",e:"🍗"},{n:"Filet de bœuf",e:"🥩"},{n:"Côtelettes d'agneau",e:"🐑"},{n:"Rôti de porc",e:"🐷"},{n:"Lardons",e:"🥓"},{n:"Jambon blanc",e:"🥩"},{n:"Saucisses",e:"🌭"},{n:"Merguez",e:"🌶️"},{n:"Chipolatas",e:"🌭"},{n:"Bacon",e:"🥓"},{n:"Veau",e:"🐮"},{n:"Canard",e:"🦆"},{n:"Dinde",e:"🦃"},{n:"Rôti de bœuf",e:"🥩"},{n:"Entrecôte",e:"🥩"},{n:"Pâté",e:"🫙"}],
  "🐟 Poisson & Fruits de mer": [{n:"Saumon",e:"🐟"},{n:"Thon",e:"🐠"},{n:"Cabillaud",e:"🐡"},{n:"Daurade",e:"🐟"},{n:"Crevettes",e:"🦐"},{n:"Moules",e:"🦪"},{n:"Coquilles St-Jacques",e:"🦪"},{n:"Lieu noir",e:"🐟"},{n:"Truite",e:"🐡"},{n:"Sardines",e:"🐟"},{n:"Anchois",e:"🐟"},{n:"Poulpe",e:"🐙"},{n:"Calamars",e:"🦑"},{n:"Huîtres",e:"🦪"},{n:"Langoustines",e:"🦐"},{n:"Crabe",e:"🦀"}],
  "🥐 Boulangerie": [{n:"Pain de mie",e:"🍞"},{n:"Baguette",e:"🥖"},{n:"Croissants",e:"🥐"},{n:"Pains au chocolat",e:"🍫"},{n:"Brioche",e:"🍞"},{n:"Pain de campagne",e:"🫓"},{n:"Pains aux raisins",e:"🥐"},{n:"Ficelle",e:"🥖"},{n:"Muffins",e:"🧁"},{n:"Pains pita",e:"🫓"},{n:"Tortillas",e:"🫓"},{n:"Biscottes",e:"🍞"}],
  "🧀 Crémerie & Œufs": [{n:"Gruyère",e:"🧀"},{n:"Beurre",e:"🧈"},{n:"Œufs",e:"🥚"},{n:"Lait",e:"🥛"},{n:"Crème fraîche",e:"🍶"},{n:"Yaourts nature",e:"🫙"},{n:"Emmental",e:"🧀"},{n:"Comté",e:"🧀"},{n:"Camembert",e:"🧀"},{n:"Mozzarella",e:"🧀"},{n:"Parmesan",e:"🧀"},{n:"Fromage blanc",e:"🫙"},{n:"Ricotta",e:"🫙"},{n:"Feta",e:"🧀"},{n:"Roquefort",e:"🧀"},{n:"Brie",e:"🧀"},{n:"Reblochon",e:"🧀"},{n:"Chèvre",e:"🐐"},{n:"Mascarpone",e:"🫙"},{n:"Lait d'avoine",e:"🌾"},{n:"Crème liquide",e:"🍶"},{n:"Faisselle",e:"🫙"}],
  "🫙 Épicerie salée": [{n:"Pâtes",e:"🍝"},{n:"Riz",e:"🍚"},{n:"Lentilles",e:"🫘"},{n:"Pois chiches",e:"🫘"},{n:"Farine",e:"🌾"},{n:"Sel",e:"🧂"},{n:"Poivre",e:"🌶️"},{n:"Huile d'olive",e:"🫒"},{n:"Huile de tournesol",e:"🌻"},{n:"Vinaigre",e:"🫙"},{n:"Moutarde",e:"🫙"},{n:"Ketchup",e:"🍅"},{n:"Mayonnaise",e:"🫙"},{n:"Sauce soja",e:"🍶"},{n:"Bouillon cube",e:"🟨"},{n:"Thon en boîte",e:"🐟"},{n:"Tomates pelées",e:"🍅"},{n:"Concentré de tomate",e:"🍅"},{n:"Haricots blancs",e:"🫘"},{n:"Cornichons",e:"🥒"},{n:"Olives",e:"🫒"},{n:"Curry",e:"🟡"},{n:"Paprika",e:"🔴"},{n:"Cumin",e:"🟤"},{n:"Herbes de Provence",e:"🌿"},{n:"Tabasco",e:"🌶️"},{n:"Semoule",e:"🌾"},{n:"Quinoa",e:"🌾"},{n:"Lasagnes",e:"🍝"},{n:"Tagliatelles",e:"🍝"},{n:"Nouilles chinoises",e:"🍜"}],
  "🍫 Épicerie sucrée": [{n:"Sucre",e:"🍬"},{n:"Chocolat noir",e:"🍫"},{n:"Chocolat au lait",e:"🍫"},{n:"Nutella",e:"🫙"},{n:"Confiture fraise",e:"🍓"},{n:"Confiture abricot",e:"🍑"},{n:"Miel",e:"🍯"},{n:"Sirop d'érable",e:"🍁"},{n:"Vanille",e:"🌿"},{n:"Levure chimique",e:"🧁"},{n:"Cacao",e:"🍫"},{n:"Céréales",e:"🌾"},{n:"Granola",e:"🥣"},{n:"Flocons d'avoine",e:"🌾"},{n:"Biscuits",e:"🍪"},{n:"Chips",e:"🥔"},{n:"Bonbons",e:"🍬"},{n:"Compote",e:"🍎"},{n:"Crèmes dessert",e:"🍮"}],
  "❄️ Surgelés": [{n:"Petits pois surgelés",e:"🫛"},{n:"Épinards surgelés",e:"🌿"},{n:"Frites",e:"🍟"},{n:"Poisson pané",e:"🐟"},{n:"Pizza surgelée",e:"🍕"},{n:"Glaces",e:"🍦"},{n:"Fruits rouges surgelés",e:"🍓"},{n:"Wok de légumes",e:"🥦"},{n:"Nuggets",e:"🍗"},{n:"Crêpes",e:"🥞"},{n:"Crevettes surgelées",e:"🦐"},{n:"Tarte surgelée",e:"🥧"}],
  "🧴 Hygiène & Beauté": [{n:"Shampooing",e:"🧴"},{n:"Après-shampooing",e:"🧴"},{n:"Gel douche",e:"🚿"},{n:"Savon",e:"🧼"},{n:"Dentifrice",e:"🦷"},{n:"Brosse à dents",e:"🪥"},{n:"Déodorant",e:"💨"},{n:"Rasoirs",e:"🪒"},{n:"Coton",e:"🌸"},{n:"Crème hydratante",e:"🧴"},{n:"Papier toilette",e:"🧻"},{n:"Mouchoirs",e:"🤧"},{n:"Lingettes",e:"🧻"}],
  "🍷 Boissons": [{n:"Eau minérale",e:"💧"},{n:"Eau gazeuse",e:"🫧"},{n:"Jus d'orange",e:"🍊"},{n:"Jus de pomme",e:"🍎"},{n:"Coca-Cola",e:"🥤"},{n:"Limonade",e:"🍋"},{n:"Bière",e:"🍺"},{n:"Vin rouge",e:"🍷"},{n:"Vin blanc",e:"🥂"},{n:"Rosé",e:"🌸"},{n:"Champagne",e:"🍾"},{n:"Café",e:"☕"},{n:"Thé",e:"🍵"},{n:"Tisane",e:"🌿"},{n:"Lait",e:"🥛"},{n:"Sirop",e:"🫙"},{n:"Smoothie",e:"🥤"},{n:"Red Bull",e:"⚡"},{n:"Jus de raisin",e:"🍇"}],
  "🧹 Entretien": [{n:"Liquide vaisselle",e:"🧴"},{n:"Lessive",e:"👕"},{n:"Adoucissant",e:"🌸"},{n:"Nettoyant sol",e:"🧹"},{n:"Nettoyant multi-surfaces",e:"🧽"},{n:"Éponges",e:"🧽"},{n:"Sacs poubelle",e:"🗑️"},{n:"Papier alu",e:"🪙"},{n:"Film plastique",e:"🌀"},{n:"Liquide WC",e:"🚽"},{n:"Désinfectant",e:"🫧"},{n:"Pastilles lave-vaisselle",e:"✨"},{n:"Rouleau papier essuie-tout",e:"🧻"},{n:"Sacs congélation",e:"🧊"}],
  "💊 Santé": [{n:"Paracétamol",e:"💊"},{n:"Ibuprofène",e:"💊"},{n:"Vitamine C",e:"🍊"},{n:"Pansements",e:"🩹"},{n:"Gel antiseptique",e:"🫙"},{n:"Thermomètre",e:"🌡️"}],
};

const ALL_PRESETS = Object.entries(PRESETS).flatMap(([cat, items]) => items.map(p => ({ ...p, cat })));
const STORE_ICONS = ["🛒","🌿","🏪","🧺","🥩","🐟","🧀","🥦","🍷","🧹","💊","🌸","🍞","🥐","🏬"];
const STORE_COLORS = ["#2d8a4e","#1a5fa8","#c8956a","#8b4a6b","#e07b3f","#5f4a38","#3a7fa8","#6a8c3a","#a84a4a","#7a5ca8"];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const isUrl = s => { try { return ["http:","https:"].includes(new URL(s).protocol); } catch { return false; } };
const domain = s => { try { return new URL(s).hostname.replace("www.",""); } catch { return s; } };

export default function App() {
  const [data, setData]             = useState(null);
  const [tab, setTab]               = useState("overview");
  const [syncing, setSyncing]       = useState(true);
  const [search, setSearch]         = useState("");
  const [itemEmoji, setItemEmoji]   = useState("🛍️");
  const [itemCat, setItemCat]       = useState(CATS[13]);
  const [itemQty, setItemQty]       = useState(1);
  const [itemUnit, setItemUnit]     = useState(UNITS[0]);
  const [showDrop, setShowDrop]     = useState(false);
  const [dropIdx, setDropIdx]       = useState(0);
  const [storePicker, setStorePicker] = useState(null); // {text, emoji, cat, qty, unit}
  const inputRef = useRef(null);
  const dropRef  = useRef(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [noteInput, setNoteInput]       = useState("");

  useEffect(() => {
    const dbRef = ref(db, DB_REF);
    const unsub = onValue(dbRef, snapshot => {
      const raw = snapshot.val();
      const d = raw || defaultData();
      if (!d.items) d.items = [];
      if (!d.notes) d.notes = [];
      if (!d.stores) d.stores = defaultData().stores;
      setData(d);
      setSyncing(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const h = e => {
      if (dropRef.current && !dropRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const mutate = fn => { const next = fn(data); setData(next); set(ref(db, DB_REF), next); };

  if (!data) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#fdf6ec",fontFamily:"Lato,sans-serif",color:"#9b7e5e",gap:"1rem"}}>
      <div style={{fontSize:"2.5rem"}}>🧺</div>
      <div style={{fontWeight:300,letterSpacing:"1px"}}>Connexion à Firebase…</div>
    </div>
  );

  const activeStore = data.stores.find(s => s.id === tab);
  const suggestions = search.trim().length > 0
    ? ALL_PRESETS.filter(p => p.n.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const selectSuggestion = p => {
    setSearch(p.n); setItemEmoji(p.e); setItemCat(p.cat);
    setShowDrop(false); inputRef.current?.focus();
  };

  const openStorePicker = () => {
    const text = search.trim();
    if (!text) return;
    const qtyLabel = !(itemQty === 1 && itemUnit === "pièce(s)") ? `${itemQty} ${itemUnit}` : "";
    setStorePicker({ text, emoji: itemEmoji, cat: itemCat, qty: qtyLabel });
  };

  const confirmAdd = (storeIds) => {
    if (!storePicker || !storeIds.length) return;
    mutate(d => ({ ...d, items: [...(d.items||[]), { id: uid(), text: storePicker.text, emoji: storePicker.emoji, qty: storePicker.qty, cat: storePicker.cat, stores: storeIds, done: {} }] }));
    setSearch(""); setItemEmoji("🛍️"); setItemCat(CATS[13]); setItemQty(1); setItemUnit(UNITS[0]);
    setStorePicker(null); setShowDrop(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKey = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setDropIdx(i => Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setDropIdx(i => Math.max(i-1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (showDrop && suggestions.length > 0) selectSuggestion(suggestions[dropIdx]); else openStorePicker(); }
    else if (e.key === "Escape") setShowDrop(false);
  };

  const toggleDone = (id, sid) => mutate(d => ({...d, items: d.items.map(i => i.id===id ? {...i, done: {...(i.done||{}), [sid]: !(i.done||{})[sid]}} : i)}));
  const deleteItem = id => mutate(d => ({...d, items: d.items.filter(i => i.id!==id)}));
  const clearDoneForStore = sid => mutate(d => ({...d, items: d.items.filter(i => !(i.stores.includes(sid) && (i.done||{})[sid]))}));
  const addStore = (name, icon, color) => { const id = uid(); mutate(d => ({...d, stores: [...d.stores, {id, name, icon, color}]})); setShowAddStore(false); };
  const updateStore = (id, patch) => mutate(d => ({...d, stores: d.stores.map(s => s.id===id ? {...s,...patch} : s)}));
  const deleteStore = id => { mutate(d => ({...d, stores: d.stores.filter(s => s.id!==id), items: d.items.map(i => ({...i, stores: i.stores.filter(s => s!==id)})).filter(i => i.stores.length>0)})); setItemStores(p => { const n={...p}; delete n[id]; return n; }); setEditingStore(null); setTab("overview"); };
  const addNote = () => { if (!noteInput.trim()) return; mutate(d => ({...d, notes: [...(d.notes||[]), {id: uid(), text: noteInput.trim(), date: new Date().toLocaleDateString("fr-FR")}]})); setNoteInput(""); };
  const deleteNote = id => mutate(d => ({...d, notes: d.notes.filter(n => n.id!==id)}));

  const qtyStep = (itemUnit === "kg" || itemUnit === "L") ? 0.5 : 1;

  return (
    <div style={{minHeight:"100vh",background:"#fdf6ec",fontFamily:"Lato,sans-serif",backgroundImage:"radial-gradient(circle at 15% 15%,#f9e8d0 0%,transparent 55%),radial-gradient(circle at 85% 85%,#e8f0e0 0%,transparent 55%)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box}
        .row{transition:.2s}.row:hover{transform:translateX(3px)}.row:hover .del{opacity:1!important}
        .del{opacity:0;transition:.15s;cursor:pointer}
        .tbtn{transition:.15s;cursor:pointer;border:none;font-family:inherit;white-space:nowrap}.tbtn:hover{opacity:.8}
        .ghost{border:none;background:transparent;cursor:pointer;font-family:inherit;transition:.15s}.ghost:hover{opacity:.65}
        .chk{transition:.18s;cursor:pointer}.chk:hover{transform:scale(1.1)}
        .inp{border:none;background:transparent;outline:none;font-family:Lato,sans-serif;color:#3d2b1f}
        .inp::placeholder{color:#c4ad97}
        .note-card:hover .del{opacity:1!important}
        .stog{transition:.2s;cursor:pointer;user-select:none}.stog:hover{opacity:.85}
        .sug{cursor:pointer;transition:.12s;border-radius:10px}.sug:hover,.sug.act{background:#f5ede3}
        .qbtn{border:none;cursor:pointer;transition:.15s;display:flex;align-items:center;justify-content:center}.qbtn:hover{opacity:.8}.qbtn:active{transform:scale(.93)}
        .abtn{border:none;cursor:pointer;transition:.18s;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:Lato}.abtn:hover{filter:brightness(1.08)}.abtn:active{transform:scale(.96)}
        .ubtn{border:none;cursor:pointer;transition:.15s;font-family:Lato}.ubtn:hover{opacity:.8}
        @keyframes up{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
        .up{animation:up .2s ease both}
        @keyframes fd{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .fd{animation:fd .15s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite;display:inline-flex}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:100;display:flex;align-items:center;justify-content:center;padding:1rem}
        .modal{background:#fdf6ec;border-radius:20px;padding:1.8rem;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:90vh;overflow-y:auto}
        a{color:#2d8a4e;text-decoration:none}a:hover{text-decoration:underline}
        input[type=color]{border:none;background:none;width:28px;height:28px;cursor:pointer;border-radius:50%;padding:0}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        ::-webkit-scrollbar{height:4px;width:4px}::-webkit-scrollbar-thumb{background:#e0d0c0;border-radius:4px}
      `}</style>

      {/* HEADER */}
      <div style={{background:"white",borderBottom:"1px solid #ede0ce",position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 12px rgba(90,60,30,.06)"}}>
        <div style={{maxWidth:660,margin:"0 auto",padding:"1rem 1.2rem .65rem"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".65rem"}}>
            <div>
              <div style={{fontSize:".55rem",letterSpacing:"3.5px",color:"#b8a090",textTransform:"uppercase",marginBottom:".1rem"}}>Liste partagée</div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.5rem",fontWeight:600,color:"#3d2b1f",margin:0,lineHeight:1}}><em>Le Marché</em></h1>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
              {syncing && <span className="spin" style={{color:"#b8a090",fontSize:".9rem"}}><ISync/></span>}
              <span style={{fontSize:".64rem",color:syncing?"#c8956a":"#7dbf8a",fontWeight:700}}>{syncing?"Sync…":"● En direct"}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:".35rem",overflowX:"auto",paddingBottom:".1rem"}}>
            <button className="tbtn" onClick={() => setTab("overview")} style={{background:tab==="overview"?"#3d2b1f":"#f5ede3",color:tab==="overview"?"white":"#7a5c40",borderRadius:20,padding:".3rem .85rem",fontSize:".78rem",fontWeight:tab==="overview"?700:400,boxShadow:tab==="overview"?"0 3px 10px rgba(61,43,31,.28)":"none"}}><IEye/> Vue d'ensemble</button>
            {data.stores.map(s => (
              <button key={s.id} className="tbtn" onClick={() => setTab(s.id)} style={{background:tab===s.id?s.color:"#f5ede3",color:tab===s.id?"white":"#7a5c40",borderRadius:20,padding:".3rem .85rem",fontSize:".78rem",fontWeight:tab===s.id?700:400,boxShadow:tab===s.id?`0 3px 10px ${s.color}55`:"none"}}>{s.icon} {s.name}</button>
            ))}
            <button className="tbtn" onClick={() => setShowAddStore(true)} style={{background:"#f5ede3",color:"#b8a090",borderRadius:20,padding:".3rem .72rem",fontSize:".78rem"}}>+ Magasin</button>
            <button className="tbtn" onClick={() => setTab("notes")} style={{background:tab==="notes"?"#5f4a38":"#f5ede3",color:tab==="notes"?"white":"#7a5c40",borderRadius:20,padding:".3rem .85rem",fontSize:".78rem",marginLeft:"auto",fontWeight:tab==="notes"?700:400}}><INote/> Notes</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:660,margin:"0 auto",padding:"1.4rem 1.2rem 6rem"}}>

        {/* ADD FORM */}
        {tab !== "notes" && (
          <div className="up" style={{background:"white",borderRadius:22,border:"1px solid #ede0ce",boxShadow:"0 6px 28px rgba(90,60,30,.10)",marginBottom:"1.6rem",overflow:"visible",position:"relative"}}>

            {/* Smart search */}
            <div style={{padding:"1.1rem 1.2rem .9rem",borderBottom:"1px solid #f5ede3",position:"relative"}}>
              <div style={{fontSize:".55rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".55rem",fontWeight:700}}>Ajouter un article</div>
              <div style={{display:"flex",alignItems:"center",gap:".7rem",background:"#f8f2ea",borderRadius:14,padding:".72rem 1rem",border:`2px solid ${search.trim()?"#c8956a":"transparent"}`,transition:".2s"}}>
                <span style={{fontSize:"1.3rem",flexShrink:0,transition:".2s"}}>{itemEmoji}</span>
                <input ref={inputRef} className="inp"
                  placeholder="Tomates, bière, papier toilette, Red Bull…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setItemEmoji("🛍️"); setItemCat(CATS[13]); setShowDrop(true); setDropIdx(0); }}
                  onFocus={() => { if (search.trim()) setShowDrop(true); }}
                  onKeyDown={handleKey}
                  style={{flex:1,fontSize:"1rem",background:"transparent",fontWeight:400}}
                />
                {search && <button className="ghost" onClick={() => { setSearch(""); setItemEmoji("🛍️"); setShowDrop(false); inputRef.current?.focus(); }} style={{color:"#b8a090",fontSize:".9rem",flexShrink:0}}><IX/></button>}
              </div>

              {/* Dropdown */}
              {showDrop && suggestions.length > 0 && (
                <div ref={dropRef} className="fd" style={{position:"absolute",left:"1.2rem",right:"1.2rem",top:"calc(100% - .3rem)",background:"white",borderRadius:14,border:"1px solid #ede0ce",boxShadow:"0 8px 32px rgba(90,60,30,.14)",zIndex:50,overflow:"hidden"}}>
                  {suggestions.map((p, i) => (
                    <div key={p.n} className={`sug${i===dropIdx?" act":""}`}
                      onMouseDown={e => { e.preventDefault(); selectSuggestion(p); }}
                      style={{display:"flex",alignItems:"center",gap:".75rem",padding:".48rem .9rem"}}>
                      <span style={{fontSize:"1.2rem",flexShrink:0}}>{p.e}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:".92rem",color:"#3d2b1f",fontWeight:500}}>{p.n}</div>
                        <div style={{fontSize:".68rem",color:"#b8a090",marginTop:".02rem"}}>{p.cat}</div>
                      </div>
                    </div>
                  ))}
                  {search.trim() && (
                    <div className="sug" onMouseDown={e => { e.preventDefault(); setShowDrop(false); inputRef.current?.focus(); }}
                      style={{display:"flex",alignItems:"center",gap:".75rem",padding:".58rem 1rem",borderTop:"1px solid #f5ede3"}}>
                      <span style={{fontSize:"1.1rem"}}>➕</span>
                      <div style={{fontSize:".85rem",color:"#7a5c40"}}>Ajouter <strong>"{search.trim()}"</strong> tel quel</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div style={{padding:".85rem 1.2rem",borderBottom:"1px solid #f5ede3"}}>
              <div style={{fontSize:".55rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".55rem",fontWeight:700}}>Quantité</div>
              <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:".5rem",background:"#f8f2ea",borderRadius:12,padding:".35rem .55rem"}}>
                  <button className="qbtn" onClick={() => setItemQty(q => Math.max(qtyStep, +(q - qtyStep).toFixed(1)))}
                    style={{width:34,height:34,background:"white",boxShadow:"0 1px 5px rgba(0,0,0,.1)",color:"#3d2b1f",borderRadius:9,fontSize:".95rem"}}>
                    <IMinus/>
                  </button>
                  <span style={{minWidth:36,textAlign:"center",fontWeight:700,fontSize:"1.1rem",color:"#3d2b1f"}}>{itemQty}</span>
                  <button className="qbtn" onClick={() => setItemQty(q => +(q + qtyStep).toFixed(1))}
                    style={{width:34,height:34,background:"#3d2b1f",color:"white",boxShadow:"0 2px 8px rgba(61,43,31,.3)",borderRadius:9,fontSize:".95rem"}}>
                    <IPlus/>
                  </button>
                </div>
                <div style={{display:"flex",gap:".28rem",flexWrap:"wrap"}}>
                  {UNITS.map(u => (
                    <button key={u} className="ubtn" onClick={() => { setItemUnit(u); if (u==="kg"||u==="L") setItemQty(q => q < 0.5 ? 0.5 : q); }}
                      style={{background:itemUnit===u?"#3d2b1f":"#f5ede3",color:itemUnit===u?"white":"#7a5c40",borderRadius:20,padding:".25rem .72rem",fontSize:".8rem",fontWeight:itemUnit===u?700:400}}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add button */}
            <div style={{padding:".75rem 1.2rem 1rem",display:"flex",justifyContent:"flex-end"}}>
              <button className="abtn" onClick={openStorePicker} disabled={!search.trim()}
                style={{background:search.trim()?"linear-gradient(135deg,#2d8a4e,#1e6b3a)":"#e0d0c0",color:search.trim()?"white":"#b8a090",padding:".68rem 1.6rem",fontSize:".95rem",gap:".45rem",borderRadius:14,boxShadow:search.trim()?"0 4px 14px rgba(45,138,78,.35)":"none",transition:".2s"}}>
                <IPlus/> Ajouter
              </button>
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {tab==="overview" && (
          <div className="up">
            <div style={{display:"flex",alignItems:"center",gap:".55rem",marginBottom:"1.1rem"}}>
              <span style={{fontSize:"1.2rem"}}>👀</span>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:600,color:"#3d2b1f"}}>Vue d'ensemble</div>
                <div style={{fontSize:".68rem",color:"#b8a090",fontWeight:300}}>Tous vos magasins réunis</div>
              </div>
            </div>
            {data.stores.map(store => {
              const its = data.items.filter(i => i.stores.includes(store.id));
              const done = its.filter(i => (i.done||{})[store.id]).length;
              if (!its.length) return null;
              return (
                <div key={store.id} style={{marginBottom:"2rem"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".6rem"}}>
                    <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
                      <div style={{background:store.color,borderRadius:10,padding:".2rem .7rem",color:"white",fontSize:".78rem",fontWeight:700}}>{store.icon} {store.name}</div>
                      <span style={{fontSize:".68rem",color:"#b8a090"}}>{done}/{its.length}</span>
                    </div>
                    <button onClick={() => setTab(store.id)} className="ghost" style={{fontSize:".68rem",color:"#b8a090",border:"1px solid #e5d5c0",borderRadius:10,padding:".2rem .55rem"}}>Voir →</button>
                  </div>
                  <div style={{height:2,background:"#ede0ce",borderRadius:2,marginBottom:".65rem"}}>
                    <div style={{height:"100%",background:store.color,borderRadius:2,width:`${its.length?done/its.length*100:0}%`,transition:"width .5s"}}/>
                  </div>
                  {CATS.filter(c => its.some(i => i.cat===c && !((i.done||{})[store.id]))).map(c => (
                    <div key={c} style={{marginBottom:".5rem"}}>
                      <div style={{fontSize:".58rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".28rem",paddingLeft:".2rem"}}>{c}</div>
                      {its.filter(i => i.cat===c && !((i.done||{})[store.id])).map(item => <ItemRow key={item.id} item={item} storeId={store.id} storeColor={store.color} onToggle={toggleDone} onDelete={deleteItem}/>)}
                    </div>
                  ))}
                  {its.some(i => (i.done||{})[store.id]) && (
                    <div style={{marginTop:".6rem",paddingTop:".6rem",borderTop:"1px dashed #e0d0c0"}}>
                      <div style={{fontSize:".58rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".28rem",paddingLeft:".2rem"}}>🛒 Dans le chariot</div>
                      {its.filter(i => (i.done||{})[store.id]).map(item => <ItemRow key={item.id} item={item} storeId={store.id} storeColor={store.color} onToggle={toggleDone} onDelete={deleteItem}/>)}
                    </div>
                  )}
                </div>
              );
            })}
            {!data.items.length && <div style={{textAlign:"center",padding:"3rem 1rem",color:"#c4ad97",fontStyle:"italic",fontWeight:300}}>Ajoutez vos premiers articles ci-dessus…</div>}
          </div>
        )}

        {/* STORE VIEW */}
        {activeStore && (() => {
          const its = data.items.filter(i => i.stores.includes(activeStore.id));
          const done = its.filter(i => (i.done||{})[activeStore.id]).length;
          return (
            <div className="up">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".95rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:".55rem"}}>
                  <span style={{fontSize:"1.25rem"}}>{activeStore.icon}</span>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:600,color:"#3d2b1f"}}>{activeStore.name}</div>
                    <div style={{fontSize:".68rem",color:"#b8a090",fontWeight:300}}>{its.length} article{its.length!==1?"s":""} · {done} acheté{done!==1?"s":""}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:".4rem"}}>
                  {done>0&&<button className="ghost" onClick={() => clearDoneForStore(activeStore.id)} style={{fontSize:".68rem",color:"#b8a090",border:"1px solid #e5d5c0",borderRadius:10,padding:".22rem .55rem"}}>Vider achetés</button>}
                  <button className="ghost" onClick={() => setEditingStore(activeStore)} style={{color:"#b8a090",border:"1px solid #e5d5c0",borderRadius:10,padding:".22rem .5rem",fontSize:".9rem"}}><IEdit/></button>
                </div>
              </div>
              {its.length>0&&<div style={{height:3,background:"#ede0ce",borderRadius:2,marginBottom:"1.1rem"}}><div style={{height:"100%",background:activeStore.color,borderRadius:2,width:`${done/its.length*100}%`,transition:"width .5s"}}/></div>}
              {CATS.filter(c => its.some(i => i.cat===c && !((i.done||{})[activeStore.id]))).map(c => (
                <div key={c} style={{marginBottom:".5rem"}}>
                  <div style={{fontSize:".58rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".28rem",paddingLeft:".2rem"}}>{c}</div>
                  {its.filter(i => i.cat===c && !((i.done||{})[activeStore.id])).map(item => <ItemRow key={item.id} item={item} storeId={activeStore.id} storeColor={activeStore.color} onToggle={toggleDone} onDelete={deleteItem}/>)}
                </div>
              ))}
              {its.some(i => (i.done||{})[activeStore.id]) && (
                <div style={{marginTop:".7rem",paddingTop:".7rem",borderTop:"1px dashed #e0d0c0"}}>
                  <div style={{fontSize:".58rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".28rem",paddingLeft:".2rem"}}>🛒 Dans le chariot</div>
                  {its.filter(i => (i.done||{})[activeStore.id]).map(item => <ItemRow key={item.id} item={item} storeId={activeStore.id} storeColor={activeStore.color} onToggle={toggleDone} onDelete={deleteItem}/>)}
                </div>
              )}
              {!its.length&&<div style={{textAlign:"center",padding:"3rem",color:"#c4ad97",fontStyle:"italic",fontWeight:300}}>Aucun article pour {activeStore.name}…</div>}
            </div>
          );
        })()}

        {/* NOTES */}
        {tab==="notes" && (
          <div className="up">
            <div style={{display:"flex",alignItems:"center",gap:".55rem",marginBottom:".75rem"}}>
              <span style={{fontSize:"1.2rem"}}>📝</span>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:600,color:"#3d2b1f"}}>Bloc-notes</div>
                <div style={{fontSize:".68rem",color:"#b8a090",fontWeight:300}}>Recettes, liens, idées…</div>
              </div>
            </div>
            <div style={{background:"white",borderRadius:16,border:"1px solid #ede0ce",boxShadow:"0 3px 18px rgba(90,60,30,.08)",marginBottom:"1.2rem",overflow:"hidden"}}>
              <textarea placeholder="Colle un lien de recette, une idée, une liste…" value={noteInput} onChange={e => setNoteInput(e.target.value)} rows={4} style={{border:"none",outline:"none",width:"100%",resize:"none",fontFamily:"Lato,sans-serif",fontSize:".91rem",color:"#3d2b1f",padding:"1rem 1.2rem",background:"transparent",fontWeight:300,lineHeight:1.6}}/>
              <div style={{display:"flex",justifyContent:"flex-end",padding:".45rem 1rem",borderTop:"1px solid #f5ede3"}}>
                <button onClick={addNote} style={{background:"#5f4a38",color:"white",border:"none",borderRadius:10,padding:".38rem .95rem",fontSize:".78rem",cursor:"pointer",fontFamily:"Lato",fontWeight:700}}>Ajouter</button>
              </div>
            </div>
            {!data.notes.length&&<div style={{textAlign:"center",padding:"3rem",color:"#c4ad97",fontStyle:"italic",fontWeight:300}}>Aucune note…</div>}
            {[...data.notes].reverse().map(note => {
              const url = isUrl(note.text);
              return (
                <div key={note.id} className="note-card" style={{background:"white",borderRadius:14,border:"1px solid #ede0ce",padding:".9rem 1.2rem",marginBottom:".58rem",boxShadow:"0 2px 10px rgba(90,60,30,.06)",display:"flex",gap:".72rem",alignItems:"flex-start"}}>
                  <div style={{fontSize:"1rem",flexShrink:0,marginTop:".1rem",color:url?"#2d8a4e":"#c8956a"}}>{url?<ILink/>:"📌"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    {url?(<><a href={note.text} target="_blank" rel="noopener noreferrer" style={{fontWeight:700,fontSize:".9rem",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{domain(note.text)}</a><div style={{fontSize:".68rem",color:"#b8a090",marginTop:".1rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:300}}>{note.text}</div></>):(<div style={{color:"#3d2b1f",fontWeight:300,fontSize:".9rem",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{note.text}</div>)}
                    <div style={{fontSize:".6rem",color:"#c4ad97",marginTop:".3rem"}}>{note.date}</div>
                  </div>
                  <span className="del" onClick={() => deleteNote(note.id)} style={{color:"#d4a89a",fontSize:".9rem"}}><ITrash/></span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddStore && <StoreModal title="Nouveau magasin" onSave={addStore} onClose={() => setShowAddStore(false)}/>}
      {editingStore && <StoreModal title="Modifier le magasin" initial={editingStore} onSave={(n,i,c)=>{updateStore(editingStore.id,{name:n,icon:i,color:c});setEditingStore(null);}} onDelete={()=>deleteStore(editingStore.id)} onClose={()=>setEditingStore(null)}/>}

      {/* STORE PICKER POPUP */}
      {storePicker && (
        <div className="overlay" onClick={() => setStorePicker(null)}>
          <div className="modal up" onClick={e => e.stopPropagation()} style={{maxWidth:340,padding:"1.6rem"}}>
            <div style={{textAlign:"center",marginBottom:"1.2rem"}}>
              <div style={{fontSize:"2.2rem",marginBottom:".3rem"}}>{storePicker.emoji}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:600,color:"#3d2b1f"}}>{storePicker.text}</div>
              {storePicker.qty && <div style={{fontSize:".78rem",color:"#b8a090",marginTop:".2rem"}}>{storePicker.qty}</div>}
              <div style={{fontSize:".78rem",color:"#b8a090",marginTop:".5rem",fontWeight:300}}>Où voulez-vous l'acheter ?</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
              {data.stores.map(s => (
                <button key={s.id} onClick={() => confirmAdd([s.id])}
                  style={{background:s.color,color:"white",border:"none",borderRadius:14,padding:".85rem",fontSize:"1rem",fontWeight:700,cursor:"pointer",fontFamily:"Lato",boxShadow:`0 4px 14px ${s.color}55`,transition:".15s",display:"flex",alignItems:"center",justifyContent:"center",gap:".5rem"}}>
                  {s.icon} {s.name}
                </button>
              ))}
              {data.stores.length >= 2 && (
                <button onClick={() => confirmAdd(data.stores.map(s => s.id))}
                  style={{background:"#3d2b1f",color:"white",border:"none",borderRadius:14,padding:".85rem",fontSize:".95rem",fontWeight:700,cursor:"pointer",fontFamily:"Lato",boxShadow:"0 4px 14px rgba(61,43,31,.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:".5rem"}}>
                  🛒 Les deux magasins
                </button>
              )}
              <button onClick={() => setStorePicker(null)} className="ghost"
                style={{color:"#b8a090",fontSize:".85rem",marginTop:".2rem"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, storeId, storeColor, onToggle, onDelete }) {
  const done = !!(item.done||{})[storeId];
  return (
    <div className="row" style={{display:"flex",alignItems:"center",gap:".65rem",background:done?"transparent":"white",borderRadius:13,padding:".22rem .75rem",marginBottom:".1rem",boxShadow:done?"none":"0 1px 6px rgba(90,60,30,.06)",border:done?"none":"1px solid #ede0ce",opacity:done?.45:1,transition:"all .2s"}}>
      <div className="chk" onClick={() => onToggle(item.id, storeId)} style={{width:22,height:22,borderRadius:6,flexShrink:0,border:done?"none":`2px solid ${storeColor}88`,background:done?storeColor:"transparent",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",transition:".18s"}}>{done&&<ICheck/>}</div>
      {item.emoji && item.emoji !== "🛍️" && <span style={{fontSize:"1.15rem",flexShrink:0,filter:done?"grayscale(1)":"none",transition:".2s"}}>{item.emoji}</span>}
      <span style={{flex:1,color:"#3d2b1f",fontWeight:300,textDecoration:done?"line-through":"none",fontStyle:done?"italic":"normal",fontSize:".92rem"}}>{item.text}</span>
      {item.qty && <span style={{fontSize:".72rem",background:done?"transparent":"#f8f2ea",color:done?"#c4ad97":storeColor,border:`1px solid ${done?"#e8ddd0":storeColor+"44"}`,borderRadius:8,padding:".1rem .42rem",whiteSpace:"nowrap",flexShrink:0,fontWeight:done?300:700}}>{item.qty}</span>}
      {item.stores&&item.stores.length>1&&<span style={{fontSize:".6rem",color:"#b8a090",border:"1px solid #e5d5c0",borderRadius:8,padding:".08rem .36rem",whiteSpace:"nowrap",flexShrink:0}}>×{item.stores.length}</span>}
      <span className="del" onClick={() => onDelete(item.id)} style={{color:"#d4a89a",fontSize:".9rem"}}><ITrash/></span>
    </div>
  );
}

function StoreModal({ title, initial, onSave, onDelete, onClose }) {
  const [name, setName]   = useState(initial?.name  ?? "");
  const [icon, setIcon]   = useState(initial?.icon  ?? "🛒");
  const [color, setColor] = useState(initial?.color ?? "#2d8a4e");
  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="modal up">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".75rem"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.12rem",color:"#3d2b1f",margin:0}}>{title}</h2>
          <button className="ghost" onClick={onClose} style={{fontSize:"1rem",color:"#b8a090"}}><IX/></button>
        </div>
        <div style={{marginBottom:".75rem"}}>
          <div style={{fontSize:".57rem",letterSpacing:"2px",textTransform:"uppercase",color:"#b8a090",marginBottom:".35rem"}}>Nom</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Biocoop, Aldi…" style={{width:"100%",border:"1px solid #ede0ce",borderRadius:10,padding:".6rem 1rem",fontFamily:"Lato",fontSize:".91rem",color:"#3d2b1f",outline:"none",background:"white"}}/>
        </div>
        <div style={{marginBottom:".75rem"}}>
          <div style={{fontSize:".57rem",letterSpacing:"2px",textTransform:"uppercase",color:"#b8a090",marginBottom:".35rem"}}>Icône</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".28rem"}}>
            {STORE_ICONS.map(e => <button key={e} onClick={()=>setIcon(e)} style={{background:icon===e?"#3d2b1f":"#f5ede3",border:"none",borderRadius:9,width:33,height:33,fontSize:"1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>)}
          </div>
        </div>
        <div style={{marginBottom:"1rem"}}>
          <div style={{fontSize:".57rem",letterSpacing:"2px",textTransform:"uppercase",color:"#b8a090",marginBottom:".35rem"}}>Couleur</div>
          <div style={{display:"flex",gap:".3rem",flexWrap:"wrap",alignItems:"center"}}>
            {STORE_COLORS.map(c => <button key={c} onClick={()=>setColor(c)} style={{width:24,height:24,borderRadius:"50%",background:c,border:color===c?"3px solid #3d2b1f":"2px solid transparent",cursor:"pointer"}}/>)}
            <input type="color" value={color} onChange={e => setColor(e.target.value)}/>
          </div>
        </div>
        <div style={{background:"#f5ede3",borderRadius:11,padding:".52rem .88rem",marginBottom:".95rem",display:"flex",alignItems:"center",gap:".45rem"}}>
          <span style={{background:color,color:"white",borderRadius:20,padding:".2rem .78rem",fontSize:".78rem",fontWeight:700}}>{icon} {name||"Mon magasin"}</span>
          <span style={{fontSize:".68rem",color:"#b8a090"}}>Aperçu</span>
        </div>
        <div style={{display:"flex",gap:".42rem"}}>
          {onDelete&&<button onClick={onDelete} style={{background:"#fde8e8",color:"#b04040",border:"1px solid #f5c0c0",borderRadius:12,padding:".55rem .9rem",fontFamily:"Lato",fontSize:".78rem",cursor:"pointer",fontWeight:700}}>Supprimer</button>}
          <button onClick={()=>name.trim()&&onSave(name.trim(),icon,color)} style={{flex:1,background:"#3d2b1f",color:"white",border:"none",borderRadius:12,padding:".55rem 1rem",fontFamily:"Lato",fontSize:".84rem",cursor:"pointer",fontWeight:700}}>{initial?"Enregistrer":"Ajouter"}</button>
        </div>
      </div>
    </div>
  );
}
