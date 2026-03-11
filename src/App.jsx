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

const CATS = [
  "🥦 Légumes","🍎 Fruits","🥩 Viande","🍗 Volaille & Charcuterie",
  "🐟 Poisson","🥫 Conserves Poisson","🦐 Fruits de mer",
  "🥐 Boulangerie","🥐 Viennoiseries",
  "🧀 Fromages","🥚 Crémerie",
  "🍝 Pâtes & Riz","🫘 Légumineuses","🫙 Conserves & Bocaux",
  "🧂 Épices & Condiments","🫒 Huiles & Vinaigres","🥄 Sauces & Pâtes",
  "🍫 Sucrerie & Chocolat","🫙 Pâtes à tartiner & Confitures",
  "🥣 Céréales & Petit-déjeuner","🍪 Biscuits & Snacks","🍰 Pâtisserie & Desserts",
  "❄️ Surgelés",
  "💧 Eaux & Jus","☕ Boissons chaudes","🍷 Alcools & Vins",
  "🧴 Hygiène","🧻 Hygiène paper & protections","🧹 Entretien",
  "💊 Santé & Pharmacie","🐾 Animaux",
  "🛍️ Autre"
];
const UNITS = ["pièce(s)","kg","L","boîte(s)"];
const PRESETS = {
  "🥦 Légumes": [
    {n:"Poireaux",e:"🥬"},{n:"Carottes",e:"🥕"},{n:"Pommes de terre",e:"🥔"},
    {n:"Tomates",e:"🍅"},{n:"Courgettes",e:"🥒"},{n:"Brocolis",e:"🥦"},
    {n:"Épinards",e:"🥬"},{n:"Salade verte",e:"🥬"},{n:"Roquette",e:"🥬"},
    {n:"Oignons",e:"🧅"},{n:"Ail",e:"🧄"},{n:"Échalotes",e:"🧅"},
    {n:"Champignons de Paris",e:"🍄"},{n:"Champignons",e:"🍄‍🟫"},
    {n:"Poivrons",e:"🫑"},{n:"Aubergines",e:"🍆"},{n:"Concombre",e:"🥒"},
    {n:"Céleri",e:"🌿"},{n:"Fenouil",e:"🌿"},{n:"Haricots verts",e:"🫘"},
    {n:"Petits pois",e:"🫛"},{n:"Maïs",e:"🌽"},{n:"Asperges",e:"🌱"},
    {n:"Betterave",e:"🫜"},{n:"Chou-fleur",e:"🥦"},{n:"Chou",e:"🥬"},
    {n:"Chou rouge",e:"🥬"},{n:"Potiron",e:"🎃"},{n:"Butternut",e:"🎃"},
    {n:"Patate douce",e:"🍠"},{n:"Endives",e:"🥬"},{n:"Radis",e:"🌸"},
    {n:"Navet",e:"🫜"},{n:"Artichaut",e:"🌿"},{n:"Avocat",e:"🥑"},
    {n:"Gingembre",e:"🫚"},{n:"Piment",e:"🌶️"},
  ],
  "🍎 Fruits": [
    {n:"Pommes",e:"🍎"},{n:"Pommes vertes",e:"🍏"},{n:"Poires",e:"🍐"},
    {n:"Bananes",e:"🍌"},{n:"Oranges",e:"🍊"},{n:"Clémentines",e:"🍊"},
    {n:"Citrons",e:"🍋"},{n:"Citrons verts",e:"🍋‍🟩"},{n:"Fraises",e:"🍓"},
    {n:"Framboises",e:"🍓"},{n:"Cerises",e:"🍒"},{n:"Myrtilles",e:"🫐"},
    {n:"Raisins",e:"🍇"},{n:"Pêches",e:"🍑"},{n:"Abricots",e:"🍑"},
    {n:"Prunes",e:"🍑"},{n:"Mangues",e:"🥭"},{n:"Ananas",e:"🍍"},
    {n:"Kiwis",e:"🥝"},{n:"Melon",e:"🍈"},{n:"Pastèque",e:"🍉"},
    {n:"Noix de coco",e:"🥥"},{n:"Noix",e:"🌰"},{n:"Amandes",e:"🥜"},
    {n:"Noisettes",e:"🌰"},{n:"Cacahuètes",e:"🥜"},{n:"Olives",e:"🫒"},
  ],
  "🥩 Viande": [
    {n:"Steaks hachés",e:"🥩"},{n:"Filet de bœuf",e:"🥩"},{n:"Entrecôte",e:"🥩"},
    {n:"Rôti de bœuf",e:"🥩"},{n:"Veau",e:"🥩"},{n:"Côtelettes d'agneau",e:"🥩"},
    {n:"Gigot d'agneau",e:"🥩"},{n:"Rôti de porc",e:"🥩"},{n:"Côtes de porc",e:"🥩"},
  ],
  "🍗 Volaille & Charcuterie": [
    {n:"Poulet entier",e:"🍗"},{n:"Escalopes de poulet",e:"🍗"},
    {n:"Cuisses de poulet",e:"🍗"},{n:"Cordons bleus",e:"🍗"},
    {n:"Canard",e:"🦆"},{n:"Dinde",e:"🦃"},{n:"Lardons",e:"🥓"},
    {n:"Bacon",e:"🥓"},{n:"Jambon blanc",e:"🍖"},{n:"Jambon de Bayonne",e:"🍖"},
    {n:"Saucisses",e:"🌭"},{n:"Chipolatas",e:"🌭"},{n:"Merguez",e:"🌶️"},
    {n:"Pâté",e:"🥫"},{n:"Rillettes",e:"🥫"},
  ],
  "🐟 Poisson": [
    {n:"Saumon frais",e:"🐟"},{n:"Saumon fumé",e:"🍣"},
    {n:"Cabillaud",e:"🐟"},{n:"Lieu noir",e:"🐟"},
    {n:"Daurade",e:"🐡"},{n:"Truite",e:"🐡"},{n:"Thon frais",e:"🐠"},
    {n:"Sardines fraîches",e:"🐠"},{n:"Filets de poisson",e:"🐟"},
  ],
  "🥫 Conserves Poisson": [
    {n:"Thon en boîte",e:"🥫"},{n:"Sardines en boîte",e:"🥫"},
    {n:"Maquereaux en boîte",e:"🥫"},{n:"Saumon en boîte",e:"🥫"},
    {n:"Anchois en boîte",e:"🥫"},
  ],
  "🦐 Fruits de mer": [
    {n:"Crevettes",e:"🦐"},{n:"Moules",e:"🦪"},{n:"Huîtres",e:"🦪"},
    {n:"Coquilles St-Jacques",e:"🐚"},{n:"Langoustines",e:"🦞"},
    {n:"Homard",e:"🦞"},{n:"Crabe",e:"🦀"},
    {n:"Poulpe",e:"🐙"},{n:"Calamars",e:"🦑"},
  ],
  "🥐 Boulangerie": [
    {n:"Pain de mie",e:"🍞"},{n:"Baguette",e:"🥖"},{n:"Pain de campagne",e:"🫓"},
    {n:"Pain complet",e:"🍞"},{n:"Ficelle",e:"🥖"},{n:"Pain aux céréales",e:"🫓"},
    {n:"Pains pita",e:"🫓"},{n:"Tortillas",e:"🫓"},{n:"Bagel",e:"🥯"},
    {n:"Bretzel",e:"🥨"},{n:"Biscottes",e:"🍘"},{n:"Galette",e:"🫓"},
  ],
  "🥐 Viennoiseries": [
    {n:"Croissants",e:"🥐"},{n:"Pains au chocolat",e:"🥐"},
    {n:"Brioches",e:"🥐"},{n:"Pains aux raisins",e:"🥐"},
    {n:"Muffins anglais",e:"🧁"},{n:"Gaufres",e:"🧇"},
  ],
  "🧀 Fromages": [
    {n:"Gruyère",e:"🧀"},{n:"Emmental",e:"🧀"},{n:"Comté",e:"🧀"},
    {n:"Camembert",e:"🧀"},{n:"Brie",e:"🧀"},{n:"Roquefort",e:"🧀"},
    {n:"Reblochon",e:"🧀"},{n:"Chèvre",e:"🧀"},{n:"Feta",e:"🧀"},
    {n:"Mozzarella",e:"🧀"},{n:"Parmesan",e:"🧀"},{n:"Ricotta",e:"🧀"},
    {n:"Mascarpone",e:"🧀"},{n:"Boursin",e:"🧀"},
  ],
  "🥚 Crémerie": [
    {n:"Œufs",e:"🥚"},{n:"Beurre",e:"🧈"},
    {n:"Lait entier",e:"🥛"},{n:"Lait demi-écrémé",e:"🥛"},
    {n:"Lait d'avoine",e:"🥛"},{n:"Lait d'amande",e:"🥛"},
    {n:"Crème fraîche",e:"🫗"},{n:"Crème liquide",e:"🫗"},
    {n:"Yaourts nature",e:"🥣"},{n:"Yaourts fruités",e:"🥣"},
    {n:"Fromage blanc",e:"🥣"},{n:"Faisselle",e:"🥣"},
  ],
  "🍝 Pâtes & Riz": [
    {n:"Pâtes",e:"🍝"},{n:"Spaghettis",e:"🍝"},{n:"Tagliatelles",e:"🍝"},
    {n:"Lasagnes",e:"🍝"},{n:"Penne",e:"🍝"},{n:"Nouilles chinoises",e:"🍜"},
    {n:"Riz basmati",e:"🍚"},{n:"Riz rond",e:"🍚"},{n:"Riz complet",e:"🍚"},
    {n:"Semoule",e:"🌾"},{n:"Quinoa",e:"🌾"},{n:"Boulgour",e:"🌾"},
    {n:"Farine",e:"🌾"},{n:"Fécule de maïs",e:"🌽"},
  ],
  "🫘 Légumineuses": [
    {n:"Lentilles vertes",e:"🫘"},{n:"Lentilles corail",e:"🫘"},
    {n:"Pois chiches",e:"🫘"},{n:"Haricots blancs",e:"🫘"},
    {n:"Haricots rouges",e:"🫘"},{n:"Pois cassés",e:"🫘"},
  ],
  "🫙 Conserves & Bocaux": [
    {n:"Tomates pelées",e:"🥫"},{n:"Tomates concassées",e:"🥫"},
    {n:"Concentré de tomate",e:"🍅"},{n:"Maïs en boîte",e:"🥫"},
    {n:"Olives en bocal",e:"🫒"},{n:"Cornichons",e:"🥒"},
    {n:"Câpres",e:"🫙"},{n:"Artichauts en bocal",e:"🫙"},
  ],
  "🧂 Épices & Condiments": [
    {n:"Sel",e:"🧂"},{n:"Poivre noir",e:"🫙"},{n:"Poivre blanc",e:"🫙"},
    {n:"Curry",e:"🍛"},{n:"Paprika",e:"🌶️"},{n:"Cumin",e:"🌿"},
    {n:"Curcuma",e:"🌿"},{n:"Coriandre",e:"🌿"},{n:"Herbes de Provence",e:"🌿"},
    {n:"Thym",e:"🌿"},{n:"Romarin",e:"🌿"},{n:"Basilic",e:"🌿"},
    {n:"Laurier",e:"🌿"},{n:"Cannelle",e:"🌿"},{n:"Vanille",e:"🌿"},
    {n:"Noix de muscade",e:"🌰"},{n:"Tabasco",e:"🌶️"},{n:"Piment d'Espelette",e:"🌶️"},
    {n:"Ras-el-hanout",e:"🌿"},
  ],
  "🫒 Huiles & Vinaigres": [
    {n:"Huile d'olive",e:"🫒"},{n:"Huile de tournesol",e:"🌻"},
    {n:"Huile de colza",e:"🌿"},{n:"Vinaigre blanc",e:"🍾"},
    {n:"Vinaigre balsamique",e:"🍾"},{n:"Vinaigre de cidre",e:"🍾"},
  ],
  "🥄 Sauces & Pâtes": [
    {n:"Moutarde",e:"🫙"},{n:"Ketchup",e:"🍅"},{n:"Mayonnaise",e:"🫙"},
    {n:"Sauce soja",e:"🍶"},{n:"Sauce Worcestershire",e:"🫙"},
    {n:"Sauce tomate",e:"🍅"},{n:"Coulis de tomate",e:"🍅"},
    {n:"Bouillon cube",e:"🫙"},{n:"Fond de veau",e:"🫙"},
    {n:"Miso",e:"🫙"},{n:"Tahini",e:"🫙"},{n:"Pesto",e:"🫙"},
    {n:"Harissa",e:"🌶️"},{n:"Sauce Béchamel",e:"🫗"},
  ],
  "🍫 Sucrerie & Chocolat": [
    {n:"Sucre en poudre",e:"🫙"},{n:"Sucre roux",e:"🫙"},{n:"Sucre glace",e:"🫙"},
    {n:"Miel",e:"🍯"},{n:"Sirop d'érable",e:"🍁"},{n:"Sirop d'agave",e:"🫙"},
    {n:"Chocolat noir",e:"🍫"},{n:"Chocolat au lait",e:"🍫"},{n:"Chocolat blanc",e:"🍫"},
    {n:"Cacao en poudre",e:"🍫"},{n:"Caramel",e:"🍮"},
  ],
  "🫙 Pâtes à tartiner & Confitures": [
    {n:"Nutella",e:"🫙"},{n:"Pâte à tartiner",e:"🫙"},
    {n:"Confiture fraise",e:"🍓"},{n:"Confiture framboise",e:"🍓"},
    {n:"Confiture abricot",e:"🍑"},{n:"Confiture orange",e:"🍊"},
    {n:"Marmelade",e:"🍊"},{n:"Gelée de groseille",e:"🍓"},
  ],
  "🥣 Céréales & Petit-déjeuner": [
    {n:"Céréales",e:"🥣"},{n:"Granola",e:"🥣"},{n:"Muesli",e:"🥣"},
    {n:"Flocons d'avoine",e:"🥣"},{n:"Porridge",e:"🥣"},
  ],
  "🍪 Biscuits & Snacks": [
    {n:"Biscuits",e:"🍪"},{n:"Sablés",e:"🍪"},{n:"Galettes",e:"🍪"},
    {n:"Chips",e:"🥔"},{n:"Bonbons",e:"🍬"},{n:"Chewing-gum",e:"🍬"},
    {n:"Compote",e:"🍎"},{n:"Crèmes dessert",e:"🍮"},
    {n:"Barre céréales",e:"🌾"},{n:"Popcorn",e:"🍿"},
  ],
  "🍰 Pâtisserie & Desserts": [
    {n:"Levure chimique",e:"🫙"},{n:"Levure boulangère",e:"🫙"},
    {n:"Gélatine",e:"🫙"},{n:"Pépites de chocolat",e:"🍫"},
    {n:"Pâte feuilletée",e:"🥐"},{n:"Pâte brisée",e:"🥐"},
    {n:"Pâte à crêpes",e:"🥞"},{n:"Crêpes",e:"🥞"},
  ],
  "❄️ Surgelés": [
    {n:"Frites surgelées",e:"🍟"},{n:"Petits pois surgelés",e:"🫛"},
    {n:"Épinards surgelés",e:"🥬"},{n:"Mélange légumes",e:"🥦"},
    {n:"Poisson pané",e:"🐟"},{n:"Nuggets",e:"🍗"},
    {n:"Pizza surgelée",e:"🍕"},{n:"Lasagnes surgelées",e:"🍝"},
    {n:"Glaces",e:"🍦"},{n:"Crème glacée",e:"🍨"},
    {n:"Fruits rouges surgelés",e:"🍓"},{n:"Tarte surgelée",e:"🥧"},
    {n:"Crêpes surgelées",e:"🥞"},{n:"Crevettes surgelées",e:"🦐"},
  ],
  "💧 Eaux & Jus": [
    {n:"Eau minérale",e:"💧"},{n:"Eau gazeuse",e:"🫧"},
    {n:"Jus d'orange",e:"🧃"},{n:"Jus de pomme",e:"🧃"},
    {n:"Jus de raisin",e:"🍇"},{n:"Jus de tomate",e:"🍅"},
    {n:"Sirop grenadine",e:"🧃"},{n:"Sirop menthe",e:"🧃"},
    {n:"Limonade",e:"🥤"},{n:"Coca-Cola",e:"🥤"},
    {n:"Red Bull",e:"⚡"},{n:"Smoothie",e:"🥤"},
  ],
  "☕ Boissons chaudes": [
    {n:"Café",e:"☕"},{n:"Café moulu",e:"☕"},{n:"Café en grains",e:"☕"},
    {n:"Capsules café",e:"☕"},{n:"Thé noir",e:"🍵"},{n:"Thé vert",e:"🍵"},
    {n:"Thé blanc",e:"🍵"},{n:"Tisane",e:"🫖"},
    {n:"Infusion camomille",e:"🌼"},{n:"Chocolat chaud",e:"☕"},
  ],
  "🍷 Alcools & Vins": [
    {n:"Vin rouge",e:"🍷"},{n:"Vin blanc",e:"🥂"},{n:"Vin rosé",e:"🍷"},
    {n:"Champagne",e:"🍾"},{n:"Prosecco",e:"🥂"},{n:"Bière",e:"🍺"},
    {n:"Bière craft",e:"🍺"},{n:"Cidre",e:"🍺"},{n:"Whisky",e:"🥃"},
    {n:"Rhum",e:"🥃"},{n:"Vodka",e:"🥃"},{n:"Gin",e:"🥃"},
    {n:"Pastis",e:"🥃"},{n:"Porto",e:"🍷"},
  ],
  "🧴 Hygiène": [
    {n:"Shampooing",e:"🧴"},{n:"Après-shampooing",e:"🧴"},{n:"Gel douche",e:"🚿"},
    {n:"Savon",e:"🧼"},{n:"Dentifrice",e:"🦷"},{n:"Brosse à dents",e:"🪥"},
    {n:"Fil dentaire",e:"🪥"},{n:"Bain de bouche",e:"🫧"},{n:"Déodorant",e:"🧴"},
    {n:"Rasoirs",e:"🪒"},{n:"Mousse à raser",e:"🫧"},{n:"Crème hydratante",e:"🧴"},
    {n:"Crème solaire",e:"☀️"},{n:"Coton-tiges",e:"🌼"},
  ],
  "🧻 Hygiène paper & protections": [
    {n:"Papier toilette",e:"🧻"},{n:"Mouchoirs",e:"🤧"},
    {n:"Lingettes bébé",e:"🧻"},{n:"Serviettes hygiéniques",e:"🌸"},
    {n:"Tampons",e:"🌸"},{n:"Couches",e:"🍼"},
  ],
  "🧹 Entretien": [
    {n:"Liquide vaisselle",e:"🫧"},{n:"Pastilles lave-vaisselle",e:"✨"},
    {n:"Lessive",e:"🧺"},{n:"Adoucissant",e:"🧺"},{n:"Détachant",e:"🧺"},
    {n:"Nettoyant sol",e:"🧹"},{n:"Nettoyant salle de bain",e:"🚿"},
    {n:"Nettoyant multi-surfaces",e:"🧽"},{n:"Éponges",e:"🧽"},
    {n:"Liquide WC",e:"🚽"},{n:"Désinfectant",e:"🧴"},
    {n:"Sacs poubelle",e:"🗑️"},{n:"Rouleau essuie-tout",e:"🧻"},
    {n:"Papier alu",e:"🪨"},{n:"Film plastique",e:"🌀"},
    {n:"Papier cuisson",e:"🧻"},{n:"Sacs congélation",e:"🧊"},
  ],
  "💊 Santé & Pharmacie": [
    {n:"Paracétamol",e:"💊"},{n:"Ibuprofène",e:"💊"},{n:"Doliprane",e:"💊"},
    {n:"Vitamine C",e:"🍊"},{n:"Vitamine D",e:"☀️"},{n:"Magnésium",e:"💊"},
    {n:"Pansements",e:"🩹"},{n:"Gel antiseptique",e:"🧴"},{n:"Thermomètre",e:"🌡️"},
    {n:"Sérum physiologique",e:"💧"},
  ],
  "🐾 Animaux": [
    {n:"Croquettes chat",e:"🐱"},{n:"Pâtée chat",e:"🐱"},{n:"Litière",e:"🐱"},
    {n:"Friandises chat",e:"🐾"},{n:"Croquettes chien",e:"🐶"},{n:"Pâtée chien",e:"🐶"},
  ],
  "🛍️ Autre": [
    {n:"M2R",e:"📝"},
    {n:"Crayon rouge",e:"🖍"},
    {n:"Crayon bleu",e:"✏️"},
    {n:"Stylo bleu",e:"🖊"},
    {n:"Cahier",e:"📓"},
    {n:"Carnet",e:"📔"},
    {n:"Bloc-notes",e:"🗒"},
    {n:"Feutres",e:"🖍"},
    {n:"Crayons de couleur",e:"🖍"},
    {n:"Marqueurs",e:"🖊"},
    {n:"Post-it",e:"📒"}
  ],
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
  const [itemCat, setItemCat]       = useState(CATS[CATS.length - 1]);
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
    inputRef.current?.blur();
    setTimeout(() => setStorePicker({ text, emoji: itemEmoji, cat: itemCat, qty: qtyLabel }), 120);
  };

  const confirmAdd = (storeIds) => {
    if (!storePicker || !storeIds.length) return;
    mutate(d => ({ ...d, items: [...(d.items||[]), { id: uid(), text: storePicker.text, emoji: storePicker.emoji, qty: storePicker.qty, cat: storePicker.cat, stores: storeIds, done: {} }] }));
    setSearch(""); setItemEmoji("🛍️"); setItemCat(CATS[CATS.length - 1]); setItemQty(1); setItemUnit(UNITS[0]);
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

  const qtyStep = itemUnit === "g" ? 50 : 1;

  return (
    <div style={{minHeight:"100vh",background:"#fdf6ec",fontFamily:"Lato,sans-serif",backgroundImage:"radial-gradient(circle at 15% 15%,#f9e8d0 0%,transparent 55%),radial-gradient(circle at 85% 85%,#e8f0e0 0%,transparent 55%)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box}
        .row{transition:.2s}.row:hover{transform:translateX(2px)}.row:hover .del{opacity:1!important}
        .del{opacity:.25;transition:.15s;cursor:pointer}
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
          <div className="up" style={{background:"white",borderRadius:22,border:"1px solid #ede0ce",boxShadow:"0 6px 28px rgba(90,60,30,.10)",marginBottom:"1.6rem",overflow:"visible",position:"relative",zIndex:10}}>

            {/* Smart search */}
            <div style={{padding:"1.1rem 1.2rem .9rem",borderBottom:"1px solid #f5ede3",position:"relative"}}>
              <div style={{fontSize:".55rem",letterSpacing:"2.5px",textTransform:"uppercase",color:"#b8a090",marginBottom:".55rem",fontWeight:700}}>Ajouter un article</div>
              <div style={{display:"flex",alignItems:"center",gap:".7rem",background:"#f8f2ea",borderRadius:14,padding:".72rem 1rem",border:`2px solid ${search.trim()?"#c8956a":"transparent"}`,transition:".2s"}}>
                <span style={{fontSize:"1.3rem",flexShrink:0,transition:".2s"}}>{itemEmoji}</span>
                <input ref={inputRef} className="inp"
                  placeholder="Tomates, bière, papier toilette, Red Bull…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setItemEmoji("🛍️"); setItemCat(CATS[CATS.length - 1]); setShowDrop(true); setDropIdx(0); }}
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

            {/* Quantity + Add — une seule ligne */}
            <div style={{padding:".65rem 1.1rem .8rem",display:"flex",alignItems:"center",gap:".45rem",flexWrap:"wrap"}}>
              {/* − qty + */}
              <div style={{display:"flex",alignItems:"center",gap:".28rem",background:"#f8f2ea",borderRadius:10,padding:".22rem .38rem",flexShrink:0}}>
                <button className="qbtn" onClick={() => setItemQty(q => Math.max(qtyStep, q - qtyStep))}
                  style={{width:28,height:28,background:"white",boxShadow:"0 1px 4px rgba(0,0,0,.1)",color:"#3d2b1f",borderRadius:7,fontSize:".85rem"}}>
                  <IMinus/>
                </button>
                <span style={{minWidth:26,textAlign:"center",fontWeight:700,fontSize:".95rem",color:"#3d2b1f"}}>{itemQty}</span>
                <button className="qbtn" onClick={() => setItemQty(q => q + qtyStep)}
                  style={{width:28,height:28,background:"#3d2b1f",color:"white",boxShadow:"0 2px 6px rgba(61,43,31,.3)",borderRadius:7,fontSize:".85rem"}}>
                  <IPlus/>
                </button>
              </div>
              {/* Unités principales */}
              {UNITS.map(u => (
                <button
                  key={u}
                  className="ubtn"
                  onClick={() => {
                    setItemUnit(u);
                    // Toujours des nombres entiers pour pièces, kg, L, boîtes
                    setItemQty(q => (q < 1 ? 1 : Math.round(q)));
                  }}
                  style={{
                    background: itemUnit === u ? "#3d2b1f" : "#f5ede3",
                    color: itemUnit === u ? "white" : "#7a5c40",
                    borderRadius: 20,
                    padding: ".2rem .55rem",
                    fontSize: ".75rem",
                    fontWeight: itemUnit === u ? 700 : 400,
                    flex: "none",
                  }}
                >
                  {u}
                </button>
              ))}
              {/* Bouton grammes */}
              <button
                className="ubtn"
                onClick={() => {
                  setItemUnit("g");
                  setItemQty(q => (q < 50 ? 100 : q)); // démarre à 100 g si trop bas
                }}
                style={{
                  background: itemUnit === "g" ? "#3d2b1f" : "#f5ede3",
                  color: itemUnit === "g" ? "white" : "#7a5c40",
                  borderRadius: 20,
                  padding: ".2rem .55rem",
                  fontSize: ".75rem",
                  fontWeight: itemUnit === "g" ? 700 : 400,
                  flex: "none",
                }}
              >
                g
              </button>
              {/* Raccourcis pour les grammes */}
              {itemUnit === "g" && (
                <div style={{ display: "flex", gap: ".25rem", flexWrap: "wrap" }}>
                  {[100, 250, 500, 1000].map(v => (
                    <button
                      key={v}
                      className="ubtn"
                      onClick={() => setItemQty(v)}
                      style={{
                        background: itemQty === v ? "#3d2b1f" : "#f5ede3",
                        color: itemQty === v ? "white" : "#7a5c40",
                        borderRadius: 20,
                        padding: ".18rem .55rem",
                        fontSize: ".72rem",
                        fontWeight: itemQty === v ? 700 : 400,
                        flex: "none",
                      }}
                    >
                      {v === 1000 ? "1 kg" : `${v} g`}
                    </button>
                  ))}
                </div>
              )}
              <div style={{flex:1}}/>
              {/* Ajouter */}
              <button className="abtn" onClick={openStorePicker} disabled={!search.trim()}
                style={{background:search.trim()?"linear-gradient(135deg,#2d8a4e,#1e6b3a)":"#e0d0c0",color:search.trim()?"white":"#b8a090",padding:".55rem 1.1rem",fontSize:".88rem",gap:".35rem",borderRadius:12,boxShadow:search.trim()?"0 4px 12px rgba(45,138,78,.35)":"none",transition:".2s",flexShrink:0}}>
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
