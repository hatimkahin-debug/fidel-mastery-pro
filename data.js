// data.js — the full Amharic Fidel dataset for Fidel Mastery Pro.
// Each row = one consonant family with its 7 vowel-order forms.
//   base   : romanized consonant root, used to build the fallback phonetic
//   type   : study category — "standard" | "lookalike" | "arabic"
//            ("arabic" flags sounds that map closely onto a distinct Arabic
//            letter — useful if you already read Arabic and are leaning on
//            that for pronunciation, e.g. ቀ~ق, ሐ~ح, ጠ~ط, ጸ~ص)
//   words  : one real example word per exact vowel-order form, or null
//            where I don't have a confidently-known common word for that
//            exact syllable (shown honestly in the UI rather than guessed).
const VOWEL_ORDER = ["1st","2nd","3rd","4th","5th","6th","7th"];
const PHON_SUFFIX = ["ä","u","i","a","ē","ə","o"];   // for the order-strip labels
const TTS_SUFFIX  = ["uh","oo","ee","ah","ay","ih","oh"]; // for the device-voice fallback only

const FIDEL_ROWS = [
  { chars:["ሀ","ሁ","ሂ","ሃ","ሄ","ህ","ሆ"], base:"h", name:"Hä", type:"arabic", words:[
    {aw:"ሀገር",ph:"hagär",en:"country"},{aw:"ሁለት",ph:"hulet",en:"two"},
    {aw:"ሂሳብ",ph:"hisab",en:"math / bill"},{aw:"ሃሳብ",ph:"hasab",en:"idea"},
    {aw:"ሄደ",ph:"hede",en:"he went"},{aw:"ህይወት",ph:"hiywet",en:"life"},
    {aw:"ሆድ",ph:"hod",en:"stomach"} ] },
  { chars:["ለ","ሉ","ሊ","ላ","ሌ","ል","ሎ"], base:"l", name:"Lä", type:"standard", words:[
    {aw:"ለምን",ph:"lemin",en:"why"},{aw:"ሉሲ",ph:"Lusi",en:"Lucy (fossil found in Ethiopia)"},
    {aw:"ሊጥ",ph:"lit",en:"dough"},{aw:"ላም",ph:"lam",en:"cow"},
    {aw:"ሌባ",ph:"leba",en:"thief"},{aw:"ልጅ",ph:"lij",en:"child"},
    {aw:"ሎሚ",ph:"lomi",en:"lemon / orange"} ] },
  { chars:["ሐ","ሑ","ሒ","ሓ","ሔ","ሕ","ሖ"], base:"h", name:"Ḥä", type:"arabic", words:[
    {aw:"ሐምሌ",ph:"hamle",en:"July (month)"},{aw:"ትሑት",ph:"tihut",en:"humble"},
    null, null, null,
    {aw:"ሕግ",ph:"hig",en:"law"}, null ] },
  { chars:["መ","ሙ","ሚ","ማ","ሜ","ም","ሞ"], base:"m", name:"Mä", type:"standard", words:[
    {aw:"መጽሐፍ",ph:"metsihaf",en:"book"},{aw:"ሙዚቃ",ph:"muzika",en:"music"},
    {aw:"ሚስት",ph:"mist",en:"wife"},{aw:"ማር",ph:"mar",en:"honey"},
    {aw:"ሜዳ",ph:"meda",en:"field"},{aw:"ምግብ",ph:"migib",en:"food"},
    {aw:"ሞት",ph:"mot",en:"death"} ] },
  { chars:["ሠ","ሡ","ሢ","ሣ","ሤ","ሥ","ሦ"], base:"s", name:"Śä", type:"lookalike", words:[
    {aw:"ሠራ",ph:"sera",en:"he worked"}, null, null,
    {aw:"ሣር",ph:"sar",en:"grass"}, null,
    {aw:"ሥራ",ph:"sira",en:"work"}, null ] },
  { chars:["ረ","ሩ","ሪ","ራ","ሬ","ር","ሮ"], base:"r", name:"Rä", type:"standard", words:[
    {aw:"ረዥም",ph:"rezhim",en:"tall / long"},{aw:"ሩዝ",ph:"ruz",en:"rice"},
    {aw:"ሪፖርት",ph:"report",en:"report"},{aw:"ራስ",ph:"ras",en:"head"},
    {aw:"ገበሬ",ph:"gebäré",en:"farmer"},{aw:"ርዝመት",ph:"rizmet",en:"length"},
    {aw:"ሮጠ",ph:"rot'e",en:"he ran"} ] },
  { chars:["ሰ","ሱ","ሲ","ሳ","ሴ","ስ","ሶ"], base:"s", name:"Sä", type:"lookalike", words:[
    {aw:"ሰላም",ph:"selam",en:"peace / hello"},{aw:"ሱቅ",ph:"suq",en:"shop"},
    {aw:"ሲኒማ",ph:"sinema",en:"cinema"},{aw:"ሳምንት",ph:"samint",en:"week"},
    {aw:"ሴት",ph:"set",en:"woman"},{aw:"ስም",ph:"sim",en:"name"},
    {aw:"ሶስት",ph:"sost",en:"three"} ] },
  { chars:["ሸ","ሹ","ሺ","ሻ","ሼ","ሽ","ሾ"], base:"sh", name:"Shä", type:"lookalike", words:[
    {aw:"ሸማ",ph:"shema",en:"woven cloth"},{aw:"ሹራብ",ph:"shurab",en:"sweater"},
    {aw:"ሺህ",ph:"shih",en:"thousand"},{aw:"ሻይ",ph:"shai",en:"tea"},
    null, {aw:"ሽንኩርት",ph:"shinkurt",en:"onion"},
    {aw:"ሾላ",ph:"shola",en:"sycamore fig tree"} ] },
  { chars:["ቀ","ቁ","ቂ","ቃ","ቄ","ቅ","ቆ"], base:"q", name:"Qä", type:"arabic", words:[
    {aw:"ቀን",ph:"qän",en:"day"},{aw:"ቁጥር",ph:"qutir",en:"number"},
    {aw:"ቂም",ph:"qim",en:"grudge"},{aw:"ቃል",ph:"qal",en:"word / promise"},
    {aw:"ቄስ",ph:"qes",en:"priest"},{aw:"ቅጠል",ph:"qit'el",en:"leaf"},
    {aw:"ቆዳ",ph:"qoda",en:"skin / leather"} ] },
  { chars:["በ","ቡ","ቢ","ባ","ቤ","ብ","ቦ"], base:"b", name:"Bä", type:"lookalike", words:[
    {aw:"በር",ph:"bär",en:"door"},{aw:"ቡና",ph:"buna",en:"coffee"},
    {aw:"ቢራ",ph:"bira",en:"beer"},{aw:"ባህር",ph:"bahir",en:"sea"},
    {aw:"ቤት",ph:"bet",en:"house"},{aw:"ብር",ph:"bir",en:"Ethiopian currency"},
    {aw:"ቦታ",ph:"bota",en:"place"} ] },
  { chars:["ተ","ቱ","ቲ","ታ","ቴ","ት","ቶ"], base:"t", name:"Tä", type:"lookalike", words:[
    {aw:"ተማሪ",ph:"temari",en:"student"},{aw:"ቱሪስት",ph:"turist",en:"tourist"},
    {aw:"ቲማቲም",ph:"timatim",en:"tomato"},{aw:"ታሪክ",ph:"tarik",en:"history"},
    {aw:"ቴሌቪዥን",ph:"televizhin",en:"television"},{aw:"ትምህርት",ph:"timhirt",en:"education"},
    {aw:"ቶሎ",ph:"tolo",en:"quickly"} ] },
  { chars:["ቸ","ቹ","ቺ","ቻ","ቼ","ች","ቾ"], base:"ch", name:"Chä", type:"lookalike", words:[
    {aw:"ቸርነት",ph:"chernet",en:"kindness"}, null, null,
    {aw:"ቻይና",ph:"China",en:"China"},{aw:"ቼክ",ph:"chek",en:"cheque"},
    {aw:"ችግር",ph:"chiggir",en:"problem"}, null ] },
  { chars:["ኀ","ኁ","ኂ","ኃ","ኄ","ኅ","ኆ"], base:"h", name:"Ḫä", type:"arabic", words:[
    null, null, null,
    {aw:"ኃይል",ph:"hayl",en:"power / strength"}, null,
    {aw:"ኅሊና",ph:"hilina",en:"conscience"}, null ] },
  { chars:["ነ","ኑ","ኒ","ና","ኔ","ን","ኖ"], base:"n", name:"Nä", type:"standard", words:[
    {aw:"ነገ",ph:"nege",en:"tomorrow"},{aw:"ኑሮ",ph:"nuro",en:"life / livelihood"},
    null, {aw:"ና",ph:"na",en:"come! (command)"}, null,
    {aw:"ንጉሥ",ph:"nigus",en:"king"},{aw:"ኖረ",ph:"nore",en:"he lived"} ] },
  { chars:["ኘ","ኙ","ኚ","ኛ","ኜ","ኝ","ኞ"], base:"ny", name:"Nyä", type:"standard", words:[
    null, null, null,
    {aw:"ተኛ",ph:"tegna",en:"lie down / sleep"}, null, null, null ] },
  { chars:["አ","ኡ","ኢ","ኣ","ኤ","እ","ኦ"], base:"", name:"Ä", type:"arabic", words:[
    {aw:"አበባ",ph:"abeba",en:"flower"},{aw:"ኡደት",ph:"udet",en:"cycle / orbit"},
    {aw:"ኢትዮጵያ",ph:"Ityop'ya",en:"Ethiopia"}, null,
    {aw:"ኤርትራ",ph:"Eritira",en:"Eritrea"},{aw:"እኔ",ph:"ine",en:"I / me"},
    {aw:"ኦሮሚያ",ph:"Oromiya",en:"Oromia (region)"} ] },
  { chars:["ከ","ኩ","ኪ","ካ","ኬ","ክ","ኮ"], base:"k", name:"Kä", type:"standard", words:[
    {aw:"ከተማ",ph:"ketema",en:"city"},{aw:"ኩባያ",ph:"kubaya",en:"cup"},
    {aw:"ኪስ",ph:"kis",en:"pocket"},{aw:"ካርታ",ph:"karta",en:"map"},
    {aw:"ኬክ",ph:"kek",en:"cake"},{aw:"ክብር",ph:"kibir",en:"honor"},
    {aw:"ኮረብታ",ph:"korebta",en:"hill"} ] },
  { chars:["ኸ","ኹ","ኺ","ኻ","ኼ","ኽ","ኾ"], base:"k", name:"Khä", type:"arabic", words:[
    null,null,null,null,null,null,null ] },
  { chars:["ወ","ዉ","ዊ","ዋ","ዌ","ው","ዎ"], base:"w", name:"Wä", type:"standard", words:[
    {aw:"ወንድም",ph:"wändim",en:"brother"}, null,
    {aw:"ኪዊ",ph:"kiwi",en:"kiwi (fruit)"},{aw:"ዋና",ph:"wana",en:"main / swimming"},
    null, {aw:"ውሃ",ph:"wiha",en:"water"}, null ] },
  { chars:["ዐ","ዑ","ዒ","ዓ","ዔ","ዕ","ዖ"], base:"", name:"ʿÄ", type:"arabic", words:[
    null, null, null,
    {aw:"ዓመት",ph:"amet",en:"year"}, null,
    {aw:"ዕቃ",ph:"iqa",en:"item / goods"}, null ] },
  { chars:["ዘ","ዙ","ዚ","ዛ","ዜ","ዝ","ዞ"], base:"z", name:"Zä", type:"standard", words:[
    {aw:"ዘመድ",ph:"zämäd",en:"relative"},{aw:"ዙሪያ",ph:"zuriya",en:"surroundings"},
    {aw:"ዚምባብዌ",ph:"Zimbabwe",en:"Zimbabwe"},{aw:"ዛፍ",ph:"zaf",en:"tree"},
    {aw:"ዜና",ph:"zena",en:"news"},{aw:"ዝናብ",ph:"zinab",en:"rain"},
    {aw:"ዞረ",ph:"zore",en:"he turned around"} ] },
  { chars:["ዠ","ዡ","ዢ","ዣ","ዤ","ዥ","ዦ"], base:"zh", name:"Zhä", type:"standard", words:[
    null,null,null,null,null,null,null ] },
  { chars:["የ","ዩ","ዪ","ያ","ዬ","ይ","ዮ"], base:"y", name:"Yä", type:"standard", words:[
    {aw:"የካቲት",ph:"yekatit",en:"February (month)"},{aw:"ዩኒቨርሲቲ",ph:"university",en:"university"},
    null, {aw:"ገበያ",ph:"gebeya",en:"market"}, null,
    {aw:"ይቅርታ",ph:"yiqirta",en:"sorry / excuse me"},{aw:"ዮሐንስ",ph:"Yohannes",en:"John (name)"} ] },
  { chars:["ደ","ዱ","ዲ","ዳ","ዴ","ድ","ዶ"], base:"d", name:"Dä", type:"standard", words:[
    {aw:"ደብተር",ph:"debtär",en:"notebook"},{aw:"ዱባ",ph:"duba",en:"pumpkin / cucumber"},
    {aw:"ዲያቆን",ph:"diyaqon",en:"deacon"},{aw:"ዳቦ",ph:"dabo",en:"bread"},
    null, {aw:"ድምጽ",ph:"dimts",en:"voice / sound"},{aw:"ዶሮ",ph:"doro",en:"chicken"} ] },
  { chars:["ጀ","ጁ","ጂ","ጃ","ጄ","ጅ","ጆ"], base:"j", name:"Jä", type:"standard", words:[
    {aw:"ጀግና",ph:"jegna",en:"hero"},{aw:"ጁስ",ph:"jus",en:"juice"},
    {aw:"ጂኦግራፊ",ph:"jiografi",en:"geography"},{aw:"ጃኬት",ph:"jaket",en:"jacket"},
    null, {aw:"ጅብ",ph:"jib",en:"hyena"},{aw:"ጆሮ",ph:"joro",en:"ear"} ] },
  { chars:["ገ","ጉ","ጊ","ጋ","ጌ","ግ","ጎ"], base:"g", name:"Gä", type:"standard", words:[
    {aw:"ገንዘብ",ph:"genzeb",en:"money"},{aw:"ጉዞ",ph:"guzo",en:"journey"},
    {aw:"ጊዜ",ph:"gize",en:"time"},{aw:"ጋዜጣ",ph:"gazeta",en:"newspaper"},
    {aw:"ጌጥ",ph:"get",en:"ornament"},{aw:"ግንብ",ph:"ginb",en:"wall"},
    {aw:"ጎማ",ph:"goma",en:"tire / rubber"} ] },
  { chars:["ጠ","ጡ","ጢ","ጣ","ጤ","ጥ","ጦ"], base:"t'", name:"Ṭä", type:"arabic", words:[
    {aw:"ጠረጴዛ",ph:"t'ereppeza",en:"table"},{aw:"ጡት",ph:"t'ut",en:"breast"},
    {aw:"ጢስ",ph:"t'is",en:"smoke"},{aw:"ጣሊያን",ph:"T'aliyan",en:"Italy"},
    {aw:"ጤና",ph:"t'ena",en:"health"},{aw:"ጥርስ",ph:"t'irs",en:"tooth"},
    {aw:"ጦር",ph:"t'or",en:"spear"} ] },
  { chars:["ጨ","ጩ","ጪ","ጫ","ጬ","ጭ","ጮ"], base:"ch'", name:"Chʼä", type:"standard", words:[
    {aw:"ጨው",ph:"ch'ew",en:"salt"},{aw:"ጩኸት",ph:"ch'uhet",en:"shout / scream"},
    null, {aw:"ጫማ",ph:"ch'ama",en:"shoe"}, null,
    {aw:"ጭንቅላት",ph:"ch'inqilat",en:"head / brain"},{aw:"ጮኸ",ph:"ch'ohe",en:"he shouted"} ] },
  { chars:["ጰ","ጱ","ጲ","ጳ","ጴ","ጵ","ጶ"], base:"p'", name:"Pʼä", type:"lookalike", words:[
    null, null, null,
    {aw:"ጳጳስ",ph:"p'ap'as",en:"bishop"},{aw:"ጴጥሮስ",ph:"P'et'ros",en:"Peter (name)"},
    null, null ] },
  { chars:["ጸ","ጹ","ጺ","ጻ","ጼ","ጽ","ጾ"], base:"ts", name:"Tsä", type:"arabic", words:[
    {aw:"ጸሐይ",ph:"tsähay",en:"sun"}, null,
    {aw:"ጺም",ph:"tsim",en:"beard"},{aw:"ጻድቅ",ph:"tsadiq",en:"righteous one"},
    null, {aw:"ጽሑፍ",ph:"tsihuf",en:"writing / text"},{aw:"ጾም",ph:"tsom",en:"fasting"} ] },
  { chars:["ፀ","ፁ","ፂ","ፃ","ፄ","ፅ","ፆ"], base:"ts", name:"Tsʼä", type:"arabic", words:[
    {aw:"ፀሐይ",ph:"tsähay",en:"sun (alt. spelling)"}, null, null, null, null,
    {aw:"ፅሑፍ",ph:"tsihuf",en:"writing (alt. spelling)"},{aw:"ፆም",ph:"tsom",en:"fasting (alt. spelling)"} ] },
  { chars:["ፈ","ፉ","ፊ","ፋ","ፌ","ፍ","ፎ"], base:"f", name:"Fä", type:"standard", words:[
    {aw:"ፈረስ",ph:"feres",en:"horse"},{aw:"ፉርኖ",ph:"furno",en:"bakery / oven"},
    {aw:"ፊት",ph:"fit",en:"face"},{aw:"ፋሲካ",ph:"fasika",en:"Easter"},
    {aw:"ፌስታል",ph:"festal",en:"plastic bag"},{aw:"ፍቅር",ph:"fikir",en:"love"},
    {aw:"ፎቶ",ph:"foto",en:"photo"} ] },
  { chars:["ፐ","ፑ","ፒ","ፓ","ፔ","ፕ","ፖ"], base:"p", name:"Pä", type:"standard", words:[
    null, null,
    {aw:"ፒያኖ",ph:"piyano",en:"piano"},{aw:"ፓስታ",ph:"pasta",en:"pasta"},
    null, {aw:"ፕሬዚዳንት",ph:"prezidant",en:"president"},{aw:"ፖሊስ",ph:"polis",en:"police"} ] }
];

// Flat list of all 231 forms, each with a stable id ("{rowIdx}_{orderIdx}")
// used for favorites/mastery storage and for the audio-file naming scheme.
const FIDEL_DECK = [];
FIDEL_ROWS.forEach(function(row, rowIdx){
  row.chars.forEach(function(ch, orderIdx){
    FIDEL_DECK.push({
      id: rowIdx + '_' + orderIdx,
      char: ch, rowIdx: rowIdx, orderIdx: orderIdx,
      phon: row.base + PHON_SUFFIX[orderIdx],
      ttsFallback: row.base + TTS_SUFFIX[orderIdx],
      type: row.type,
      word: row.words[orderIdx] || null
    });
  });
});
