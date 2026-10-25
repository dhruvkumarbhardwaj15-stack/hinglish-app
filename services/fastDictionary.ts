import { AdvancedTransliterationResult, WordMetadata, WordAlternative } from '../types';

// Check if a string is pure Devanagari / punctuation (zero English/Latin letters)
export function isPureHindi(text: string): boolean {
  if (!text) return false;
  return !/[a-zA-Z]/.test(text);
}

// Fast high-frequency Hinglish dictionary with verified pure Devanagari variants
export const HINGLISH_DICT: Record<string, { default: string; alts: string[] }> = {
  // Greetings & Courtesies
  "namaste": { default: "नमस्ते", alts: ["नमस्ते", "नमश्ते", "नमस्ते!"] },
  "namaskar": { default: "नमस्कार", alts: ["नमस्कार", "नमस्ते", "नमस्कार!"] },
  "pranam": { default: "प्रणाम", alts: ["प्रणाम", "परनाम", "प्रणाम!"] },
  "salam": { default: "सलाम", alts: ["सलाम", "सलाम्", "सलाम!"] },
  "shukriya": { default: "शुक्रिया", alts: ["शुक्रिया", "धन्यवाद", "शुक्रिया!"] },
  "dhanyawad": { default: "धन्यवाद", alts: ["धन्यवाद", "धन्यवाद्", "शुक्रिया"] },
  "dhanyavad": { default: "धन्यवाद", alts: ["धन्यवाद", "धन्यवाद्"] },
  "alvida": { default: "अलविदा", alts: ["अलविदा", "अलविदाय"] },
  "kripya": { default: "कृपया", alts: ["कृपया", "कृप्या"] },
  "maaf": { default: "माफ़", alts: ["माफ़", "माफ", "माफ़ी"] },
  "maafi": { default: "माफ़ी", alts: ["माफ़ी", "माफी", "माफ़"] },

  // Pronouns
  "main": { default: "मैं", alts: ["मैं", "में", "मैल"] },
  "mai": { default: "मैं", alts: ["मैं", "में", "माई"] },
  "aap": { default: "आप", alts: ["आप", "आपा", "आपसे"] },
  "aapka": { default: "आपका", alts: ["आपका", "आप का", "आपकी"] },
  "aapke": { default: "आपके", alts: ["आपके", "आप के", "आपका"] },
  "aapki": { default: "आपकी", alts: ["आपकी", "आप की", "आपका"] },
  "aapko": { default: "आपको", alts: ["आपको", "आप को"] },
  "tum": { default: "तुम", alts: ["तुम", "तुम्हें", "तुम्ही"] },
  "tumhara": { default: "तुम्हारा", alts: ["तुम्हारा", "तुम्हारी", "तुम्हारे"] },
  "tumhare": { default: "तुम्हारे", alts: ["तुम्हारे", "तुम्हारा", "तुम्हारी"] },
  "tumhari": { default: "तुम्हारी", alts: ["तुम्हारी", "तुम्हारा", "तुम्हारे"] },
  "tumhe": { default: "तुम्हें", alts: ["तुम्हें", "तुम्हे", "तुमको"] },
  "tu": { default: "तू", alts: ["तू", "तुझे", "तेरा"] },
  "tera": { default: "तेरा", alts: ["तेरा", "तेरे", "तेरी"] },
  "tere": { default: "तेरे", alts: ["तेरे", "तेरा", "तेरी"] },
  "teri": { default: "तेरी", alts: ["तेरी", "तेरा", "तेरे"] },
  "tujhe": { default: "तुझे", alts: ["तुझे", "तुझको"] },
  "hum": { default: "हम", alts: ["हम", "हमें", "हमलोग"] },
  "ham": { default: "हम", alts: ["हम", "हमें"] },
  "hamara": { default: "हमारा", alts: ["हमारा", "हमारे", "हमारी"] },
  "hamare": { default: "हमारे", alts: ["हमारे", "हमारा", "हमारी"] },
  "hamari": { default: "हमारी", alts: ["हमारी", "हमारा", "हमारे"] },
  "hume": { default: "हमें", alts: ["हमें", "हुमे", "हमको"] },
  "humko": { default: "हमको", alts: ["हमको", "हमें"] },
  "yeh": { default: "यह", alts: ["यह", "ये"] },
  "ye": { default: "ये", alts: ["ये", "यह"] },
  "woh": { default: "वह", alts: ["वह", "वो"] },
  "wo": { default: "वो", alts: ["वो", "वह"] },
  "inka": { default: "इनका", alts: ["इनका", "इनके", "इनकी"] },
  "inke": { default: "इनके", alts: ["इनके", "इनका", "इनकी"] },
  "inki": { default: "इनकी", alts: ["इनकी", "इनका", "इनके"] },
  "unka": { default: "उनका", alts: ["उनका", "उनके", "उनकी"] },
  "unke": { default: "उनके", alts: ["उनके", "उनका", "उनकी"] },
  "unki": { default: "उनकी", alts: ["उनकी", "उनका", "उनके"] },
  "unko": { default: "उनको", alts: ["उनको", "उन्हें"] },
  "inhe": { default: "इन्हें", alts: ["इन्हें", "इनको"] },
  "unhe": { default: "उन्हें", alts: ["उन्हें", "उनको"] },
  "apna": { default: "अपना", alts: ["अपना", "अपने", "अपनी"] },
  "apne": { default: "अपने", alts: ["अपने", "अपना", "अपनी"] },
  "apni": { default: "अपनी", alts: ["अपनी", "अपना", "अपने"] },
  "mera": { default: "मेरा", alts: ["मेरा", "मेरे", "मेरी"] },
  "mere": { default: "मेरे", alts: ["मेरे", "मेरा", "मेरी"] },
  "meri": { default: "मेरी", alts: ["मेरी", "मेरा", "मेरे"] },
  "mujhe": { default: "मुझे", alts: ["मुझे", "मुझको"] },
  "mujhko": { default: "मुझको", alts: ["मुझको", "मुझे"] },
  "use": { default: "उसे", alts: ["उसे", "उसको"] },
  "usko": { default: "उसको", alts: ["उसको", "उसे"] },
  "uska": { default: "उसका", alts: ["उसका", "उसके", "उसकी"] },
  "uske": { default: "उसके", alts: ["उसके", "उसका", "उसकी"] },
  "uski": { default: "उसकी", alts: ["उसकी", "उसका", "उसके"] },

  // Question words
  "kya": { default: "क्या", alts: ["क्या", "क्या?", "क्या-क्या"] },
  "kyun": { default: "क्यों", alts: ["क्यों", "क्यूँ"] },
  "kyon": { default: "क्यों", alts: ["क्यों", "क्यूँ"] },
  "kaun": { default: "कौन", alts: ["कौन", "कौन-सा"] },
  "kahan": { default: "कहाँ", alts: ["कहाँ", "कहा"] },
  "kaha": { default: "कहा", alts: ["कहा", "कहाँ", "कहना"] },
  "kidhar": { default: "किधर", alts: ["किधर", "किधर को"] },
  "kab": { default: "कब", alts: ["कब", "कभी"] },
  "kaisa": { default: "कैसा", alts: ["कैसा", "कैसे", "कैसी"] },
  "kaise": { default: "कैसे", alts: ["कैसे", "कैसा", "कैसी"] },
  "kaisi": { default: "कैसी", alts: ["कैसी", "कैसे", "कैसा"] },
  "kitna": { default: "कितना", alts: ["कितना", "कितने", "कितनी"] },
  "kitne": { default: "कितने", alts: ["कितने", "कितना", "कितनी"] },
  "kitni": { default: "कितनी", alts: ["कितनी", "कितने", "कितना"] },
  "kiska": { default: "किसका", alts: ["किसका", "किसके", "किसकी"] },
  "kisko": { default: "किसको", alts: ["किसको", "किसे"] },
  "kisne": { default: "किसने", alts: ["किसने", "किसने?"] },

  // Verbs & Auxiliaries
  "hai": { default: "है", alts: ["है", "हैं"] },
  "hain": { default: "हैं", alts: ["हैं", "है"] },
  "ho": { default: "हो", alts: ["हो", "हों", "होवे"] },
  "hoon": { default: "हूँ", alts: ["हूँ", "हूं"] },
  "hu": { default: "हूँ", alts: ["हूँ", "हूं"] },
  "tha": { default: "था", alts: ["था", "थे", "थी"] },
  "the": { default: "थे", alts: ["थे", "था", "थी"] },
  "thi": { default: "थी", alts: ["थी", "थे", "था"] },
  "hoga": { default: "होगा", alts: ["होगा", "होगी", "होंगे"] },
  "hogi": { default: "होगी", alts: ["होगी", "होगा"] },
  "honge": { default: "होंगे", alts: ["होंगे", "होगा"] },
  "karna": { default: "करना", alts: ["करना", "करो", "करें"] },
  "karo": { default: "करो", alts: ["करो", "करना", "करें"] },
  "kar": { default: "कर", alts: ["कर", "करें"] },
  "karein": { default: "करें", alts: ["करें", "करे", "करो"] },
  "kare": { default: "करे", alts: ["करे", "करें", "करो"] },
  "kiya": { default: "किया", alts: ["किया", "किए", "की"] },
  "kiye": { default: "किए", alts: ["किए", "कीये"] },
  "karunga": { default: "करूँगा", alts: ["करूँगा", "करूंगा", "करेंगे"] },
  "karenge": { default: "करेंगे", alts: ["करेंगे", "करूँगा"] },
  "raha": { default: "रहा", alts: ["रहा", "रहे", "रही"] },
  "rahe": { default: "रहे", alts: ["रहे", "रहा", "रही"] },
  "rahi": { default: "रही", alts: ["रही", "रहा", "रहे"] },
  "ja": { default: "जा", alts: ["जा", "जाओ", "जाना"] },
  "jaa": { default: "जा", alts: ["जा", "जाओ", "जाना"] },
  "jao": { default: "जाओ", alts: ["जाओ", "जाना", "जाइए"] },
  "jana": { default: "जाना", alts: ["जाना", "जाओ"] },
  "jaana": { default: "जाना", alts: ["जाना", "जा"] },
  "gaya": { default: "गया", alts: ["गया", "गए", "गई"] },
  "gaye": { default: "गए", alts: ["गए", "गये"] },
  "gayi": { default: "गई", alts: ["गई", "गयी"] },
  "aa": { default: "आ", alts: ["आ", "आओ", "आना"] },
  "aao": { default: "आओ", alts: ["आओ", "आना", "आइए"] },
  "aana": { default: "आना", alts: ["आना", "आओ"] },
  "aaya": { default: "आया", alts: ["आया", "आए", "आई"] },
  "aaye": { default: "आए", alts: ["आए", "आयें", "आये"] },
  "aayi": { default: "आई", alts: ["आई", "आयी"] },
  "aunga": { default: "आऊंगा", alts: ["आऊंगा", "आएंगे"] },
  "aayenge": { default: "आएंगे", alts: ["आएंगे", "आऊंगा"] },
  "bol": { default: "बोल", alts: ["बोल", "बोलो", "बोलना"] },
  "bolo": { default: "बोलो", alts: ["बोलो", "बोलना"] },
  "bolna": { default: "बोलना", alts: ["बोलना", "बोलो"] },
  "bola": { default: "बोला", alts: ["बोला", "बोले", "बोली"] },
  "boli": { default: "बोली", alts: ["बोली", "बोला"] },
  "bole": { default: "बोले", alts: ["बोले", "बोला"] },
  "dekh": { default: "देख", alts: ["देख", "देखो", "देखना"] },
  "dekho": { default: "देखो", alts: ["देखो", "देखना", "देखिए"] },
  "dekhna": { default: "देखना", alts: ["देखना", "देखो"] },
  "dekha": { default: "देखा", alts: ["देखा", "देखे", "देखी"] },
  "dekhi": { default: "देखी", alts: ["देखी", "देखा"] },
  "dekhe": { default: "देखे", alts: ["देखे", "देखा"] },
  "sun": { default: "सुन", alts: ["सुन", "सुनो", "सुनना"] },
  "suno": { default: "सुनो", alts: ["सुनो", "सुनना", "सुनिए"] },
  "sunna": { default: "सुनना", alts: ["सुनना", "सुनो"] },
  "suna": { default: "सुना", alts: ["सुना", "सुने", "सुनी"] },
  "khana": { default: "खाना", alts: ["खाना", "खाओ", "खाया"] },
  "khao": { default: "खाओ", alts: ["खाओ", "खाना", "खाइए"] },
  "khaya": { default: "खाया", alts: ["खाया", "खाए"] },
  "peena": { default: "पीना", alts: ["पीना", "पीओ", "पीया"] },
  "peeo": { default: "पीओ", alts: ["पीओ", "पीना", "पीजिए"] },
  "piya": { default: "पिया", alts: ["पिया", "पीया"] },
  "peeya": { default: "पीया", alts: ["पीया", "पिया"] },
  "chal": { default: "चल", alts: ["चल", "चलो", "चलना"] },
  "chalo": { default: "चलो", alts: ["चलो", "चलना", "चलिए"] },
  "chalna": { default: "चलना", alts: ["चलना", "चलो"] },
  "chala": { default: "चला", alts: ["चला", "चले", "चली"] },
  "de": { default: "दे", alts: ["दे", "दो", "देना"] },
  "do": { default: "दो", alts: ["दो", "देना", "दीजिए"] },
  "dena": { default: "देना", alts: ["देना", "दो", "दीजिए"] },
  "diya": { default: "दिया", alts: ["दिया", "दीया", "दिए"] },
  "diye": { default: "दिए", alts: ["दिए", "दिये"] },
  "dijiye": { default: "दीजिए", alts: ["दीजिए", "दीजिये", "दो"] },
  "le": { default: "ले", alts: ["ले", "लो", "लेना"] },
  "lo": { default: "लो", alts: ["लो", "लेना", "लीजिए"] },
  "lena": { default: "लेना", alts: ["लेना", "लो", "लीजिए"] },
  "liya": { default: "लिया", alts: ["लिया", "लीया", "लिए"] },
  "liye": { default: "लिए", alts: ["लिए", "लिये"] },
  "lijiye": { default: "लीजिए", alts: ["लीजिए", "लीजिये", "लो"] },
  "bata": { default: "बता", alts: ["बता", "बताओ", "बताना"] },
  "batao": { default: "बताओ", alts: ["बताओ", "बताना", "बताइए"] },
  "batana": { default: "बताना", alts: ["बताना", "बताओ"] },
  "bataya": { default: "बताया", alts: ["बताया", "बताए"] },
  "bataiye": { default: "बताइए", alts: ["बताइए", "बताइये", "बताओ"] },
  "mil": { default: "मिल", alts: ["मिल", "मिलो", "मिलना"] },
  "milo": { default: "मिलो", alts: ["मिलो", "मिलना", "मिलिए"] },
  "milna": { default: "मिलना", alts: ["मिलना", "मिलो"] },
  "mila": { default: "मिला", alts: ["मिला", "मिले", "मिली"] },
  "mile": { default: "मिले", alts: ["मिले", "मिला"] },
  "milte": { default: "मिलते", alts: ["मिलते", "मिलता"] },
  "milenge": { default: "मिलेंगे", alts: ["मिलेंगे", "मिलते"] },
  "samajh": { default: "समझ", alts: ["समझ", "समझो", "समझना"] },
  "samjho": { default: "समझो", alts: ["समझो", "समझना", "समझिए"] },
  "samjha": { default: "समझा", alts: ["समझा", "समझे"] },
  "samjhe": { default: "समझे", alts: ["समझे", "समझा"] },
  "pata": { default: "पता", alts: ["पता", "पत्ता", "पाता"] },
  "jaanta": { default: "जानता", alts: ["जानता", "जानते"] },
  "jaante": { default: "जानते", alts: ["जानते", "जानता"] },
  "soch": { default: "सोच", alts: ["सोच", "सोचो", "सोचना"] },
  "socho": { default: "सोचो", alts: ["सोचो", "सोचना"] },
  "socha": { default: "सोचा", alts: ["सोचा", "सोचे"] },

  // Common Adjectives & Adverbs
  "theek": { default: "ठीक", alts: ["ठीक", "ठीक-ठाक", "ठिक"] },
  "thik": { default: "ठीक", alts: ["ठीक", "ठिक", "ठीक-ठाक"] },
  "achha": { default: "अच्छा", alts: ["अच्छा", "अच्छी", "अच्छे"] },
  "acha": { default: "अच्छा", alts: ["अच्छा", "अच्छी", "अच्छे"] },
  "achhi": { default: "अच्छी", alts: ["अच्छी", "अच्छा", "अच्छे"] },
  "achhe": { default: "अच्छे", alts: ["अच्छे", "अच्छा", "अच्छी"] },
  "badiya": { default: "बढ़िया", alts: ["बढ़िया", "बढिया", "बढ़िया!"] },
  "badhiya": { default: "बढ़िया", alts: ["बढ़िया", "बढिया"] },
  "bahut": { default: "बहुत", alts: ["बहुत", "बोहोत"] },
  "bohot": { default: "बहुत", alts: ["बहुत", "बोहोत"] },
  "bada": { default: "बड़ा", alts: ["बड़ा", "बड़े", "बड़ी"] },
  "bade": { default: "बड़े", alts: ["बड़े", "बड़ा", "बड़ी"] },
  "badi": { default: "बड़ी", alts: ["बड़ी", "बड़ा", "बड़े"] },
  "chota": { default: "छोटा", alts: ["छोटा", "छोटे", "छोटी"] },
  "chote": { default: "छोटे", alts: ["छोटे", "छोटा"] },
  "choti": { default: "छोटी", alts: ["छोटी", "छोटा"] },
  "thoda": { default: "थोड़ा", alts: ["थोड़ा", "थोड़े", "थोड़ी"] },
  "thode": { default: "थोड़े", alts: ["थोड़े", "थोड़ा"] },
  "thodi": { default: "थोड़ी", alts: ["थोड़ी", "थोड़ा"] },
  "jyada": { default: "ज्यादा", alts: ["ज्यादा", "ज़्यादा"] },
  "zyada": { default: "ज़्यादा", alts: ["ज़्यादा", "ज्यादा"] },
  "kam": { default: "कम", alts: ["कम", "काम", "कमी"] },
  "aur": { default: "और", alts: ["और", "ओर"] },
  "lekin": { default: "लेकिन", alts: ["लेकिन", "मगर", "परन्तु"] },
  "magar": { default: "मगर", alts: ["मगर", "लेकिन"] },
  "par": { default: "पर", alts: ["पर", "पार"] },
  "toh": { default: "तो", alts: ["तो", "तोह"] },
  "to": { default: "तो", alts: ["तो", "तोह"] },
  "bhi": { default: "भी", alts: ["भी", "भीतर"] },
  "nahi": { default: "नहीं", alts: ["नहीं", "नही", "ना"] },
  "nahin": { default: "नहीं", alts: ["नहीं", "नही"] },
  "na": { default: "ना", alts: ["ना", "न", "नहीं"] },
  "mat": { default: "मत", alts: ["मत", "मतलब"] },
  "sirf": { default: "सिर्फ", alts: ["सिर्फ", "सिर्फ़"] },
  "bas": { default: "बस", alts: ["बस", "बस्स"] },
  "sach": { default: "सच", alts: ["सच", "सच्चा", "सच्ची"] },
  "jhooth": { default: "झूठ", alts: ["झूठ", "झूठा"] },
  "jaldi": { default: "जल्दी", alts: ["जल्दी", "जल्द"] },
  "aaram": { default: "आराम", alts: ["आराम", "आरामी"] },
  "aaj": { default: "आज", alts: ["आज", "आजकल"] },
  "kal": { default: "कल", alts: ["कल", "काल"] },
  "parso": { default: "परसों", alts: ["परसों", "परसो"] },
  "ab": { default: "अब", alts: ["अब", "अभी"] },
  "abhi": { default: "अभी", alts: ["अभी", "अब"] },
  "tab": { default: "तब", alts: ["तब", "तभी"] },
  "jab": { default: "जब", alts: ["जब", "कभी"] },
  "hamesha": { default: "हमेशा", alts: ["हमेशा", "सदा"] },
  "kabhi": { default: "कभी", alts: ["कभी", "कभी-कभी"] },
  "sath": { default: "साथ", alts: ["साथ", "साथी"] },
  "saath": { default: "साथ", alts: ["साथ", "साथी"] },
  "bina": { default: "बिना", alts: ["बिना", "बगैर"] },
  "baad": { default: "बाद", alts: ["बाद", "बादे"] },
  "pehle": { default: "पहले", alts: ["पहले", "पहला"] },
  "andar": { default: "अंदर", alts: ["अंदर", "भीतर"] },
  "bahar": { default: "बाहर", alts: ["बाहर", "बाहरे"] },
  "upar": { default: "ऊपर", alts: ["ऊपर", "उपरी"] },
  "neeche": { default: "नीचे", alts: ["नीचे", "नीचा"] },
  "aage": { default: "आगे", alts: ["आगे", "आगा"] },
  "peeche": { default: "पीछे", alts: ["पीछे", "पीछा"] },
  "paas": { default: "पास", alts: ["पास", "पास-पास"] },
  "door": { default: "दूर", alts: ["दूर", "दूरी"] },

  // Nouns & Loanwords
  "haal": { default: "हाल", alts: ["हाल", "हालत", "हालात"] },
  "ghar": { default: "घर", alts: ["घर", "घरों"] },
  "dost": { default: "दोस्त", alts: ["दोस्त", "दोस्ती", "दोस्तों"] },
  "yaar": { default: "यार", alts: ["यार", "यारा", "यारों"] },
  "bhai": { default: "भाई", alts: ["भाई", "भैया", "भैय्या"] },
  "behen": { default: "बहन", alts: ["बहन", "बहना"] },
  "mummy": { default: "मम्मी", alts: ["मम्मी", "माँ"] },
  "maa": { default: "माँ", alts: ["माँ", "मां"] },
  "papa": { default: "पापा", alts: ["पापा", "पिताजी"] },
  "pitaji": { default: "पिताजी", alts: ["पिताजी", "पिता"] },
  "beta": { default: "बेटा", alts: ["बेटा", "बेटे"] },
  "beti": { default: "बेटी", alts: ["बेटी", "बेटियां"] },
  "log": { default: "लोग", alts: ["लोग", "लोगों"] },
  "desh": { default: "देश", alts: ["देश", "देस"] },
  "baat": { default: "बात", alts: ["बात", "बातें", "बांट"] },
  "baatein": { default: "बातें", alts: ["बातें", "बात"] },
  "kaam": { default: "काम", alts: ["काम", "कम"] },
  "naam": { default: "नाम", alts: ["नाम", "नामें"] },
  "samay": { default: "समय", alts: ["समय", "समा", "वक़्त"] },
  "waqt": { default: "वक़्त", alts: ["वक़्त", "वक्त"] },
  "din": { default: "दिन", alts: ["दिन", "दीन"] },
  "raat": { default: "रात", alts: ["रात", "रातें"] },
  "subah": { default: "सुबह", alts: ["सुबह", "सुबहा"] },
  "shaam": { default: "शाम", alts: ["शाम", "सांझ"] },
  "saal": { default: "साल", alts: ["साल", "सालों"] },
  "mahina": { default: "महीना", alts: ["महीना", "महीने"] },
  "paani": { default: "पानी", alts: ["पानी", "पाणि"] },
  "pani": { default: "पानी", alts: ["पानी", "पाणि"] },
  "chai": { default: "चाय", alts: ["चाय", "चाए"] },
  "roti": { default: "रोटी", alts: ["रोटी", "रोटियां"] },
  "rasta": { default: "रास्ता", alts: ["रास्ता", "रास्ते"] },
  "gaadi": { default: "गाड़ी", alts: ["गाड़ी", "गाड़ियां"] },
  "shahar": { default: "शहर", alts: ["शहर", "शहरों"] },
  "gaon": { default: "गाँव", alts: ["गाँव", "गांव"] },
  "pyaar": { default: "प्यार", alts: ["प्यार", "प्यारी"] },
  "pyar": { default: "प्यार", alts: ["प्यार", "प्यारी"] },
  "dosti": { default: "दोस्ती", alts: ["दोस्ती", "दोस्त"] },
  "madad": { default: "मदद", alts: ["मदद", "सहायता"] },
  "sawal": { default: "सवाल", alts: ["सवाल", "सवालात"] },
  "jawab": { default: "जवाब", alts: ["जवाब", "उत्तर"] },
  "khushi": { default: "खुशी", alts: ["खुशी", "ख़ुशी"] },
  "dukh": { default: "दुख", alts: ["दुख", "दुःख"] },
  "school": { default: "स्कूल", alts: ["स्कूल", "विद्यालय"] },
  "office": { default: "ऑफ़िस", alts: ["ऑफ़िस", "दफ़्तर", "ऑफिस"] },
  "phone": { default: "फ़ोन", alts: ["फ़ोन", "फोन", "दूरभाष"] },
  "bus": { default: "बस", alts: ["बस", "बस्स"] },
  "car": { default: "कार", alts: ["कार", "गाड़ी"] },
  "doctor": { default: "डॉक्टर", alts: ["डॉक्टर", "वैद्य"] },
  "hospital": { default: "अस्पताल", alts: ["अस्पताल", "हॉस्पिटल"] },
  "time": { default: "टाइम", alts: ["टाइम", "समय", "वक़्त"] },
  "money": { default: "मनी", alts: ["मनी", "पैसे", "रुपये"] },
  "friend": { default: "फ़्रेंड", alts: ["फ़्रेंड", "दोस्त", "मित्र"] },
  "happy": { default: "हैप्पी", alts: ["हैप्पी", "खुश", "प्रसन्न"] },
  "sorry": { default: "सॉरी", alts: ["सॉरी", "माफ़ करें", "माफ़ी"] },
  "please": { default: "प्लीज़", alts: ["प्लीज़", "कृपया", "प्लिज"] },
  "thank": { default: "थैंक", alts: ["थैंक", "धन्यवाद"] },
  "thanks": { default: "थैंक्स", alts: ["थैंक्स", "धन्यवाद", "शुक्रिया"] },
  "welcome": { default: "वेलकम", alts: ["वेलकम", "स्वागत है"] }
};

// Check if entire input phrase consists purely of verified dictionary words
export function canBeFullyTransliteratedLocally(input: string): boolean {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(token => {
    const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    return Boolean(clean && HINGLISH_DICT[clean]);
  });
}

// Global in-memory cache
const MEMORY_CACHE = new Map<string, AdvancedTransliterationResult>();

// Clear all legacy or corrupted caches with hybrid characters
export function clearCorruptedCache() {
  MEMORY_CACHE.clear();
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('trans_') || k.startsWith('v2_trans_') || k.startsWith('v3_trans_'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => sessionStorage.removeItem(k));
  } catch {}
}

export function getFromCache(key: string): AdvancedTransliterationResult | null {
  const cleanKey = key.trim().toLowerCase();
  
  const validateResult = (data: AdvancedTransliterationResult | null): AdvancedTransliterationResult | null => {
    if (!data || !data.words || data.words.length === 0) return null;
    // Strictly verify: EVERY word and alternative MUST be 100% pure Devanagari (ZERO Latin letters)
    const isPure = data.words.every(w => {
      const wordPure = isPureHindi(w.selectedHindi);
      const altsPure = w.alternatives && w.alternatives.length > 0 && w.alternatives.every(a => isPureHindi(a.hindi));
      return wordPure && altsPure;
    });
    return isPure ? data : null;
  };

  if (MEMORY_CACHE.has(cleanKey)) {
    const valid = validateResult(MEMORY_CACHE.get(cleanKey)!);
    if (valid) return valid;
    MEMORY_CACHE.delete(cleanKey);
  }

  try {
    const stored = sessionStorage.getItem(`v3_trans_${cleanKey}`);
    if (stored) {
      const parsed = JSON.parse(stored) as AdvancedTransliterationResult;
      const valid = validateResult(parsed);
      if (valid) {
        MEMORY_CACHE.set(cleanKey, valid);
        return valid;
      } else {
        sessionStorage.removeItem(`v3_trans_${cleanKey}`);
      }
    }
  } catch {}

  return null;
}

export function saveToCache(key: string, data: AdvancedTransliterationResult) {
  if (!data || !data.words || data.words.length === 0) return;

  // Strictest guard: NEVER save any result that has even a single Latin/English character
  const isPure = data.words.every(w => {
    const wordPure = isPureHindi(w.selectedHindi);
    const altsPure = w.alternatives && w.alternatives.length > 0 && w.alternatives.every(a => isPureHindi(a.hindi));
    return wordPure && altsPure;
  });

  if (!isPure) return;

  const cleanKey = key.trim().toLowerCase();
  MEMORY_CACHE.set(cleanKey, data);
  try {
    sessionStorage.setItem(`v3_trans_${cleanKey}`, JSON.stringify(data));
  } catch {}
}

// Generate smart variants only from pure Hindi words
export function generateSmartVariants(word: string, primary: string): string[] {
  if (!isPureHindi(primary)) {
    return [primary];
  }

  const alts = new Set<string>();
  alts.add(primary);

  // Short vs long vowel swap (ि <-> ी, ु <-> ू)
  if (primary.includes("ि")) {
    alts.add(primary.replace(/ि/g, "ी"));
  } else if (primary.includes("ी")) {
    alts.add(primary.replace(/ी/g, "ि"));
  }
  if (primary.includes("ु")) {
    alts.add(primary.replace(/ु/g, "ू"));
  } else if (primary.includes("ू")) {
    alts.add(primary.replace(/ू/g, "ु"));
  }

  // Anusvara variations
  if (!primary.includes("ँ") && !primary.includes("ं") && primary.length > 1) {
    alts.add(primary + "ं");
  }

  // Matra ending variations
  if (primary.endsWith("ा")) {
    alts.add(primary.slice(0, -1) + "े");
    alts.add(primary.slice(0, -1) + "ी");
  } else if (primary.endsWith("े")) {
    alts.add(primary.slice(0, -1) + "ा");
  }

  return Array.from(alts).filter(isPureHindi).slice(0, 4);
}

// Phonetic rules for converting any Romanized word into Devanagari
const PHONETIC_VOWELS: { key: string; independent: string; matra: string }[] = [
  { key: "aa", independent: "आ", matra: "ा" },
  { key: "ai", independent: "ऐ", matra: "ै" },
  { key: "au", independent: "औ", matra: "ौ" },
  { key: "ee", independent: "ई", matra: "ी" },
  { key: "ii", independent: "ई", matra: "ी" },
  { key: "oo", independent: "ऊ", matra: "ू" },
  { key: "uu", independent: "ऊ", matra: "ू" },
  { key: "a", independent: "अ", matra: "" },
  { key: "i", independent: "इ", matra: "ि" },
  { key: "u", independent: "उ", matra: "ु" },
  { key: "e", independent: "ए", matra: "े" },
  { key: "o", independent: "ओ", matra: "ो" },
];

const PHONETIC_CONSONANTS: { key: string; hindi: string }[] = [
  { key: "cch", hindi: "च्छ" }, { key: "chh", hindi: "छ" }, { key: "ksh", hindi: "क्ष" },
  { key: "kh", hindi: "ख" }, { key: "gh", hindi: "घ" }, { key: "ch", hindi: "च" },
  { key: "jh", hindi: "झ" }, { key: "th", hindi: "थ" }, { key: "dh", hindi: "ध" },
  { key: "ph", hindi: "फ" }, { key: "bh", hindi: "भ" }, { key: "sh", hindi: "श" },
  { key: "k", hindi: "क" }, { key: "g", hindi: "ग" }, { key: "c", hindi: "क" },
  { key: "j", hindi: "ज" }, { key: "t", hindi: "त" }, { key: "d", hindi: "द" },
  { key: "n", hindi: "न" }, { key: "p", hindi: "प" }, { key: "f", hindi: "फ़" },
  { key: "b", hindi: "ब" }, { key: "m", hindi: "म" }, { key: "y", hindi: "य" },
  { key: "r", hindi: "र" }, { key: "l", hindi: "ल" }, { key: "v", hindi: "व" },
  { key: "w", hindi: "व" }, { key: "s", hindi: "स" }, { key: "h", hindi: "ह" },
  { key: "z", hindi: "ज़" }, { key: "q", hindi: "क़" }, { key: "x", hindi: "क्स" },
];

const isLatinLetter = (ch: string | undefined) => Boolean(ch && /[a-z]/.test(ch));
const isVowelLetter = (ch: string | undefined) => Boolean(ch && /[aeiou]/.test(ch));

// Rule-based transliteration so every Hinglish word gets a Devanagari form
export function phoneticTransliterate(word: string): string {
  const src = word.toLowerCase();
  let out = "";
  let prevConsonant = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    // Keep digits, punctuation and existing Devanagari untouched
    if (!isLatinLetter(ch)) {
      out += ch;
      prevConsonant = false;
      i++;
      continue;
    }

    const vowel = PHONETIC_VOWELS.find(v => src.startsWith(v.key, i));
    if (vowel) {
      const isLast = !isLatinLetter(src[i + vowel.key.length]);
      if (prevConsonant) {
        // Hinglish word-final 'a' / 'i' usually stand for long vowels (accha -> अच्छा, pani -> पानी)
        if (isLast && vowel.key === "a" && out.length > 1) out += "ा";
        else if (isLast && vowel.key === "i") out += "ी";
        else out += vowel.matra;
      } else {
        out += vowel.independent;
      }
      prevConsonant = false;
      i += vowel.key.length;
      continue;
    }

    const consonant = PHONETIC_CONSONANTS.find(c => src.startsWith(c.key, i))!;
    const next = src[i + consonant.key.length];

    // Nasal 'n' after a vowel before another consonant becomes anusvara (hindi -> हिंदी)
    if (consonant.key === "n" && out && !prevConsonant && isLatinLetter(next) && !isVowelLetter(next) && !"nyhrwv".includes(next!)) {
      out += "ं";
      i++;
      continue;
    }

    if (prevConsonant) out += "्";
    out += consonant.hindi;
    prevConsonant = true;
    i += consonant.key.length;
  }

  return out;
}

// Convert a single token: dictionary first, then phonetic rules. Never returns Latin letters.
export function localTransliterateToken(token: string): WordMetadata {
  const cleanWord = token.toLowerCase().replace(/[^a-z0-9]/g, '');
  const punctuation = token.replace(/[a-z0-9]/gi, '');

  const dictEntry = HINGLISH_DICT[cleanWord];
  if (dictEntry) {
    const alts: WordAlternative[] = dictEntry.alts.map((h, idx) => ({
      hindi: h.includes(punctuation) ? h : h + punctuation,
      meaning: cleanWord,
      isDefault: idx === 0
    }));
    return {
      original: token,
      alternatives: alts,
      selectedHindi: dictEntry.default + punctuation
    };
  }

  const primary = phoneticTransliterate(token);
  const alts: WordAlternative[] = generateSmartVariants(token, primary).map((h, idx) => ({
    hindi: h,
    meaning: cleanWord || token,
    isDefault: idx === 0
  }));

  return {
    original: token,
    alternatives: alts,
    selectedHindi: primary
  };
}

// Instant local transliteration: dictionary words plus phonetic conversion for everything else
export function fastLocalTransliterate(input: string): AdvancedTransliterationResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const words: WordMetadata[] = tokens.map(localTransliterateToken);

  const sentenceHindi = words.map(w => w.selectedHindi).join(' ');

  return {
    results: [
      { hindi: sentenceHindi, context: "Standard transliteration" }
    ],
    words
  };
}
