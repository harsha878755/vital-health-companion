export type VitalLanguage = "en" | "hi" | "kn";

export const languageNames: Record<VitalLanguage, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ"
};

// Local, on-device UI translations. Keep safety meaning intact and leave user
// entered health data, names, medicine names, and measured values untouched.
const translations: Record<Exclude<VitalLanguage, "en">, Record<string, string>> = {
  hi: {
    "Skip to main content": "मुख्य सामग्री पर जाएँ", Language: "भाषा",
    "Proactive Health Guardian": "सक्रिय स्वास्थ्य सहायक",
    "My health": "मेरा स्वास्थ्य", Monitoring: "निगरानी", History: "इतिहास", Care: "देखभाल", Settings: "सेटिंग्स",
    Home: "होम", "Symptoms & vitals": "लक्षण और स्वास्थ्य माप", Medications: "दवाइयाँ", "Photo health check": "फ़ोटो से स्वास्थ्य जाँच",
    "Connect phone": "फ़ोन कनेक्ट करें", "Camera check": "कैमरा जाँच", "Voice check": "आवाज़ जाँच", Wearables: "वियरेबल उपकरण",
    "Health summary": "स्वास्थ्य सारांश", "Health report": "स्वास्थ्य रिपोर्ट", "Health timeline": "स्वास्थ्य समयरेखा",
    "Emergency help": "आपातकालीन सहायता", Appointments: "अपॉइंटमेंट", "Health overview": "स्वास्थ्य अवलोकन",
    "A clear view of recent health activity, care plans, and connected sources.": "हाल की स्वास्थ्य गतिविधि, देखभाल योजनाएँ और जुड़े स्रोत एक जगह देखें।",
    "Record symptoms and measurements, then review the screening result.": "लक्षण और माप दर्ज करें, फिर जाँच का परिणाम देखें।",
    "Review prescriptions, dose history, and reminder preferences.": "नुस्खे, दवा की खुराक का इतिहास और रिमाइंडर सेटिंग देखें।",
    "Review visible features in a health photo and consider safe next steps; this is not a diagnosis.": "स्वास्थ्य फ़ोटो में दिखने वाली बातों को देखें और सुरक्षित अगले कदमों पर विचार करें। यह निदान नहीं है।",
    "Review phone camera monitoring and posture check controls.": "फ़ोन कैमरा निगरानी और मुद्रा जाँच के नियंत्रण देखें।",
    "Pair the VITAL Android app with this dashboard over your trusted network.": "VITAL Android ऐप को अपने भरोसेमंद नेटवर्क पर इस डैशबोर्ड से जोड़ें।",
    "Record a voice check-in and review the resulting wellness context.": "आवाज़ से चेक-इन दर्ज करें और उसका स्वास्थ्य संदर्भ देखें।",
    "Review emergency options and configured caregiver contacts.": "आपातकालीन विकल्प और देखभालकर्ता के संपर्क देखें।",
    "Keep planned visits and appointment details together.": "नियोजित मुलाक़ातों और अपॉइंटमेंट का विवरण एक जगह रखें।",
    "Review readings shared by connected health and wearable sources.": "जुड़े स्वास्थ्य और वियरेबल स्रोतों से साझा किए गए माप देखें।",
    "Explore recent readings and health activity over time.": "समय के साथ हाल के माप और स्वास्थ्य गतिविधि देखें।",
    "See recent care, monitoring, and medication events in order.": "देखभाल, निगरानी और दवा से जुड़ी हाल की घटनाएँ क्रम से देखें।",
    "Prepare a shareable summary of the health information in VITAL.": "VITAL में मौजूद स्वास्थ्य जानकारी का साझा करने योग्य सारांश तैयार करें।",
    "Manage app preferences, reminders, and connected services.": "ऐप की प्राथमिकताएँ, रिमाइंडर और जुड़ी सेवाएँ प्रबंधित करें।",
    "Backend online": "बैकएंड चालू", "Backend offline": "बैकएंड बंद", "Connecting to backend": "बैकएंड से जुड़ रहा है",
    "Sign out": "साइन आउट", "Enter symptoms & readings": "लक्षण और माप दर्ज करें", "Recheck symptoms & readings": "लक्षण और माप फिर जाँचें",
    "Possible fall detected": "संभावित गिरावट का पता चला", "Check the person if safe. VITAL has not called emergency services.": "सुरक्षित हो तो व्यक्ति को देखें। VITAL ने आपातकालीन सेवाओं को कॉल नहीं किया है।",
    "View camera": "कैमरा देखें", "Phone not connected": "फ़ोन कनेक्ट नहीं है", "Maybe later": "बाद में",
    "Welcome to VITAL": "VITAL में आपका स्वागत है", "A snapshot of information saved on this device and synced from connected sources.": "इस डिवाइस पर सहेजी और जुड़े स्रोतों से सिंक की गई जानकारी का सारांश।",
    "Patient overview": "मरीज़ का अवलोकन", "Symptoms, vitals & screening": "लक्षण, माप और जाँच", "Medication schedule": "दवा का समय",
    "Wearable context": "वियरेबल संदर्भ", "Patient timeline": "मरीज़ की समयरेखा", "Plan a visit": "मुलाक़ात की योजना बनाएँ",
    "Preview the patient summary and save it as a PDF.": "मरीज़ का सारांश देखें और PDF के रूप में सहेजें।",
    "Ask VITAL": "VITAL से पूछें", "Close": "बंद करें", "here to help": "मदद के लिए यहाँ",
    "Hi! 👋 I’m VITAL’s health assistant. What would you like help with?": "नमस्ते! 👋 मैं VITAL का स्वास्थ्य सहायक हूँ। आपको किस बारे में मदद चाहिए?",
    "Explain my triage result": "मेरा जाँच परिणाम समझाएँ", "Show my latest readings": "मेरे नवीनतम माप दिखाएँ",
    "Help me prepare for a doctor visit": "डॉक्टर से मिलने की तैयारी में मदद करें", "What can I do about a fever?": "बुखार होने पर मैं क्या करूँ?",
    "Try asking": "यह पूछकर देखें", "You can ask next": "आप आगे यह पूछ सकते हैं", "Preparing an answer…": "जवाब तैयार हो रहा है…",
    "Ask a health question": "स्वास्थ्य से जुड़ा सवाल पूछें", "Ask a health question…": "स्वास्थ्य से जुड़ा सवाल लिखें…",
    "Send question": "सवाल भेजें", "Stop voice input": "आवाज़ इनपुट रोकें", "Ask by voice": "आवाज़ से पूछें",
    "Listen": "सुनें", "Turn off spoken replies": "बोले गए जवाब बंद करें", "Turn on spoken replies": "बोले गए जवाब चालू करें",
    "General information only. Not a diagnosis or prescription. For urgent symptoms, call emergency services.": "यह केवल सामान्य जानकारी है, निदान या नुस्खा नहीं। गंभीर लक्षण हों तो आपातकालीन सेवाओं को कॉल करें।",
    "Privacy first": "गोपनीयता पहले",
    "Your health, all in one place": "आपका स्वास्थ्य, एक ही जगह", "PRIVATE HEALTH SPACE": "निजी स्वास्थ्य स्थान",
    "Create your account": "अपना खाता बनाएँ", "Welcome back": "वापसी पर स्वागत है",
    "Register once to keep your health activity under your account on this device.": "इस डिवाइस पर अपनी स्वास्थ्य गतिविधि खाते में रखने के लिए एक बार पंजीकरण करें।",
    "Sign in once. VITAL will remember this device for your next visit.": "एक बार साइन इन करें। अगली बार VITAL इस डिवाइस को याद रखेगा।",
    "Email address": "ईमेल पता", Password: "पासवर्ड", "At least 10 characters": "कम से कम 10 अक्षर", "Enter your password": "अपना पासवर्ड दर्ज करें",
    Hide: "छिपाएँ", Show: "दिखाएँ", "Please wait…": "कृपया प्रतीक्षा करें…", "Create secure account": "सुरक्षित खाता बनाएँ",
    "Sign in": "साइन इन", "Already registered?": "क्या पहले से पंजीकृत हैं?", "First time using VITAL?": "क्या आप पहली बार VITAL इस्तेमाल कर रहे हैं?",
    "Create an account": "खाता बनाएँ", "This local demo remembers your sign-in on this browser for up to one year. Use a private device only if it is yours.": "यह स्थानीय डेमो इस ब्राउज़र में आपका साइन-इन एक वर्ष तक याद रखता है। निजी डिवाइस पर ही इस्तेमाल करें।",
    "Wearable readings": "वियरेबल माप", "Optional wellness context": "वैकल्पिक स्वास्थ्य संदर्भ", "No data": "कोई डेटा नहीं",
    "No successful sync yet": "अभी तक सफल सिंक नहीं", "Current · measured ": "वर्तमान · माप का समय ", "Heart rate": "हृदय गति",
    "Resting HR": "आराम की हृदय गति", "Steps": "कदम", "Active calories": "सक्रिय कैलोरी", "Total calories": "कुल कैलोरी",
    "Distance": "दूरी", "Sleep": "नींद", "SpO₂": "SpO₂", "Refresh watch readings": "घड़ी के माप रीफ़्रेश करें",
    "Sync a wearable": "वियरेबल सिंक करें", "Connect through your phone's health app": "अपने फ़ोन के स्वास्थ्य ऐप से कनेक्ट करें",
    "Recent reading history": "हाल के माप का इतिहास",
    "Edit profile": "प्रोफ़ाइल संपादित करें", "Save changes": "बदलाव सहेजें", Cancel: "रद्द करें",
    "Privacy and data": "गोपनीयता और डेटा", "Accessibility": "सुगम्यता", "Medication reminders": "दवा रिमाइंडर",
    "Daily check-in": "रोज़ाना चेक-इन", "How are you feeling?": "आप कैसा महसूस कर रहे हैं?", Good: "अच्छा", Okay: "ठीक", "Need support": "मदद चाहिए",
    "Start camera": "कैमरा शुरू करें", "Stop camera": "कैमरा रोकें", "Analyze frame": "फ़्रेम का विश्लेषण करें",
    "Take or choose a photo": "फ़ोटो लें या चुनें", "Review visible features": "दिखने वाली बातें देखें", "Continue without photo": "फ़ोटो के बिना जारी रखें",
    "Prescription photos are processed by the local Ollama model on this computer.": "नुस्खे की फ़ोटो इसी कंप्यूटर पर मौजूद स्थानीय Ollama मॉडल से संसाधित होती हैं।",
    "The VITAL Phone Camera app": "VITAL Phone Camera ऐप", "Pair with VITAL": "VITAL से जोड़ें",
    "Call 112": "112 पर कॉल करें", "I took this dose": "मैंने यह खुराक ली", "Dose missed": "खुराक छूट गई", "Retry needed": "फिर कोशिश करें",
    "Local photo processing": "स्थानीय फ़ोटो प्रसंस्करण", "Readings are wellness context only; not a diagnosis.": "माप केवल स्वास्थ्य संदर्भ हैं; निदान नहीं।",
    "Personal health, protected": "निजी स्वास्थ्य जानकारी सुरक्षित",
    "Use 10 or more characters. VITAL stores a salted password hash, never the original password.": "10 या अधिक अक्षर इस्तेमाल करें। VITAL केवल सुरक्षित पासवर्ड हैश रखता है, मूल पासवर्ड नहीं।",
    "YOUR HEALTH OVERVIEW": "आपके स्वास्थ्य का सारांश", "Take a quick tour": "ऐप का छोटा परिचय देखें",
    "Latest screening": "नवीनतम जाँच", "Medication check-ins": "दवा चेक-इन", "Planned visits": "नियोजित मुलाक़ातें", "Wearable data": "वियरेबल डेटा",
    "Health information supports your care and does not replace a clinician.": "स्वास्थ्य जानकारी आपकी देखभाल में सहायक है; यह डॉक्टर की जगह नहीं लेती।",
    "Camera monitoring is off": "कैमरा निगरानी बंद है", "The phone is paired, but no active camera session is sending frames.": "फ़ोन जुड़ा है, लेकिन कोई सक्रिय कैमरा सत्र फ़्रेम नहीं भेज रहा।",
    "Camera feed is stale": "कैमरा फ़ीड पुरानी है", "Check camera": "कैमरा जाँचें", "Reconnect feed": "फ़ीड फिर जोड़ें",
    "The phone session is active, but VITAL has not received a recent frame. Reopen the phone camera monitor and check Wi-Fi.": "फ़ोन सत्र सक्रिय है, लेकिन VITAL को हाल का फ़्रेम नहीं मिला। फ़ोन कैमरा मॉनिटर फिर खोलें और Wi-Fi जाँचें।",
    "No wearable readings yet": "अभी वियरेबल माप उपलब्ध नहीं हैं", "Wearable sync is optional. Connect a source to show readings when available.": "वियरेबल सिंक वैकल्पिक है। माप दिखाने के लिए उपलब्ध स्रोत जोड़ें।",
    "Review data": "डेटा देखें", "Wearable data may be out of date": "वियरेबल डेटा पुराना हो सकता है",
    "The latest measurement is over 24 hours old. Refresh the watch sync before using these values as current context.": "नवीनतम माप 24 घंटे से पुराना है। इसे वर्तमान जानकारी मानने से पहले वॉच सिंक रीफ़्रेश करें।",
    "No screening result recorded": "जाँच का कोई परिणाम दर्ज नहीं है", "Enter symptoms and readings if you want VITAL to prepare a screening estimate.": "VITAL से जाँच का अनुमान पाने के लिए लक्षण और माप दर्ज करें।",
    "Prescription review is unfinished": "नुस्खे की समीक्षा अधूरी है", "Review schedule": "समय-सारणी देखें",
    "Confirm each medicine, dose, direction, and schedule against the doctor's original before enabling reminders.": "रिमाइंडर चालू करने से पहले हर दवा, खुराक, निर्देश और समय को डॉक्टर के मूल नुस्खे से मिलाएँ।",
    "Patient": "मरीज़", "Location": "स्थान", "Caretaker": "देखभालकर्ता", "Latest source": "नवीनतम स्रोत",
    "Wellness context only": "केवल स्वास्थ्य संदर्भ", "Does not change triage": "जाँच परिणाम नहीं बदलता", "Open timeline": "समयरेखा खोलें",
    "No monitoring activity yet. Start with a symptom and vital check.": "अभी निगरानी गतिविधि नहीं है। लक्षण और स्वास्थ्य माप जाँच से शुरू करें।",
    "01 / INPUT": "01 / जानकारी", "Describe what is happening, then enter the readings you actually have. Missing or unavailable data should lead to human review — not a made-up score.": "क्या हो रहा है बताएं और उपलब्ध माप दर्ज करें। जो जानकारी उपलब्ध नहीं है, उसकी समीक्षा व्यक्ति करे—उसका अनुमानित स्कोर न बनाएँ।",
    "What is happening right now?": "अभी क्या हो रहा है?", "Reading snapshot": "माप का सारांश", "Visual scales only · not normal ranges or a risk assessment": "केवल दृश्य पैमाने · सामान्य सीमा या जोखिम आकलन नहीं",
    "Choose an example or enter your own symptoms above": "कोई उदाहरण चुनें या ऊपर अपने लक्षण लिखें",
    "This check cannot diagnose a condition or confirm that you are safe. For severe symptoms, contact emergency services.": "यह जाँच बीमारी का निदान या आपकी सुरक्षा की पुष्टि नहीं कर सकती। गंभीर लक्षणों पर आपातकालीन सेवाओं से संपर्क करें।",
    "MORE DETAIL NEEDED": "अधिक जानकारी चाहिए", "Tell us more about the pain": "दर्द के बारे में और बताएं", "VITAL cannot assess unspecified pain or rule out a serious problem.": "VITAL अस्पष्ट दर्द का आकलन या गंभीर समस्या को खारिज नहीं कर सकता।",
    "Why did VITAL give this result?": "VITAL ने यह परिणाम क्यों दिया?", "Estimated result breakdown": "अनुमानित परिणाम का विवरण", "How this result was estimated": "यह परिणाम कैसे अनुमानित किया गया",
    "What raised concern": "चिंता के कारण", "From the symptoms or readings you entered.": "आपके दर्ज किए लक्षणों या माप के आधार पर।", "Reassuring information": "आश्वस्त करने वाली जानकारी", "Suggested next steps": "सुझाए गए अगले कदम",
    "Retry care check": "जाँच फिर करें", "Call 112 in India": "भारत में 112 पर कॉल करें",
    "No dose check-ins": "दवा चेक-इन नहीं हैं", "Medication activity": "दवा गतिविधि", "Current verification distribution": "वर्तमान पुष्टि का विवरण", "Avg. confidence": "औसत विश्वास स्तर", "Verification confidence": "पुष्टि का विश्वास स्तर",
    "Self-reported": "स्वयं द्वारा बताई गई", "Witnessed": "देखभालकर्ता ने देखा", "Caregiver witnessed": "देखभालकर्ता ने देखा", "Caregiver witnessed swallow": "देखभालकर्ता ने निगलते देखा", "Observer report; absorption not confirmed": "देखभालकर्ता की रिपोर्ट; अवशोषण की पुष्टि नहीं", "A caregiver must be present and directly observe the swallow. VITAL records the caregiver’s report only; it does not record video or confirm absorption.": "देखभालकर्ता को मौजूद रहकर दवा निगलते हुए सीधे देखना होगा। VITAL केवल देखभालकर्ता की रिपोर्ट दर्ज करता है; यह वीडियो रिकॉर्ड नहीं करता और अवशोषण की पुष्टि नहीं करता।", "Caregiver witness report": "देखभालकर्ता की प्रत्यक्ष-दर्शन रिपोर्ट", "Self-reported taken": "स्वयं द्वारा ली गई बताई गई", "Avg. visual match": "औसत दृश्य समानता", "Camera similarity only": "केवल कैमरे की समानता", "Taken reports": "ली गई दवा की रिपोर्ट", "DOSES REPORTED TAKEN": "ली गई बताई गई खुराक", "self-reports and caregiver witness reports": "स्वयं की और देखभालकर्ता की रिपोर्ट", "A camera match is only a visual check. Self-reports and caregiver witness reports are recorded separately; none proves absorption.": "कैमरे का मिलान केवल दृश्य जाँच है। स्वयं की रिपोर्ट और देखभालकर्ता की रिपोर्ट अलग दर्ज होती हैं; इनमें से कोई भी अवशोषण का प्रमाण नहीं है।",
    "A camera match fills a box automatically. It records a visual check, not proof that a dose was taken.": "कैमरे का मिलान एक बॉक्स अपने आप भरता है। यह केवल दृश्य जाँच दर्ज करता है, दवा लेने का प्रमाण नहीं।",
    "Last 7 days": "पिछले 7 दिन", "Scheduled dose": "निर्धारित खुराक", "Marked taken": "ली गई के रूप में दर्ज", "No check-in": "कोई चेक-इन नहीं",
    "Analyze a prescription to display its prescribed medicines and dose check-ins here.": "यहाँ निर्धारित दवाएँ और खुराक चेक-इन देखने के लिए नुस्खे का विश्लेषण करें।",
    "Upload doctor’s prescription page photos or text": "डॉक्टर के नुस्खे के पन्नों की फ़ोटो या टेक्स्ट अपलोड करें", "Medicine name": "दवा का नाम", "Strength / dose": "ताकत / खुराक", "Directions": "निर्देश", "Dose time": "खुराक का समय",
    "Human review required": "व्यक्ति द्वारा समीक्षा आवश्यक", "I checked every medicine, strength, direction, frequency, and duration against the original. I set any reminder time that was not explicitly written.": "मैंने हर दवा, ताकत, निर्देश, आवृत्ति और अवधि को मूल नुस्खे से जाँचा है। जो रिमाइंडर समय लिखा नहीं था, उसे मैंने स्वयं तय किया है।",
    "Medication reminders, SMS, and phone sync stay disabled until you confirm the schedule above.": "ऊपर की समय-सारणी की पुष्टि होने तक दवा रिमाइंडर, SMS और फ़ोन सिंक बंद रहेंगे।",
    "ONE-TIME SETUP": "एक बार का सेटअप", "Verify package text for each medicine": "हर दवा के पैकेट का टेक्स्ट जाँचें",
    "Open package photo": "पैकेट की फ़ोटो खोलें", "Find this exact medicine": "यह सटीक दवा खोजें", "Find this prescribed medicine": "यह निर्धारित दवा खोजें", "Nearby pharmacy": "नज़दीकी फ़ार्मेसी",
    "Visual similarity": "दिखावट की समानता", "Appearance check": "दिखावट की जाँच", "Capture reference photo": "संदर्भ फ़ोटो लें", "Clear reference profile": "दवा का संदर्भ हटाएँ",
    "Speak or type how you are feeling": "बताएं या लिखें कि आप कैसा महसूस कर रहे हैं", "Volume check": "आवाज़ की तीव्रता जाँचें", "Analyze text": "टेक्स्ट का विश्लेषण करें",
    "Pair the VITAL Android companion with this computer. Once connected, the camera monitor and watch sync can use the phone connection.": "VITAL Android साथी ऐप को इस कंप्यूटर से जोड़ें। जुड़ने के बाद कैमरा मॉनिटर और वॉच सिंक फ़ोन कनेक्शन का उपयोग कर सकते हैं।",
    "I confirm the patient has agreed to this camera session, and a person will monitor the screen.": "मैं पुष्टि करता/करती हूँ कि मरीज़ ने इस कैमरा सत्र की सहमति दी है और कोई व्यक्ति स्क्रीन पर निगरानी रखेगा।",
    "Keep the phone and computer on the same trusted Wi-Fi. Start VITAL with the phone-camera launcher, then enter a computer address and one-time code in the Android app.": "फ़ोन और कंप्यूटर को एक ही भरोसेमंद Wi-Fi पर रखें। फ़ोन-कैमरा लॉन्चर से VITAL शुरू करें, फिर Android ऐप में कंप्यूटर का पता और एक बार का कोड दर्ज करें।",
    "No local network address detected. Check that both devices are on Wi-Fi.": "स्थानीय नेटवर्क पता नहीं मिला। जाँचें कि दोनों डिवाइस Wi-Fi से जुड़े हैं।",
    "Waiting for phone camera": "फ़ोन कैमरे की प्रतीक्षा", "Possible-fall emergency-contact alerts": "संभावित गिरावट के आपातकालीन संपर्क अलर्ट", "Alert history and caregiver check-ins": "अलर्ट इतिहास और देखभालकर्ता चेक-इन",
    "No possible-fall alerts have been recorded yet.": "अभी तक संभावित गिरावट का कोई अलर्ट दर्ज नहीं है।", "Checked on patient": "मरीज़ की स्थिति जाँची", "False alarm": "गलत अलर्ट", "Unable to reach": "संपर्क नहीं हो पाया",
    "Need immediate help?": "क्या तुरंत मदद चाहिए?", "For an emergency, call local emergency services. The caregiver SMS alert is not an emergency-service call.": "आपातकाल में स्थानीय आपातकालीन सेवाओं को कॉल करें। देखभालकर्ता को भेजा SMS आपातकालीन सेवा को कॉल नहीं करता।",
    "A quick view of your recent monitoring results and care activity.": "हाल के निगरानी परिणामों और देखभाल गतिविधि का संक्षिप्त दृश्य।", "Risk score": "जोखिम स्कोर", "No monitoring events have been recorded yet.": "अभी तक निगरानी की कोई घटना दर्ज नहीं है।",
    "PHOTO-ASSISTED HEALTH CHECK": "फ़ोटो से स्वास्थ्य जाँच", "Document a visible health concern": "दिखने वाली स्वास्थ्य समस्या दर्ज करें",
    "Use a photo to record a visible change—such as a rash, wound, swelling, eye concern, or injury—and note how the person feels. This tool cannot diagnose or rule out a condition.": "चकत्ते, घाव, सूजन, आँख की समस्या या चोट जैसे बदलाव की फ़ोटो लें और व्यक्ति कैसा महसूस कर रहा है लिखें। यह टूल निदान या बीमारी को खारिज नहीं कर सकता।",
    "1 · PHOTO": "1 · फ़ोटो", "Add a photo": "फ़ोटो जोड़ें", "Use good lighting, keep the camera in focus, and avoid filters. Photograph only the area needed.": "अच्छी रोशनी में फ़ोकस के साथ फ़ोटो लें, फ़िल्टर न लगाएँ और केवल ज़रूरी हिस्सा फ़ोटो में रखें।",
    "Skin / rash / visible mark": "त्वचा / चकत्ता / दिखने वाला निशान", "Wound / cut / burn": "घाव / कट / जलना", "Eye / face concern": "आँख / चेहरे की समस्या", "Swelling / bruise / injury": "सूजन / नील / चोट", "Other visible health concern": "अन्य दिखने वाली स्वास्थ्य समस्या",
    "JPG, PNG, or WebP · private, local processing": "JPG, PNG या WebP · निजी, स्थानीय प्रसंस्करण", "Visible features": "दिखने वाली बातें", "2 · SYMPTOMS": "2 · लक्षण", "How is the person feeling?": "व्यक्ति कैसा महसूस कर रहा है?",
    "Select anything that applies. A photo alone cannot assess symptoms or urgency.": "लागू विकल्प चुनें। केवल फ़ोटो से लक्षण या तात्कालिकता का आकलन नहीं हो सकता।",
    "A photo cannot rule out a health problem": "फ़ोटो से स्वास्थ्य समस्या खारिज नहीं हो सकती", "Further guidance": "आगे की जानकारी",
    "YOUR WEEK": "आपका सप्ताह", "Activity overview": "गतिविधि का सारांश", "No activity recorded yet": "अभी कोई गतिविधि दर्ज नहीं है", "Search patient history": "मरीज़ का इतिहास खोजें", "Clear filters": "फ़िल्टर हटाएँ",
    "Larger text": "बड़ा टेक्स्ट", "Increase text size across VITAL for easier reading.": "आसानी से पढ़ने के लिए VITAL में टेक्स्ट बड़ा करें।", "Higher contrast": "ज़्यादा कंट्रास्ट", "Strengthen text and borders throughout the app.": "ऐप में टेक्स्ट और बॉर्डर को अधिक स्पष्ट करें।",
    "Download data backup": "डेटा बैकअप डाउनलोड करें", "Restore backup": "बैकअप पुनर्स्थापित करें", "Browser notifications": "ब्राउज़र सूचनाएँ", "Reminder lead time": "रिमाइंडर का समय",
    "5 minutes before": "5 मिनट पहले", "10 minutes before": "10 मिनट पहले", "Daily health slogan by SMS": "SMS से रोज़ाना स्वास्थ्य नारा", "Daily tip time": "रोज़ाना सुझाव का समय",
    "Preview health report": "स्वास्थ्य रिपोर्ट का पूर्वावलोकन", "Download PDF": "PDF डाउनलोड करें", "Save a readable report": "पढ़ने योग्य रिपोर्ट सहेजें", "Your PDF includes": "आपकी PDF में शामिल है",
    "Patient profile and recorded vital readings": "मरीज़ की प्रोफ़ाइल और दर्ज स्वास्थ्य माप", "Triage score, risk factors, protective signals, and recommendations": "जाँच स्कोर, जोखिम कारक, सुरक्षा संकेत और सुझाव", "Wearable context, appointments, and recent timeline events": "वियरेबल जानकारी, अपॉइंटमेंट और हाल की समयरेखा घटनाएँ",
    "Patient health report": "मरीज़ की स्वास्थ्य रिपोर्ट", "Patient details": "मरीज़ का विवरण", "Age": "उम्र", "Health context": "स्वास्थ्य संदर्भ", "Care contact": "देखभाल संपर्क", "Contact number": "संपर्क नंबर",
    "Latest symptom check": "नवीनतम लक्षण जाँच", "Symptoms entered": "दर्ज किए लक्षण", "Risk factors": "जोखिम कारक", "Oxygen saturation": "रक्त में ऑक्सीजन", "Pulse": "नाड़ी", "Temperature": "तापमान", "Systolic pressure": "सिस्टोलिक दबाव", "Breathing rate": "साँस लेने की दर",
    "Visit reminders": "मुलाक़ात रिमाइंडर", "Care activity": "देखभाल गतिविधि", "This summary contains the information saved in VITAL. Share it with a clinician as helpful.": "इस सारांश में VITAL में सहेजी जानकारी है। ज़रूरत हो तो इसे डॉक्टर के साथ साझा करें।",
    "No setup or follow-up items right now.": "अभी कोई सेटअप या फ़ॉलो-अप कार्य नहीं है।", "Open sync": "सिंक खोलें", "Phone not paired": "फ़ोन पेयर नहीं है",
    "Pair the Android app to sync phone data and enable phone camera monitoring.": "फ़ोन डेटा सिंक करने और कैमरा निगरानी चालू करने के लिए Android ऐप पेयर करें।",
    "Some wearable readings are unavailable": "कुछ वियरेबल माप उपलब्ध नहीं हैं", "Refresh sync": "सिंक रीफ़्रेश करें",
    "Pair and sync the watch in Fastrack Smart. Enable its Google Fit health-data sync if the option is available.": "Fastrack Smart में वॉच पेयर और सिंक करें। विकल्प उपलब्ध हो तो Google Fit स्वास्थ्य डेटा सिंक चालू करें।",
    "In Google Fit, open": "Google Fit में खोलें", "Profile → Settings → Health Connect": "प्रोफ़ाइल → सेटिंग्स → Health Connect", "and turn on": "और चालू करें", "Sync Fit with Health Connect": "Fit को Health Connect के साथ सिंक करें",
    "Confirm the watch readings are listed in Health Connect. Then, in the VITAL Android companion, tap": "पुष्टि करें कि वॉच के माप Health Connect में दिखते हैं। फिर VITAL Android ऐप में टैप करें",
    "Sync watch readings": "वॉच के माप सिंक करें", "and grant the requested read access.": "और माँगी गई पढ़ने की अनुमति दें।",
    "VITAL reads actual records Health Connect contains and uploads them over the paired local Wi-Fi connection. The phone checks about once a minute while the companion is open.": "VITAL, Health Connect में मौजूद वास्तविक रिकॉर्ड पढ़ता है और पेयर किए स्थानीय Wi-Fi से अपलोड करता है। ऐप खुला होने पर फ़ोन लगभग हर मिनट जाँच करता है।",
    "This dashboard refreshes every 15 seconds. Check the source and timestamp; the vendor app may take time to sync new readings.": "यह डैशबोर्ड हर 15 सेकंड में रीफ़्रेश होता है। स्रोत और समय देखें; विक्रेता ऐप को नए माप सिंक करने में समय लग सकता है।",
    "Only readings actually shared through the watch app, Google Fit, and Health Connect are shown. Unavailable measurements are hidden. This is periodic health-data sync, not a second-by-second sensor stream. Watch data is wellness context and is not a diagnosis.": "केवल वे माप दिखते हैं जो वॉच ऐप, Google Fit और Health Connect के ज़रिए साझा किए गए हैं। अनुपलब्ध माप छिपे रहते हैं। यह समय-समय पर स्वास्थ्य डेटा सिंक करता है, हर सेकंड सेंसर स्ट्रीम नहीं। वॉच डेटा स्वास्थ्य संदर्भ है, निदान नहीं।",
    "Connect the VITAL Android app to this computer to use phone camera monitoring and phone-based health sync.": "फ़ोन कैमरा निगरानी और फ़ोन से स्वास्थ्य डेटा सिंक करने के लिए VITAL Android ऐप को इस कंप्यूटर से जोड़ें।",
    "Check on the person if safe and review the camera alert history. VITAL cannot confirm a fall or call emergency services.": "सुरक्षित हो तो व्यक्ति की जाँच करें और कैमरा अलर्ट इतिहास देखें। VITAL गिरने की पुष्टि या आपातकालीन सेवाओं को कॉल नहीं कर सकता।",
    "Phone is not paired": "फ़ोन पेयर नहीं है", "Connect the VITAL Android app": "VITAL Android ऐप कनेक्ट करें",
    "Live horizontal-posture monitoring.": "लेटने की मुद्रा की लाइव निगरानी।",
    "The paired Android phone runs YOLO pose analysis locally and streams an annotated tracking frame here. A sustained horizontal torso posture starts a 4-second stillness check, including when the person was already lying down as monitoring began; brief noisy pose frames no longer reset the check. Standing up cancels it. After confirmation, VITAL attempts SMS to the saved emergency contacts. It never calls an ambulance automatically; a person must choose Call 112. This prototype can miss or falsely flag falls.": "पेयर किया गया Android फ़ोन YOLO मुद्रा विश्लेषण स्थानीय रूप से चलाता है और चिह्नित ट्रैकिंग फ़्रेम यहाँ भेजता है। धड़ की क्षैतिज मुद्रा लगातार रहने पर 4 सेकंड की स्थिरता जाँच शुरू होती है, चाहे निगरानी शुरू होने पर व्यक्ति पहले से लेटा हो; कुछ क्षणों के शोर वाले फ़्रेम जाँच रीसेट नहीं करते। खड़े होने पर जाँच रुक जाती है। पुष्टि के बाद VITAL सहेजे गए आपातकालीन संपर्कों को SMS भेजने की कोशिश करता है। यह एम्बुलेंस को अपने आप कॉल नहीं करता; किसी व्यक्ति को 112 चुनना होगा। यह प्रोटोटाइप गिरावट पहचानने से चूक सकता है या गलत अलर्ट दे सकता है।",
    "Enable automatic possible-fall SMS alerts to these emergency contacts": "संभावित गिरावट पर इन आपातकालीन संपर्कों को SMS अलर्ट अपने आप भेजें",
    "The patient agrees to immediate automatic caretaker SMS attempts when the prototype flags a possible fall. False alerts are possible.": "प्रोटोटाइप द्वारा संभावित गिरावट का अलर्ट देने पर देखभालकर्ता को तुरंत SMS भेजने की कोशिश के लिए मरीज़ सहमत हैं। गलत अलर्ट संभव हैं।",
    "Updates from the paired phone appear here. A check-in is saved to this VITAL account; it does not confirm SMS delivery.": "पेयर किए फ़ोन के अपडेट यहाँ दिखते हैं। चेक-इन इस VITAL खाते में सहेजा जाता है; इससे SMS पहुँचने की पुष्टि नहीं होती।",
    "Message caretaker": "देखभालकर्ता को संदेश भेजें", "Text caretaker": "देखभालकर्ता को SMS भेजें", "Add caretaker contact": "देखभालकर्ता का संपर्क जोड़ें",
    "This section keeps a local record of emergency activity. It does not contact the hospital or send a message.": "यह अनुभाग आपातकालीन गतिविधि का स्थानीय रिकॉर्ड रखता है। यह अस्पताल से संपर्क या संदेश नहीं भेजता।",
    "This saves a reminder in VITAL; it does not book an appointment with the hospital. Call the hospital to confirm availability.": "इससे VITAL में रिमाइंडर सहेजता है; अस्पताल में अपॉइंटमेंट बुक नहीं होता। उपलब्धता की पुष्टि के लिए अस्पताल को कॉल करें।",
    "Appointment saved": "अपॉइंटमेंट सहेजा गया", "You have no saved visit reminders yet.": "अभी तक मुलाक़ात का कोई रिमाइंडर सहेजा नहीं है।",
    "Android submission or provider acceptance does not confirm handset delivery. Carrier charges may apply. This reminder does not book a hospital appointment.": "Android द्वारा भेजना या सेवा प्रदाता द्वारा स्वीकारना फ़ोन पर पहुँचने की पुष्टि नहीं है। नेटवर्क शुल्क लग सकते हैं। यह रिमाइंडर अस्पताल अपॉइंटमेंट बुक नहीं करता।",
    "SMS history records delivery metadata only. A message queued for Android SMS is held on the VITAL computer for up to 24 hours, then its body and number are removed if unsent. Phone submission does not confirm carrier delivery.": "SMS इतिहास केवल डिलीवरी की जानकारी रखता है। Android SMS कतार का संदेश VITAL कंप्यूटर पर 24 घंटे तक रहता है; न भेजे जाने पर उसका टेक्स्ट और नंबर हट जाते हैं। फ़ोन से भेजने का अर्थ नेटवर्क पर पहुँचना नहीं है।",
    "Phone reminder delivery": "फ़ोन रिमाइंडर डिलीवरी", "Uses this device’s local time zone. SMS is sent only when you enable the daily tip above.": "इस डिवाइस का स्थानीय समय क्षेत्र इस्तेमाल होता है। SMS तभी भेजा जाता है जब आप ऊपर रोज़ाना सुझाव चालू करें।",
    "Text the primary caretaker at dose time": "खुराक के समय मुख्य देखभालकर्ता को SMS भेजें", "SMS me about scheduled medicines": "निर्धारित दवाओं के बारे में मुझे SMS भेजें", "Emergency cancellation countdown": "आपातकालीन रद्द करने की उलटी गिनती",
    "5 seconds": "5 सेकंड", "10 seconds": "10 सेकंड", "15 seconds": "15 सेकंड",
    "Your profile and preferences are saved in this browser. Emergency alerts are not sent automatically; use the phone or message controls to contact someone.": "आपकी प्रोफ़ाइल और प्राथमिकताएँ इस ब्राउज़र में सहेजी जाती हैं। आपातकालीन अलर्ट अपने आप नहीं भेजे जाते; किसी से संपर्क करने के लिए फ़ोन या संदेश विकल्प इस्तेमाल करें।"
  },
  kn: {
    "Skip to main content": "ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ತೆರಳಿ", Language: "ಭಾಷೆ",
    "Proactive Health Guardian": "ಸಕ್ರಿಯ ಆರೋಗ್ಯ ಸಹಾಯಕ",
    "My health": "ನನ್ನ ಆರೋಗ್ಯ", Monitoring: "ಮೇಲ್ವಿಚಾರಣೆ", History: "ಇತಿಹಾಸ", Care: "ಆರೈಕೆ", Settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    Home: "ಮುಖಪುಟ", "Symptoms & vitals": "ಲಕ್ಷಣಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಮಾಪನಗಳು", Medications: "ಔಷಧಿಗಳು", "Photo health check": "ಫೋಟೋ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ",
    "Connect phone": "ಫೋನ್ ಸಂಪರ್ಕಿಸಿ", "Camera check": "ಕ್ಯಾಮೆರಾ ಪರಿಶೀಲನೆ", "Voice check": "ಧ್ವನಿ ಪರಿಶೀಲನೆ", Wearables: "ಧರಿಸಬಹುದಾದ ಸಾಧನಗಳು",
    "Health summary": "ಆರೋಗ್ಯ ಸಾರಾಂಶ", "Health report": "ಆರೋಗ್ಯ ವರದಿ", "Health timeline": "ಆರೋಗ್ಯ ಕಾಲರೇಖೆ",
    "Emergency help": "ತುರ್ತು ಸಹಾಯ", Appointments: "ಭೇಟಿಗಳು", "Health overview": "ಆರೋಗ್ಯ ಅವಲೋಕನ",
    "A clear view of recent health activity, care plans, and connected sources.": "ಇತ್ತೀಚಿನ ಆರೋಗ್ಯ ಚಟುವಟಿಕೆ, ಆರೈಕೆ ಯೋಜನೆಗಳು ಮತ್ತು ಸಂಪರ್ಕಿತ ಮೂಲಗಳ ಸಾರಾಂಶ.",
    "Record symptoms and measurements, then review the screening result.": "ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳನ್ನು ದಾಖಲಿಸಿ, ನಂತರ ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶವನ್ನು ನೋಡಿ.",
    "Review prescriptions, dose history, and reminder preferences.": "ಔಷಧ ಚೀಟಿ, ಡೋಸ್ ಇತಿಹಾಸ ಮತ್ತು ಜ್ಞಾಪನೆಗಳ ಆಯ್ಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Review visible features in a health photo and consider safe next steps; this is not a diagnosis.": "ಆರೋಗ್ಯ ಫೋಟೋದಲ್ಲಿರುವ ಗೋಚರ ಲಕ್ಷಣಗಳನ್ನು ನೋಡಿ ಸುರಕ್ಷಿತ ಮುಂದಿನ ಕ್ರಮಗಳನ್ನು ಪರಿಗಣಿಸಿ. ಇದು ರೋಗನಿರ್ಣಯವಲ್ಲ.",
    "Review phone camera monitoring and posture check controls.": "ಫೋನ್ ಕ್ಯಾಮೆರಾ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ದೇಹದ ಭಂಗಿ ಪರಿಶೀಲನೆ ನಿಯಂತ್ರಣಗಳನ್ನು ನೋಡಿ.",
    "Pair the VITAL Android app with this dashboard over your trusted network.": "ನಂಬಿಕೆಯ ನೆಟ್‌ವರ್ಕ್ ಮೂಲಕ VITAL Android ಆ್ಯಪ್ ಅನ್ನು ಈ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಜೋಡಿಸಿ.",
    "Record a voice check-in and review the resulting wellness context.": "ಧ್ವನಿ ಚೆಕ್-ಇನ್ ದಾಖಲಿಸಿ ಮತ್ತು ಅದರ ಆರೋಗ್ಯ ಸಂದರ್ಭವನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Review emergency options and configured caregiver contacts.": "ತುರ್ತು ಆಯ್ಕೆಗಳು ಮತ್ತು ಆರೈಕೆದಾರರ ಸಂಪರ್ಕಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Keep planned visits and appointment details together.": "ಯೋಜಿತ ಭೇಟಿಗಳು ಮತ್ತು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿವರಗಳನ್ನು ಒಟ್ಟಿಗೆ ಇರಿಸಿ.",
    "Review readings shared by connected health and wearable sources.": "ಸಂಪರ್ಕಿತ ಆರೋಗ್ಯ ಮತ್ತು ಧರಿಸಬಹುದಾದ ಸಾಧನಗಳಿಂದ ಹಂಚಲಾದ ಮಾಪನಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Explore recent readings and health activity over time.": "ಕಾಲಕ್ರಮದಲ್ಲಿ ಇತ್ತೀಚಿನ ಮಾಪನಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಚಟುವಟಿಕೆಯನ್ನು ನೋಡಿ.",
    "See recent care, monitoring, and medication events in order.": "ಇತ್ತೀಚಿನ ಆರೈಕೆ, ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಔಷಧಿ ಘಟನೆಗಳನ್ನು ಕ್ರಮವಾಗಿ ನೋಡಿ.",
    "Prepare a shareable summary of the health information in VITAL.": "VITAL ನಲ್ಲಿರುವ ಆರೋಗ್ಯ ಮಾಹಿತಿಯ ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ ಸಾರಾಂಶವನ್ನು ಸಿದ್ಧಪಡಿಸಿ.",
    "Manage app preferences, reminders, and connected services.": "ಆ್ಯಪ್ ಆದ್ಯತೆಗಳು, ಜ್ಞಾಪನೆಗಳು ಮತ್ತು ಸಂಪರ್ಕಿತ ಸೇವೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    "Backend online": "ಬ್ಯಾಕೆಂಡ್ ಚಾಲ್ತಿಯಲ್ಲಿದೆ", "Backend offline": "ಬ್ಯಾಕೆಂಡ್ ಸಂಪರ್ಕವಿಲ್ಲ", "Connecting to backend": "ಬ್ಯಾಕೆಂಡ್‌ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ",
    "Sign out": "ಸೈನ್ ಔಟ್", "Enter symptoms & readings": "ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳನ್ನು ನಮೂದಿಸಿ", "Recheck symptoms & readings": "ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳನ್ನು ಮರುಪರಿಶೀಲಿಸಿ",
    "Possible fall detected": "ಬೀಳುವ ಸಾಧ್ಯತೆ ಪತ್ತೆಯಾಗಿದೆ", "Check the person if safe. VITAL has not called emergency services.": "ಸುರಕ್ಷಿತವಾಗಿದ್ದರೆ ವ್ಯಕ್ತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ. VITAL ತುರ್ತು ಸೇವೆಗಳಿಗೆ ಕರೆ ಮಾಡಿಲ್ಲ.",
    "View camera": "ಕ್ಯಾಮೆರಾ ನೋಡಿ", "Phone not connected": "ಫೋನ್ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ", "Maybe later": "ನಂತರ ನೋಡೋಣ",
    "Welcome to VITAL": "VITAL ಗೆ ಸ್ವಾಗತ", "A snapshot of information saved on this device and synced from connected sources.": "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಿದ ಮತ್ತು ಸಂಪರ್ಕಿತ ಮೂಲಗಳಿಂದ ಸಿಂಕ್ ಮಾಡಿದ ಮಾಹಿತಿಯ ನೋಟ.",
    "Patient overview": "ರೋಗಿಯ ಅವಲೋಕನ", "Symptoms, vitals & screening": "ಲಕ್ಷಣಗಳು, ಮಾಪನಗಳು ಮತ್ತು ಪರಿಶೀಲನೆ", "Medication schedule": "ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ",
    "Wearable context": "ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಸಂದರ್ಭ", "Patient timeline": "ರೋಗಿಯ ಕಾಲರೇಖೆ", "Plan a visit": "ಭೇಟಿ ಯೋಜಿಸಿ",
    "Preview the patient summary and save it as a PDF.": "ರೋಗಿಯ ಸಾರಾಂಶವನ್ನು ಪೂರ್ವವೀಕ್ಷಿಸಿ PDF ಆಗಿ ಉಳಿಸಿ.",
    "Ask VITAL": "VITAL ಅನ್ನು ಕೇಳಿ", "Close": "ಮುಚ್ಚಿ", "here to help": "ಸಹಾಯಕ್ಕೆ ಸಿದ್ಧ",
    "Hi! 👋 I’m VITAL’s health assistant. What would you like help with?": "ನಮಸ್ಕಾರ! 👋 ನಾನು VITAL ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?",
    "Explain my triage result": "ನನ್ನ ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶವನ್ನು ವಿವರಿಸಿ", "Show my latest readings": "ನನ್ನ ಇತ್ತೀಚಿನ ಮಾಪನಗಳನ್ನು ತೋರಿಸಿ",
    "Help me prepare for a doctor visit": "ವೈದ್ಯರ ಭೇಟಿಗೆ ಸಿದ್ಧರಾಗಲು ಸಹಾಯ ಮಾಡಿ", "What can I do about a fever?": "ಜ್ವರ ಬಂದರೆ ಏನು ಮಾಡಬಹುದು?",
    "Try asking": "ಇದನ್ನು ಕೇಳಿ", "You can ask next": "ಮುಂದೆ ಇದನ್ನು ಕೇಳಬಹುದು", "Preparing an answer…": "ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…",
    "Ask a health question": "ಆರೋಗ್ಯ ಪ್ರಶ್ನೆ ಕೇಳಿ", "Ask a health question…": "ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ…",
    "Send question": "ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ", "Stop voice input": "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ನಿಲ್ಲಿಸಿ", "Ask by voice": "ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ",
    "Listen": "ಕೇಳಿ", "Turn off spoken replies": "ಮಾತಿನ ಉತ್ತರಗಳನ್ನು ಆಫ್ ಮಾಡಿ", "Turn on spoken replies": "ಮಾತಿನ ಉತ್ತರಗಳನ್ನು ಆನ್ ಮಾಡಿ",
    "General information only. Not a diagnosis or prescription. For urgent symptoms, call emergency services.": "ಇದು ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ; ರೋಗನಿರ್ಣಯ ಅಥವಾ ಔಷಧ ಚೀಟಿ ಅಲ್ಲ. ತುರ್ತು ಲಕ್ಷಣಗಳಿದ್ದರೆ ತುರ್ತು ಸೇವೆಗಳಿಗೆ ಕರೆ ಮಾಡಿ.",
    "Privacy first": "ಗೌಪ್ಯತೆಗೆ ಆದ್ಯತೆ", "Your health, all in one place": "ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ", "PRIVATE HEALTH SPACE": "ಖಾಸಗಿ ಆರೋಗ್ಯ ಸ್ಥಳ",
    "Create your account": "ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ", "Welcome back": "ಮರಳಿ ಸ್ವಾಗತ",
    "Register once to keep your health activity under your account on this device.": "ಈ ಸಾಧನದಲ್ಲಿ ನಿಮ್ಮ ಆರೋಗ್ಯ ಚಟುವಟಿಕೆಯನ್ನು ಖಾತೆಯಡಿ ಉಳಿಸಲು ಒಮ್ಮೆ ನೋಂದಾಯಿಸಿ.",
    "Sign in once. VITAL will remember this device for your next visit.": "ಒಮ್ಮೆ ಸೈನ್ ಇನ್ ಮಾಡಿ. ಮುಂದಿನ ಬಾರಿ VITAL ಈ ಸಾಧನವನ್ನು ನೆನಪಿಡುತ್ತದೆ.",
    "Email address": "ಇಮೇಲ್ ವಿಳಾಸ", Password: "ಪಾಸ್‌ವರ್ಡ್", "At least 10 characters": "ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳು", "Enter your password": "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
    Hide: "ಮರೆಮಾಡಿ", Show: "ತೋರಿಸಿ", "Please wait…": "ದಯವಿಟ್ಟು ಕಾಯಿರಿ…", "Create secure account": "ಸುರಕ್ಷಿತ ಖಾತೆ ರಚಿಸಿ",
    "Sign in": "ಸೈನ್ ಇನ್", "Already registered?": "ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?", "First time using VITAL?": "VITAL ಅನ್ನು ಮೊದಲ ಬಾರಿಗೆ ಬಳಸುತ್ತಿದ್ದೀರಾ?",
    "Create an account": "ಖಾತೆ ರಚಿಸಿ", "This local demo remembers your sign-in on this browser for up to one year. Use a private device only if it is yours.": "ಈ ಸ್ಥಳೀಯ ಡೆಮೊ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಸೈನ್-ಇನ್ ಅನ್ನು ಒಂದು ವರ್ಷದವರೆಗೆ ನೆನಪಿಡುತ್ತದೆ. ನಿಮ್ಮದೇ ಖಾಸಗಿ ಸಾಧನದಲ್ಲಿ ಮಾತ್ರ ಬಳಸಿ.",
    "Wearable readings": "ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಮಾಪನಗಳು", "Optional wellness context": "ಐಚ್ಛಿಕ ಆರೋಗ್ಯ ಸಂದರ್ಭ", "No data": "ಡೇಟಾ ಇಲ್ಲ",
    "No successful sync yet": "ಇನ್ನೂ ಯಶಸ್ವಿ ಸಿಂಕ್ ಆಗಿಲ್ಲ", "Heart rate": "ಹೃದಯ ಬಡಿತ", "Resting HR": "ವಿಶ್ರಾಂತಿ ಹೃದಯ ಬಡಿತ", "Steps": "ಹೆಜ್ಜೆಗಳು",
    "Active calories": "ಸಕ್ರಿಯ ಕ್ಯಾಲೊರಿಗಳು", "Total calories": "ಒಟ್ಟು ಕ್ಯಾಲೊರಿಗಳು", Distance: "ದೂರ", Sleep: "ನಿದ್ರೆ", "SpO₂": "SpO₂",
    "Refresh watch readings": "ವಾಚ್ ಮಾಪನಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ", "Sync a wearable": "ಧರಿಸಬಹುದಾದ ಸಾಧನ ಸಿಂಕ್ ಮಾಡಿ",
    "Connect through your phone's health app": "ನಿಮ್ಮ ಫೋನ್‌ನ ಆರೋಗ್ಯ ಆ್ಯಪ್ ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ", "Recent reading history": "ಇತ್ತೀಚಿನ ಮಾಪನಗಳ ಇತಿಹಾಸ",
    "Edit profile": "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ", "Save changes": "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ", Cancel: "ರದ್ದುಮಾಡಿ",
    "Privacy and data": "ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ", "Accessibility": "ಪ್ರವೇಶಸಾಧ್ಯತೆ", "Medication reminders": "ಔಷಧಿ ಜ್ಞಾಪನೆಗಳು",
    "Daily check-in": "ದೈನಂದಿನ ಚೆಕ್-ಇನ್", "How are you feeling?": "ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?", Good: "ಚೆನ್ನಾಗಿದೆ", Okay: "ಪರವಾಗಿಲ್ಲ", "Need support": "ಸಹಾಯ ಬೇಕು",
    "Start camera": "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ", "Stop camera": "ಕ್ಯಾಮೆರಾ ನಿಲ್ಲಿಸಿ", "Analyze frame": "ಫ್ರೇಮ್ ವಿಶ್ಲೇಷಿಸಿ",
    "Take or choose a photo": "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ", "Review visible features": "ಕಾಣುವ ಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ", "Continue without photo": "ಫೋಟೋ ಇಲ್ಲದೆ ಮುಂದುವರಿಯಿರಿ",
    "Prescription photos are processed by the local Ollama model on this computer.": "ಔಷಧ ಚೀಟಿಯ ಫೋಟೋಗಳನ್ನು ಈ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿರುವ ಸ್ಥಳೀಯ Ollama ಮಾದರಿ ಸಂಸ್ಕರಿಸುತ್ತದೆ.",
    "Pair with VITAL": "VITAL ಜೊತೆ ಜೋಡಿಸಿ", "Call 112": "112 ಗೆ ಕರೆ ಮಾಡಿ", "I took this dose": "ಈ ಡೋಸ್ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ", "Dose missed": "ಡೋಸ್ ತಪ್ಪಿದೆ", "Retry needed": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    "Local photo processing": "ಸ್ಥಳೀಯ ಫೋಟೋ ಸಂಸ್ಕರಣೆ", "Readings are wellness context only; not a diagnosis.": "ಮಾಪನಗಳು ಆರೋಗ್ಯ ಸಂದರ್ಭಕ್ಕಾಗಿ ಮಾತ್ರ; ರೋಗನಿರ್ಣಯವಲ್ಲ.",
    "Personal health, protected": "ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಸುರಕ್ಷಿತವಾಗಿದೆ",
    "Use 10 or more characters. VITAL stores a salted password hash, never the original password.": "10 ಅಥವಾ ಹೆಚ್ಚು ಅಕ್ಷರಗಳನ್ನು ಬಳಸಿ. VITAL ಮೂಲ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಉಳಿಸದೆ ಸುರಕ್ಷಿತ ಹ್ಯಾಶ್ ಅನ್ನು ಮಾತ್ರ ಸಂಗ್ರಹಿಸುತ್ತದೆ.",
    "YOUR HEALTH OVERVIEW": "ನಿಮ್ಮ ಆರೋಗ್ಯದ ಅವಲೋಕನ", "Take a quick tour": "ಸಂಕ್ಷಿಪ್ತ ಪರಿಚಯ ನೋಡಿ",
    "Latest screening": "ಇತ್ತೀಚಿನ ಪರಿಶೀಲನೆ", "Medication check-ins": "ಔಷಧಿ ಚೆಕ್-ಇನ್‌ಗಳು", "Planned visits": "ಯೋಜಿತ ಭೇಟಿಗಳು", "Wearable data": "ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಡೇಟಾ",
    "Health information supports your care and does not replace a clinician.": "ಆರೋಗ್ಯ ಮಾಹಿತಿ ಆರೈಕೆಗೆ ಸಹಾಯಕ; ಇದು ವೈದ್ಯರ ಬದಲಿಯಲ್ಲ.",
    "Camera monitoring is off": "ಕ್ಯಾಮೆರಾ ಮೇಲ್ವಿಚಾರಣೆ ಆಫ್ ಆಗಿದೆ", "The phone is paired, but no active camera session is sending frames.": "ಫೋನ್ ಜೋಡಿಸಲಾಗಿದೆ, ಆದರೆ ಸಕ್ರಿಯ ಕ್ಯಾಮೆರಾ ಸೆಷನ್ ಫ್ರೇಮ್‌ಗಳನ್ನು ಕಳುಹಿಸುತ್ತಿಲ್ಲ.",
    "Camera feed is stale": "ಕ್ಯಾಮೆರಾ ಫೀಡ್ ಹಳೆಯದಾಗಿದೆ", "Check camera": "ಕ್ಯಾಮೆರಾ ಪರಿಶೀಲಿಸಿ", "Reconnect feed": "ಫೀಡ್ ಮರುಸಂಪರ್ಕಿಸಿ",
    "The phone session is active, but VITAL has not received a recent frame. Reopen the phone camera monitor and check Wi-Fi.": "ಫೋನ್ ಸೆಷನ್ ಸಕ್ರಿಯವಾಗಿದೆ, ಆದರೆ VITAL ಗೆ ಇತ್ತೀಚಿನ ಫ್ರೇಮ್ ಬಂದಿಲ್ಲ. ಫೋನ್ ಕ್ಯಾಮೆರಾ ಮಾನಿಟರ್ ಮತ್ತೆ ತೆರೆಯಿರಿ ಮತ್ತು Wi-Fi ಪರಿಶೀಲಿಸಿ.",
    "No wearable readings yet": "ಇನ್ನೂ ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಮಾಪನಗಳಿಲ್ಲ", "Wearable sync is optional. Connect a source to show readings when available.": "ಸಾಧನದ ಸಿಂಕ್ ಐಚ್ಛಿಕ. ಮಾಪನಗಳನ್ನು ತೋರಿಸಲು ಲಭ್ಯವಿರುವ ಮೂಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "Some wearable readings are unavailable": "ಕೆಲವು ಸಾಧನದ ಮಾಪನಗಳು ಲಭ್ಯವಿಲ್ಲ", "Review data": "ಡೇಟಾ ಪರಿಶೀಲಿಸಿ", "Wearable data may be out of date": "ಸಾಧನದ ಡೇಟಾ ಹಳೆಯದಾಗಿರಬಹುದು",
    "The latest measurement is over 24 hours old. Refresh the watch sync before using these values as current context.": "ಇತ್ತೀಚಿನ ಮಾಪನ 24 ಗಂಟೆಗಿಂತ ಹಳೆಯದು. ಪ್ರಸ್ತುತ ಮಾಹಿತಿಯಾಗಿ ಬಳಸುವ ಮೊದಲು ವಾಚ್ ಸಿಂಕ್ ರಿಫ್ರೆಶ್ ಮಾಡಿ.",
    "No screening result recorded": "ಯಾವುದೇ ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶ ದಾಖಲಾಗಿಲ್ಲ", "Enter symptoms and readings if you want VITAL to prepare a screening estimate.": "VITAL ಪರಿಶೀಲನಾ ಅಂದಾಜು ನೀಡಲು ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳನ್ನು ನಮೂದಿಸಿ.",
    "Prescription review is unfinished": "ಔಷಧ ಚೀಟಿ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ", "Review schedule": "ವೇಳಾಪಟ್ಟಿ ಪರಿಶೀಲಿಸಿ",
    "Confirm each medicine, dose, direction, and schedule against the doctor's original before enabling reminders.": "ಜ್ಞಾಪನೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುವ ಮೊದಲು ಪ್ರತಿ ಔಷಧಿ, ಡೋಸ್, ಸೂಚನೆ ಮತ್ತು ವೇಳಾಪಟ್ಟಿಯನ್ನು ಮೂಲ ವೈದ್ಯರ ಚೀಟಿಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.",
    "Patient": "ರೋಗಿ", "Location": "ಸ್ಥಳ", "Caretaker": "ಆರೈಕೆದಾರ", "Latest source": "ಇತ್ತೀಚಿನ ಮೂಲ",
    "Wellness context only": "ಆರೋಗ್ಯ ಸಂದರ್ಭಕ್ಕಾಗಿ ಮಾತ್ರ", "Does not change triage": "ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶ ಬದಲಾಯಿಸುವುದಿಲ್ಲ", "Open timeline": "ಕಾಲರೇಖೆ ತೆರೆಯಿರಿ",
    "No monitoring activity yet. Start with a symptom and vital check.": "ಇನ್ನೂ ಮೇಲ್ವಿಚಾರಣಾ ಚಟುವಟಿಕೆ ಇಲ್ಲ. ಲಕ್ಷಣ ಮತ್ತು ಆರೋಗ್ಯ ಮಾಪನ ಪರಿಶೀಲನೆಯಿಂದ ಪ್ರಾರಂಭಿಸಿ.",
    "01 / INPUT": "01 / ಮಾಹಿತಿ", "Describe what is happening, then enter the readings you actually have. Missing or unavailable data should lead to human review — not a made-up score.": "ಏನಾಗುತ್ತಿದೆ ಎಂದು ವಿವರಿಸಿ ಮತ್ತು ನಿಜವಾಗಿ ಲಭ್ಯವಿರುವ ಮಾಪನಗಳನ್ನು ನಮೂದಿಸಿ. ಲಭ್ಯವಿಲ್ಲದ ಮಾಹಿತಿಗೆ ಮಾನವ ಪರಿಶೀಲನೆ ಬೇಕು—ಕಲ್ಪಿತ ಅಂಕವಲ್ಲ.",
    "What is happening right now?": "ಈಗ ಏನಾಗುತ್ತಿದೆ?", "Reading snapshot": "ಮಾಪನಗಳ ನೋಟ", "Visual scales only · not normal ranges or a risk assessment": "ದೃಶ್ಯ ಮಾಪಕಗಳು ಮಾತ್ರ · ಸಾಮಾನ್ಯ ಮಿತಿಗಳಾಗಲಿ ಅಪಾಯದ ಮೌಲ್ಯಮಾಪನವಾಗಲಿ ಅಲ್ಲ",
    "Choose an example or enter your own symptoms above": "ಉದಾಹರಣೆ ಆರಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಮೇಲೆ ನಮೂದಿಸಿ",
    "This check cannot diagnose a condition or confirm that you are safe. For severe symptoms, contact emergency services.": "ಈ ಪರಿಶೀಲನೆ ರೋಗನಿರ್ಣಯ ಮಾಡುವುದಿಲ್ಲ ಅಥವಾ ನೀವು ಸುರಕ್ಷಿತರೆಂದು ಖಚಿತಪಡಿಸುವುದಿಲ್ಲ. ತೀವ್ರ ಲಕ್ಷಣಗಳಿದ್ದರೆ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "MORE DETAIL NEEDED": "ಹೆಚ್ಚಿನ ವಿವರ ಅಗತ್ಯ", "Tell us more about the pain": "ನೋವಿನ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ತಿಳಿಸಿ", "VITAL cannot assess unspecified pain or rule out a serious problem.": "ನಿರ್ದಿಷ್ಟಪಡಿಸದ ನೋವನ್ನು VITAL ಮೌಲ್ಯಮಾಪನ ಮಾಡಲು ಅಥವಾ ಗಂಭೀರ ಸಮಸ್ಯೆಯನ್ನು ತಳ್ಳಿಹಾಕಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Why did VITAL give this result?": "VITAL ಈ ಫಲಿತಾಂಶ ನೀಡಿದ್ದು ಏಕೆ?", "Estimated result breakdown": "ಅಂದಾಜು ಫಲಿತಾಂಶದ ವಿವರ", "How this result was estimated": "ಈ ಫಲಿತಾಂಶವನ್ನು ಹೇಗೆ ಅಂದಾಜಿಸಲಾಗಿದೆ",
    "What raised concern": "ಕಳವಳ ಉಂಟುಮಾಡಿದ ಅಂಶಗಳು", "From the symptoms or readings you entered.": "ನೀವು ನಮೂದಿಸಿದ ಲಕ್ಷಣಗಳು ಅಥವಾ ಮಾಪನಗಳಿಂದ.", "Reassuring information": "ಧೈರ್ಯ ನೀಡುವ ಮಾಹಿತಿ", "Suggested next steps": "ಸೂಚಿಸಿದ ಮುಂದಿನ ಕ್ರಮಗಳು",
    "Retry care check": "ಆರೈಕೆ ಪರಿಶೀಲನೆ ಮರುಪ್ರಯತ್ನಿಸಿ", "Call 112 in India": "ಭಾರತದಲ್ಲಿ 112 ಗೆ ಕರೆ ಮಾಡಿ",
    "No dose check-ins": "ಔಷಧಿ ಚೆಕ್-ಇನ್‌ಗಳಿಲ್ಲ", "Medication activity": "ಔಷಧಿ ಚಟುವಟಿಕೆ", "Current verification distribution": "ಪ್ರಸ್ತುತ ಪರಿಶೀಲನೆಯ ವಿವರ", "Avg. confidence": "ಸರಾಸರಿ ವಿಶ್ವಾಸ ಮಟ್ಟ", "Verification confidence": "ಪರಿಶೀಲನಾ ವಿಶ್ವಾಸ ಮಟ್ಟ",
    "Self-reported": "ಸ್ವತಃ ವರದಿ ಮಾಡಿದ", "Witnessed": "ಆರೈಕೆದಾರರು ನೇರವಾಗಿ ನೋಡಿದ್ದಾರೆ", "Caregiver witnessed": "ಆರೈಕೆದಾರರು ನೋಡಿದ್ದಾರೆ", "Caregiver witnessed swallow": "ಆರೈಕೆದಾರರು ನುಂಗುವುದನ್ನು ನೋಡಿದ್ದಾರೆ", "Observer report; absorption not confirmed": "ವೀಕ್ಷಕರ ವರದಿ; ದೇಹದ ಹೀರಿಕೊಳ್ಳುವಿಕೆ ದೃಢಪಟ್ಟಿಲ್ಲ", "A caregiver must be present and directly observe the swallow. VITAL records the caregiver’s report only; it does not record video or confirm absorption.": "ಆರೈಕೆದಾರರು ಹಾಜರಿದ್ದು ಔಷಧಿ ನುಂಗುವುದನ್ನು ನೇರವಾಗಿ ಗಮನಿಸಬೇಕು. VITAL ಆರೈಕೆದಾರರ ವರದಿಯನ್ನು ಮಾತ್ರ ದಾಖಲಿಸುತ್ತದೆ; ವೀಡಿಯೊ ದಾಖಲಿಸುವುದಿಲ್ಲ ಅಥವಾ ದೇಹದ ಹೀರಿಕೊಳ್ಳುವಿಕೆಯನ್ನು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.", "Caregiver witness report": "ಆರೈಕೆದಾರರ ನೇರ ವೀಕ್ಷಣೆಯ ವರದಿ", "Self-reported taken": "ಸ್ವತಃ ತೆಗೆದುಕೊಂಡಿರುವುದಾಗಿ ವರದಿ", "Avg. visual match": "ಸರಾಸರಿ ದೃಶ್ಯ ಹೊಂದಾಣಿಕೆ", "Camera similarity only": "ಕ್ಯಾಮೆರಾದ ದೃಶ್ಯ ಹೊಂದಾಣಿಕೆ ಮಾತ್ರ", "Taken reports": "ತೆಗೆದುಕೊಂಡ ವರದಿಗಳು", "DOSES REPORTED TAKEN": "ತೆಗೆದುಕೊಂಡಿರುವುದಾಗಿ ವರದಿಯಾದ ಡೋಸ್‌ಗಳು", "self-reports and caregiver witness reports": "ಸ್ವಯಂ ಮತ್ತು ಆರೈಕೆದಾರರ ವೀಕ್ಷಣಾ ವರದಿಗಳು", "A camera match is only a visual check. Self-reports and caregiver witness reports are recorded separately; none proves absorption.": "ಕ್ಯಾಮೆರಾ ಹೊಂದಾಣಿಕೆ ಕೇವಲ ದೃಶ್ಯ ಪರಿಶೀಲನೆ. ಸ್ವಯಂ ವರದಿ ಮತ್ತು ಆರೈಕೆದಾರರ ವೀಕ್ಷಣಾ ವರದಿಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ದಾಖಲಿಸಲಾಗುತ್ತದೆ; ಯಾವುದೂ ಔಷಧಿ ದೇಹದಲ್ಲಿ ಹೀರಿಕೊಳ್ಳಲ್ಪಟ್ಟಿದೆ ಎಂಬುದನ್ನು ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ.",
    "A camera match fills a box automatically. It records a visual check, not proof that a dose was taken.": "ಕ್ಯಾಮೆರಾ ಹೊಂದಾಣಿಕೆ ಬಾಕ್ಸ್ ಅನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತುಂಬುತ್ತದೆ. ಇದು ದೃಶ್ಯ ಪರಿಶೀಲನೆ ಮಾತ್ರ; ಡೋಸ್ ತೆಗೆದುಕೊಂಡ ಪುರಾವೆಯಲ್ಲ.",
    "Last 7 days": "ಕಳೆದ 7 ದಿನಗಳು", "Scheduled dose": "ನಿಗದಿತ ಡೋಸ್", "Marked taken": "ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ", "No check-in": "ಚೆಕ್-ಇನ್ ಇಲ್ಲ",
    "Analyze a prescription to display its prescribed medicines and dose check-ins here.": "ನಿಗದಿತ ಔಷಧಿಗಳು ಮತ್ತು ಡೋಸ್ ಚೆಕ್-ಇನ್‌ಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಲು ಔಷಧ ಚೀಟಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ.",
    "Upload doctor’s prescription page photos or text": "ವೈದ್ಯರ ಔಷಧ ಚೀಟಿಯ ಪುಟದ ಫೋಟೋ ಅಥವಾ ಪಠ್ಯವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", "Medicine name": "ಔಷಧಿಯ ಹೆಸರು", "Strength / dose": "ಸಾಮರ್ಥ್ಯ / ಡೋಸ್", "Directions": "ಸೂಚನೆಗಳು", "Dose time": "ಡೋಸ್ ಸಮಯ",
    "Human review required": "ಮಾನವ ಪರಿಶೀಲನೆ ಅಗತ್ಯ", "I checked every medicine, strength, direction, frequency, and duration against the original. I set any reminder time that was not explicitly written.": "ಪ್ರತಿ ಔಷಧಿ, ಸಾಮರ್ಥ್ಯ, ಸೂಚನೆ, ಆವರ್ತನೆ ಮತ್ತು ಅವಧಿಯನ್ನು ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ್ದೇನೆ. ಸ್ಪಷ್ಟವಾಗಿ ಬರೆಯದ ಜ್ಞಾಪನೆ ಸಮಯವನ್ನು ನಾನೇ ನಿಗದಿಪಡಿಸಿದ್ದೇನೆ.",
    "Medication reminders, SMS, and phone sync stay disabled until you confirm the schedule above.": "ಮೇಲಿನ ವೇಳಾಪಟ್ಟಿಯನ್ನು ದೃಢೀಕರಿಸುವವರೆಗೆ ಔಷಧಿ ಜ್ಞಾಪನೆ, SMS ಮತ್ತು ಫೋನ್ ಸಿಂಕ್ ನಿಷ್ಕ್ರಿಯವಾಗಿರುತ್ತವೆ.",
    "ONE-TIME SETUP": "ಒಮ್ಮೆ ಮಾತ್ರದ ಸೆಟಪ್", "Verify package text for each medicine": "ಪ್ರತಿ ಔಷಧಿಯ ಪ್ಯಾಕೆಟ್ ಪಠ್ಯ ಪರಿಶೀಲಿಸಿ",
    "Open package photo": "ಪ್ಯಾಕೆಟ್ ಫೋಟೋ ತೆರೆಯಿರಿ", "Find this exact medicine": "ಈ ನಿಖರ ಔಷಧಿ ಹುಡುಕಿ", "Find this prescribed medicine": "ಈ ನಿಗದಿತ ಔಷಧಿ ಹುಡುಕಿ", "Nearby pharmacy": "ಹತ್ತಿರದ ಔಷಧಾಲಯ",
    "Visual similarity": "ದೃಶ್ಯ ಸಾಮ್ಯತೆ", "Appearance check": "ನೋಟದ ಪರಿಶೀಲನೆ", "Capture reference photo": "ಉಲ್ಲೇಖ ಫೋಟೋ ಸೆರೆಹಿಡಿಯಿರಿ", "Clear reference profile": "ಔಷಧಿ ಉಲ್ಲೇಖ ಅಳಿಸಿ",
    "Speak or type how you are feeling": "ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ ಎಂದು ಹೇಳಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ", "Volume check": "ಧ್ವನಿ ಮಟ್ಟ ಪರಿಶೀಲನೆ", "Analyze text": "ಪಠ್ಯ ವಿಶ್ಲೇಷಿಸಿ",
    "Pair the VITAL Android companion with this computer. Once connected, the camera monitor and watch sync can use the phone connection.": "VITAL Android ಸಹಾಯಕವನ್ನು ಈ ಕಂಪ್ಯೂಟರ್‌ಗೆ ಜೋಡಿಸಿ. ಸಂಪರ್ಕವಾದ ಬಳಿಕ ಕ್ಯಾಮೆರಾ ಮಾನಿಟರ್ ಮತ್ತು ವಾಚ್ ಸಿಂಕ್ ಫೋನ್ ಸಂಪರ್ಕ ಬಳಸಬಹುದು.",
    "I confirm the patient has agreed to this camera session, and a person will monitor the screen.": "ರೋಗಿಯು ಈ ಕ್ಯಾಮೆರಾ ಸೆಷನ್‌ಗೆ ಒಪ್ಪಿದ್ದಾರೆ ಮತ್ತು ಒಬ್ಬ ವ್ಯಕ್ತಿ ಪರದೆಯನ್ನು ಗಮನಿಸುತ್ತಾರೆ ಎಂದು ದೃಢೀಕರಿಸುತ್ತೇನೆ.",
    "Keep the phone and computer on the same trusted Wi-Fi. Start VITAL with the phone-camera launcher, then enter a computer address and one-time code in the Android app.": "ಫೋನ್ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ಒಂದೇ ವಿಶ್ವಾಸಾರ್ಹ Wi-Fi ಗೆ ಸಂಪರ್ಕಿಸಿರಲಿ. ಫೋನ್-ಕ್ಯಾಮೆರಾ ಲಾಂಚರ್‌ನಿಂದ VITAL ಪ್ರಾರಂಭಿಸಿ, ನಂತರ Android ಆ್ಯಪ್‌ನಲ್ಲಿ ಕಂಪ್ಯೂಟರ್ ವಿಳಾಸ ಮತ್ತು ಏಕಬಳಕೆ ಕೋಡ್ ನಮೂದಿಸಿ.",
    "No local network address detected. Check that both devices are on Wi-Fi.": "ಸ್ಥಳೀಯ ನೆಟ್‌ವರ್ಕ್ ವಿಳಾಸ ಪತ್ತೆಯಾಗಿಲ್ಲ. ಎರಡೂ ಸಾಧನಗಳು Wi-Fi ಗೆ ಸಂಪರ್ಕಿತವಾಗಿವೆಯೇ ಪರಿಶೀಲಿಸಿ.",
    "Waiting for phone camera": "ಫೋನ್ ಕ್ಯಾಮೆರಾಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ", "Possible-fall emergency-contact alerts": "ಸಂಭಾವ್ಯ ಬಿದ್ದಿರುವಿಕೆ ತುರ್ತು ಸಂಪರ್ಕ ಎಚ್ಚರಿಕೆಗಳು", "Alert history and caregiver check-ins": "ಎಚ್ಚರಿಕೆ ಇತಿಹಾಸ ಮತ್ತು ಆರೈಕೆದಾರರ ಚೆಕ್-ಇನ್‌ಗಳು",
    "No possible-fall alerts have been recorded yet.": "ಇನ್ನೂ ಯಾವುದೇ ಸಂಭಾವ್ಯ ಬಿದ್ದಿರುವಿಕೆ ಎಚ್ಚರಿಕೆ ದಾಖಲಾಗಿಲ್ಲ.", "Checked on patient": "ರೋಗಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ", "False alarm": "ತಪ್ಪು ಎಚ್ಚರಿಕೆ", "Unable to reach": "ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
    "Need immediate help?": "ತಕ್ಷಣದ ಸಹಾಯ ಬೇಕೇ?", "For an emergency, call local emergency services. The caregiver SMS alert is not an emergency-service call.": "ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗಳಿಗೆ ಕರೆ ಮಾಡಿ. ಆರೈಕೆದಾರರಿಗೆ ಕಳುಹಿಸುವ SMS ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡುವುದಿಲ್ಲ.",
    "A quick view of your recent monitoring results and care activity.": "ಇತ್ತೀಚಿನ ಮೇಲ್ವಿಚಾರಣಾ ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಆರೈಕೆ ಚಟುವಟಿಕೆಯ ತ್ವರಿತ ನೋಟ.", "Risk score": "ಅಪಾಯ ಅಂಕ", "No monitoring events have been recorded yet.": "ಇನ್ನೂ ಯಾವುದೇ ಮೇಲ್ವಿಚಾರಣಾ ಘಟನೆ ದಾಖಲಾಗಿಲ್ಲ.",
    "PHOTO-ASSISTED HEALTH CHECK": "ಫೋಟೋ ನೆರವಿನ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ", "Document a visible health concern": "ಕಾಣುವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ದಾಖಲಿಸಿ",
    "Use a photo to record a visible change—such as a rash, wound, swelling, eye concern, or injury—and note how the person feels. This tool cannot diagnose or rule out a condition.": "ದದ್ದು, ಗಾಯ, ಊತ, ಕಣ್ಣಿನ ಸಮಸ್ಯೆ ಅಥವಾ ಪೆಟ್ಟಿನಂತಹ ಕಾಣುವ ಬದಲಾವಣೆಯ ಫೋಟೋ ತೆಗೆದು ವ್ಯಕ್ತಿಗೆ ಹೇಗಿದೆ ಎಂದು ದಾಖಲಿಸಿ. ಈ ಸಾಧನ ರೋಗನಿರ್ಣಯ ಮಾಡುವುದಿಲ್ಲ ಅಥವಾ ಸಮಸ್ಯೆಯನ್ನು ತಳ್ಳಿಹಾಕುವುದಿಲ್ಲ.",
    "1 · PHOTO": "1 · ಫೋಟೋ", "Add a photo": "ಫೋಟೋ ಸೇರಿಸಿ", "Use good lighting, keep the camera in focus, and avoid filters. Photograph only the area needed.": "ಉತ್ತಮ ಬೆಳಕಿನಲ್ಲಿ ಕ್ಯಾಮೆರಾವನ್ನು ಫೋಕಸ್ ಮಾಡಿ, ಫಿಲ್ಟರ್ ತಪ್ಪಿಸಿ. ಅಗತ್ಯವಿರುವ ಭಾಗವನ್ನು ಮಾತ್ರ ಫೋಟೋ ತೆಗೆಯಿರಿ.",
    "Skin / rash / visible mark": "ಚರ್ಮ / ದದ್ದು / ಕಾಣುವ ಗುರುತು", "Wound / cut / burn": "ಗಾಯ / ಕತ್ತರಿಕೆ / ಸುಟ್ಟ ಗಾಯ", "Eye / face concern": "ಕಣ್ಣು / ಮುಖದ ಸಮಸ್ಯೆ", "Swelling / bruise / injury": "ಊತ / ನೀಲಿಗಟ್ಟು / ಗಾಯ", "Other visible health concern": "ಇತರೆ ಕಾಣುವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ",
    "JPG, PNG, or WebP · private, local processing": "JPG, PNG ಅಥವಾ WebP · ಖಾಸಗಿ ಸ್ಥಳೀಯ ಸಂಸ್ಕರಣೆ", "Visible features": "ಕಾಣುವ ಲಕ್ಷಣಗಳು", "2 · SYMPTOMS": "2 · ಲಕ್ಷಣಗಳು", "How is the person feeling?": "ವ್ಯಕ್ತಿಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?",
    "Select anything that applies. A photo alone cannot assess symptoms or urgency.": "ಅನ್ವಯಿಸುವ ಆಯ್ಕೆಗಳನ್ನು ಆರಿಸಿ. ಫೋಟೋ ಮಾತ್ರದಿಂದ ಲಕ್ಷಣ ಅಥವಾ ತುರ್ತುಸ್ಥಿತಿ ನಿರ್ಧರಿಸಲಾಗುವುದಿಲ್ಲ.",
    "A photo cannot rule out a health problem": "ಫೋಟೋದಿಂದ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಯನ್ನು ತಳ್ಳಿಹಾಕಲಾಗುವುದಿಲ್ಲ", "Further guidance": "ಹೆಚ್ಚಿನ ಮಾರ್ಗದರ್ಶನ",
    "YOUR WEEK": "ನಿಮ್ಮ ವಾರ", "Activity overview": "ಚಟುವಟಿಕೆ ಅವಲೋಕನ", "No activity recorded yet": "ಇನ್ನೂ ಚಟುವಟಿಕೆ ದಾಖಲಾಗಿಲ್ಲ", "Search patient history": "ರೋಗಿಯ ಇತಿಹಾಸ ಹುಡುಕಿ", "Clear filters": "ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ",
    "Larger text": "ದೊಡ್ಡ ಪಠ್ಯ", "Increase text size across VITAL for easier reading.": "ಸುಲಭವಾಗಿ ಓದಲು VITAL ನಲ್ಲಿನ ಪಠ್ಯದ ಗಾತ್ರ ಹೆಚ್ಚಿಸಿ.", "Higher contrast": "ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್", "Strengthen text and borders throughout the app.": "ಆ್ಯಪ್‌ನಾದ್ಯಂತ ಪಠ್ಯ ಮತ್ತು ಅಂಚುಗಳನ್ನು ಹೆಚ್ಚು ಸ್ಪಷ್ಟಗೊಳಿಸಿ.",
    "Download data backup": "ಡೇಟಾ ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", "Restore backup": "ಬ್ಯಾಕಪ್ ಮರುಸ್ಥಾಪಿಸಿ", "Browser notifications": "ಬ್ರೌಸರ್ ಅಧಿಸೂಚನೆಗಳು", "Reminder lead time": "ಜ್ಞಾಪನೆಯ ಮುನ್ನೋಟ ಸಮಯ",
    "5 minutes before": "5 ನಿಮಿಷ ಮೊದಲು", "10 minutes before": "10 ನಿಮಿಷ ಮೊದಲು", "Daily health slogan by SMS": "SMS ಮೂಲಕ ದೈನಂದಿನ ಆರೋಗ್ಯ ಘೋಷವಾಕ್ಯ", "Daily tip time": "ದೈನಂದಿನ ಸಲಹೆಯ ಸಮಯ",
    "Preview health report": "ಆರೋಗ್ಯ ವರದಿ ಪೂರ್ವವೀಕ್ಷಿಸಿ", "Download PDF": "PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", "Save a readable report": "ಓದಲು ಸುಲಭವಾದ ವರದಿ ಉಳಿಸಿ", "Your PDF includes": "ನಿಮ್ಮ PDF ಒಳಗೊಂಡಿರುವುದು",
    "Patient profile and recorded vital readings": "ರೋಗಿಯ ಪ್ರೊಫೈಲ್ ಮತ್ತು ದಾಖಲಿಸಿದ ಆರೋಗ್ಯ ಮಾಪನಗಳು", "Triage score, risk factors, protective signals, and recommendations": "ಪರಿಶೀಲನಾ ಅಂಕ, ಅಪಾಯಾಂಶಗಳು, ರಕ್ಷಣಾ ಸೂಚನೆಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳು", "Wearable context, appointments, and recent timeline events": "ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಮಾಹಿತಿ, ಭೇಟಿಗಳು ಮತ್ತು ಇತ್ತೀಚಿನ ಕಾಲರೇಖೆ ಘಟನೆಗಳು",
    "Patient health report": "ರೋಗಿಯ ಆರೋಗ್ಯ ವರದಿ", "Patient details": "ರೋಗಿಯ ವಿವರಗಳು", "Age": "ವಯಸ್ಸು", "Health context": "ಆರೋಗ್ಯ ಸಂದರ್ಭ", "Care contact": "ಆರೈಕೆ ಸಂಪರ್ಕ", "Contact number": "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
    "Latest symptom check": "ಇತ್ತೀಚಿನ ಲಕ್ಷಣ ಪರಿಶೀಲನೆ", "Symptoms entered": "ನಮೂದಿಸಿದ ಲಕ್ಷಣಗಳು", "Risk factors": "ಅಪಾಯಾಂಶಗಳು", "Oxygen saturation": "ರಕ್ತದ ಆಮ್ಲಜನಕ ಪ್ರಮಾಣ", "Pulse": "ನಾಡಿ", "Temperature": "ತಾಪಮಾನ", "Systolic pressure": "ಸಿಸ್ಟೋಲಿಕ್ ಒತ್ತಡ", "Breathing rate": "ಉಸಿರಾಟದ ದರ",
    "Visit reminders": "ಭೇಟಿ ಜ್ಞಾಪನೆಗಳು", "Care activity": "ಆರೈಕೆ ಚಟುವಟಿಕೆ", "This summary contains the information saved in VITAL. Share it with a clinician as helpful.": "ಈ ಸಾರಾಂಶದಲ್ಲಿ VITAL ನಲ್ಲಿ ಉಳಿಸಿದ ಮಾಹಿತಿ ಇದೆ. ಅಗತ್ಯವಿದ್ದರೆ ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.",
    "No setup or follow-up items right now.": "ಈಗ ಸೆಟಪ್ ಅಥವಾ ಮುಂದುವರಿದ ಕ್ರಮಗಳಿಲ್ಲ.", "Open sync": "ಸಿಂಕ್ ತೆರೆಯಿರಿ", "Phone not paired": "ಫೋನ್ ಜೋಡಿಸಿಲ್ಲ",
    "Pair the Android app to sync phone data and enable phone camera monitoring.": "ಫೋನ್ ಡೇಟಾ ಸಿಂಕ್ ಮಾಡಲು ಮತ್ತು ಕ್ಯಾಮೆರಾ ಮೇಲ್ವಿಚಾರಣೆ ಸಕ್ರಿಯಗೊಳಿಸಲು Android ಆ್ಯಪ್ ಜೋಡಿಸಿ.",
    "Refresh sync": "ಸಿಂಕ್ ರಿಫ್ರೆಶ್ ಮಾಡಿ", "Pair and sync the watch in Fastrack Smart. Enable its Google Fit health-data sync if the option is available.": "Fastrack Smart ನಲ್ಲಿ ವಾಚ್ ಜೋಡಿಸಿ ಮತ್ತು ಸಿಂಕ್ ಮಾಡಿ. ಆಯ್ಕೆ ಲಭ್ಯವಿದ್ದರೆ Google Fit ಆರೋಗ್ಯ ಡೇಟಾ ಸಿಂಕ್ ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    "In Google Fit, open": "Google Fit ನಲ್ಲಿ ತೆರೆಯಿರಿ", "Profile → Settings → Health Connect": "ಪ್ರೊಫೈಲ್ → ಸೆಟ್ಟಿಂಗ್‌ಗಳು → Health Connect", "and turn on": "ಮತ್ತು ಸಕ್ರಿಯಗೊಳಿಸಿ", "Sync Fit with Health Connect": "Fit ಅನ್ನು Health Connect ಜೊತೆ ಸಿಂಕ್ ಮಾಡಿ",
    "Confirm the watch readings are listed in Health Connect. Then, in the VITAL Android companion, tap": "ವಾಚ್ ಮಾಪನಗಳು Health Connect ನಲ್ಲಿ ಕಾಣುತ್ತಿವೆಯೇ ದೃಢೀಕರಿಸಿ. ನಂತರ VITAL Android ಸಹಾಯಕದಲ್ಲಿ ಇದನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ",
    "Sync watch readings": "ವಾಚ್ ಮಾಪನಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಿ", "and grant the requested read access.": "ಮತ್ತು ಕೇಳಿದ ಓದುವ ಅನುಮತಿಯನ್ನು ನೀಡಿ.",
    "VITAL reads actual records Health Connect contains and uploads them over the paired local Wi-Fi connection. The phone checks about once a minute while the companion is open.": "VITAL Health Connect ನಲ್ಲಿರುವ ನೈಜ ದಾಖಲೆಗಳನ್ನು ಓದಿ ಜೋಡಿಸಿದ ಸ್ಥಳೀಯ Wi-Fi ಮೂಲಕ ಅಪ್‌ಲೋಡ್ ಮಾಡುತ್ತದೆ. ಸಹಾಯಕ ಆ್ಯಪ್ ತೆರೆದಿರುವಾಗ ಫೋನ್ ಸುಮಾರು ಪ್ರತಿ ನಿಮಿಷ ಪರಿಶೀಲಿಸುತ್ತದೆ.",
    "This dashboard refreshes every 15 seconds. Check the source and timestamp; the vendor app may take time to sync new readings.": "ಈ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರತಿ 15 ಸೆಕೆಂಡಿಗೆ ರಿಫ್ರೆಶ್ ಆಗುತ್ತದೆ. ಮೂಲ ಮತ್ತು ಸಮಯ ನೋಡಿ; ಹೊಸ ಮಾಪನ ಸಿಂಕ್ ಮಾಡಲು ಮೂಲ ಆ್ಯಪ್‌ಗೆ ಸಮಯ ಬೇಕಾಗಬಹುದು.",
    "Only readings actually shared through the watch app, Google Fit, and Health Connect are shown. Unavailable measurements are hidden. This is periodic health-data sync, not a second-by-second sensor stream. Watch data is wellness context and is not a diagnosis.": "ವಾಚ್ ಆ್ಯಪ್, Google Fit ಮತ್ತು Health Connect ಮೂಲಕ ಹಂಚಿದ ಮಾಪನಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತದೆ. ಲಭ್ಯವಿಲ್ಲದ ಮಾಪನಗಳನ್ನು ಮರೆಮಾಡಲಾಗುತ್ತದೆ. ಇದು ಅವಧಿಕ ಆರೋಗ್ಯ ಡೇಟಾ ಸಿಂಕ್; ಪ್ರತಿ ಕ್ಷಣದ ಸೆನ್ಸರ್ ಸ್ಟ್ರೀಮ್ ಅಲ್ಲ. ವಾಚ್ ಡೇಟಾ ಆರೋಗ್ಯ ಸಂದರ್ಭ ಮಾತ್ರ, ರೋಗನಿರ್ಣಯವಲ್ಲ.",
    "Connect the VITAL Android app to this computer to use phone camera monitoring and phone-based health sync.": "ಫೋನ್ ಕ್ಯಾಮೆರಾ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಫೋನ್ ಆರೋಗ್ಯ ಸಿಂಕ್ ಬಳಸಲು VITAL Android ಆ್ಯಪ್ ಅನ್ನು ಈ ಕಂಪ್ಯೂಟರ್‌ಗೆ ಸಂಪರ್ಕಿಸಿ.",
    "Check on the person if safe and review the camera alert history. VITAL cannot confirm a fall or call emergency services.": "ಸುರಕ್ಷಿತವಾಗಿದ್ದರೆ ವ್ಯಕ್ತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಎಚ್ಚರಿಕೆ ಇತಿಹಾಸ ನೋಡಿ. VITAL ಬೀಳುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಲು ಅಥವಾ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Connect the VITAL Android app": "VITAL Android ಆ್ಯಪ್ ಸಂಪರ್ಕಿಸಿ", "Live horizontal-posture monitoring.": "ಅಡ್ಡ ಮಲಗಿದ ಭಂಗಿಯ ನೇರ ಮೇಲ್ವಿಚಾರಣೆ.",
    "The paired Android phone runs YOLO pose analysis locally and streams an annotated tracking frame here. A sustained horizontal torso posture starts a 4-second stillness check, including when the person was already lying down as monitoring began; brief noisy pose frames no longer reset the check. Standing up cancels it. After confirmation, VITAL attempts SMS to the saved emergency contacts. It never calls an ambulance automatically; a person must choose Call 112. This prototype can miss or falsely flag falls.": "ಜೋಡಿಸಿದ Android ಫೋನ್ YOLO ಭಂಗಿ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಸ್ಥಳೀಯವಾಗಿ ನಡೆಸಿ ಗುರುತಿಸಿದ ಟ್ರ್ಯಾಕಿಂಗ್ ಫ್ರೇಮ್ ಅನ್ನು ಇಲ್ಲಿ ಕಳುಹಿಸುತ್ತದೆ. ದೇಹದ ಮೇಲ್ಭಾಗ ಅಡ್ಡವಾಗಿ ನಿರಂತರವಿದ್ದರೆ 4 ಸೆಕೆಂಡಿನ ಸ್ಥಿರತೆ ಪರಿಶೀಲನೆ ಆರಂಭವಾಗುತ್ತದೆ; ಮೇಲ್ವಿಚಾರಣೆ ಶುರುವಾಗುವಾಗ ವ್ಯಕ್ತಿ ಈಗಾಗಲೇ ಮಲಗಿದ್ದರೂ ಇದು ಅನ್ವಯಿಸುತ್ತದೆ. ಕ್ಷಣಿಕ ಶಬ್ದದ ಫ್ರೇಮ್‌ಗಳು ಪರಿಶೀಲನೆಯನ್ನು ಮರುಹೊಂದಿಸುವುದಿಲ್ಲ. ಎದ್ದುನಿಂತರೆ ಅದು ರದ್ದಾಗುತ್ತದೆ. ದೃಢೀಕರಣದ ನಂತರ VITAL ಉಳಿಸಿದ ತುರ್ತು ಸಂಪರ್ಕಗಳಿಗೆ SMS ಕಳುಹಿಸಲು ಪ್ರಯತ್ನಿಸುತ್ತದೆ. ಅದು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆಂಬುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡುವುದಿಲ್ಲ; ವ್ಯಕ್ತಿಯೇ 112 ಆಯ್ಕೆ ಮಾಡಬೇಕು. ಈ ಮಾದರಿ ಬೀಳುವಿಕೆಯನ್ನು ತಪ್ಪಿಸಬಹುದು ಅಥವಾ ತಪ್ಪು ಎಚ್ಚರಿಕೆ ನೀಡಬಹುದು.",
    "Enable automatic possible-fall SMS alerts to these emergency contacts": "ಸಂಭಾವ್ಯ ಬೀಳುವಿಕೆ ಎಚ್ಚರಿಕೆಗೆ ಈ ತುರ್ತು ಸಂಪರ್ಕಗಳಿಗೆ ಸ್ವಯಂಚಾಲಿತ SMS ಸಕ್ರಿಯಗೊಳಿಸಿ",
    "The patient agrees to immediate automatic caretaker SMS attempts when the prototype flags a possible fall. False alerts are possible.": "ಮಾದರಿ ಸಂಭಾವ್ಯ ಬೀಳುವಿಕೆ ಗುರುತಿಸಿದಾಗ ಆರೈಕೆದಾರರಿಗೆ ತಕ್ಷಣ ಸ್ವಯಂಚಾಲಿತ SMS ಪ್ರಯತ್ನಿಸಲು ರೋಗಿ ಒಪ್ಪಿದ್ದಾರೆ. ತಪ್ಪು ಎಚ್ಚರಿಕೆಗಳು ಸಾಧ್ಯ.",
    "Updates from the paired phone appear here. A check-in is saved to this VITAL account; it does not confirm SMS delivery.": "ಜೋಡಿಸಿದ ಫೋನ್‌ನ ನವೀಕರಣಗಳು ಇಲ್ಲಿ ಕಾಣುತ್ತವೆ. ಚೆಕ್-ಇನ್ ಈ VITAL ಖಾತೆಯಲ್ಲಿ ಉಳಿಯುತ್ತದೆ; SMS ತಲುಪಿದೆ ಎಂದು ಇದು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.",
    "Message caretaker": "ಆರೈಕೆದಾರರಿಗೆ ಸಂದೇಶ", "Text caretaker": "ಆರೈಕೆದಾರರಿಗೆ SMS", "Add caretaker contact": "ಆರೈಕೆದಾರರ ಸಂಪರ್ಕ ಸೇರಿಸಿ",
    "This section keeps a local record of emergency activity. It does not contact the hospital or send a message.": "ಈ ವಿಭಾಗ ತುರ್ತು ಚಟುವಟಿಕೆಯ ಸ್ಥಳೀಯ ದಾಖಲೆಯನ್ನು ಇಡುತ್ತದೆ. ಇದು ಆಸ್ಪತ್ರೆಯನ್ನು ಸಂಪರ್ಕಿಸುವುದಿಲ್ಲ ಅಥವಾ ಸಂದೇಶ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
    "This saves a reminder in VITAL; it does not book an appointment with the hospital. Call the hospital to confirm availability.": "ಇದು VITAL ನಲ್ಲಿ ಜ್ಞಾಪನೆ ಉಳಿಸುತ್ತದೆ; ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಭೇಟಿಯನ್ನು ಕಾಯ್ದಿರಿಸುವುದಿಲ್ಲ. ಲಭ್ಯತೆ ದೃಢೀಕರಿಸಲು ಆಸ್ಪತ್ರೆಗೆ ಕರೆ ಮಾಡಿ.",
    "Appointment saved": "ಭೇಟಿ ಉಳಿಸಲಾಗಿದೆ", "You have no saved visit reminders yet.": "ಇನ್ನೂ ಯಾವುದೇ ಭೇಟಿ ಜ್ಞಾಪನೆ ಉಳಿಸಿಲ್ಲ.",
    "Android submission or provider acceptance does not confirm handset delivery. Carrier charges may apply. This reminder does not book a hospital appointment.": "Android ಸಲ್ಲಿಕೆ ಅಥವಾ ಸೇವಾ ಪೂರೈಕೆದಾರರ ಸ್ವೀಕೃತಿ ಫೋನ್‌ಗೆ ತಲುಪಿದೆ ಎಂದು ದೃಢಪಡಿಸುವುದಿಲ್ಲ. ನೆಟ್‌ವರ್ಕ್ ಶುಲ್ಕ ಅನ್ವಯಿಸಬಹುದು. ಈ ಜ್ಞಾಪನೆ ಆಸ್ಪತ್ರೆ ಭೇಟಿ ಕಾಯ್ದಿರಿಸುವುದಿಲ್ಲ.",
    "SMS history records delivery metadata only. A message queued for Android SMS is held on the VITAL computer for up to 24 hours, then its body and number are removed if unsent. Phone submission does not confirm carrier delivery.": "SMS ಇತಿಹಾಸ ಡೆಲಿವರಿ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ದಾಖಲಿಸುತ್ತದೆ. Android SMS ಸರದಿಯ ಸಂದೇಶ VITAL ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ 24 ಗಂಟೆ ಇರುತ್ತದೆ; ಕಳುಹಿಸದಿದ್ದರೆ ಪಠ್ಯ ಮತ್ತು ಸಂಖ್ಯೆಯನ್ನು ಅಳಿಸಲಾಗುತ್ತದೆ. ಫೋನ್ ಸಲ್ಲಿಕೆ ನೆಟ್‌ವರ್ಕ್ ಡೆಲಿವರಿಯನ್ನು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.",
    "Phone reminder delivery": "ಫೋನ್ ಜ್ಞಾಪನೆ ಡೆಲಿವರಿ", "Uses this device’s local time zone. SMS is sent only when you enable the daily tip above.": "ಈ ಸಾಧನದ ಸ್ಥಳೀಯ ಸಮಯ ವಲಯ ಬಳಸುತ್ತದೆ. ಮೇಲಿನ ದೈನಂದಿನ ಸಲಹೆ ಸಕ್ರಿಯಗೊಳಿಸಿದಾಗ ಮಾತ್ರ SMS ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
    "Text the primary caretaker at dose time": "ಡೋಸ್ ಸಮಯದಲ್ಲಿ ಮುಖ್ಯ ಆರೈಕೆದಾರರಿಗೆ SMS ಮಾಡಿ", "SMS me about scheduled medicines": "ನಿಗದಿತ ಔಷಧಿಗಳ ಬಗ್ಗೆ ನನಗೆ SMS ಮಾಡಿ", "Emergency cancellation countdown": "ತುರ್ತು ರದ್ದುಪಡಿಸುವ ಕ್ಷಣಗಣನೆ",
    "5 seconds": "5 ಸೆಕೆಂಡು", "10 seconds": "10 ಸೆಕೆಂಡು", "15 seconds": "15 ಸೆಕೆಂಡು",
    "Your profile and preferences are saved in this browser. Emergency alerts are not sent automatically; use the phone or message controls to contact someone.": "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಆಯ್ಕೆಗಳು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಯುತ್ತವೆ. ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಳುಹಿಸುವುದಿಲ್ಲ; ಯಾರನ್ನಾದರೂ ಸಂಪರ್ಕಿಸಲು ಫೋನ್ ಅಥವಾ ಸಂದೇಶ ನಿಯಂತ್ರಣ ಬಳಸಿ."
  }
};

// Additional fixed copy used in less frequently opened cards and dialogs.
// Keeping these in a second table makes it easy to extend page coverage without
// changing the translation behavior or touching user-entered health values.
Object.assign(translations.hi, {
  "Current vital readings": "वर्तमान स्वास्थ्य माप", "Visual snapshot of current readings": "वर्तमान माप का दृश्य सारांश",
  "Latest saved screening estimate": "नवीनतम सहेजा गया जाँच अनुमान", "Latest screening estimate": "नवीनतम जाँच अनुमान",
  "No screening estimates have been recorded yet.": "अभी तक कोई जाँच अनुमान दर्ज नहीं है।", "No recent activity is saved.": "हाल की कोई गतिविधि सहेजी नहीं गई है।",
  "No visit reminders saved.": "मुलाक़ात का कोई रिमाइंडर सहेजा नहीं गया।", "No wearable reading is saved.": "वियरेबल का कोई माप सहेजा नहीं गया।",
  "A photo check records a visual tablet match only. It does not confirm that the dose was taken.": "फ़ोटो जाँच केवल टैबलेट की दिखावट का मिलान दर्ज करती है। इससे यह पुष्टि नहीं होती कि खुराक ली गई।",
  "A photo match is shown separately and does not confirm a dose was taken.": "फ़ोटो मिलान अलग से दिखाया जाता है और इससे खुराक लेने की पुष्टि नहीं होती।",
  "DOSES MARKED TAKEN": "ली गई के रूप में दर्ज खुराकें", "Daily medication check-ins": "दैनिक दवा चेक-इन", "Medication Adherence Dashboard": "दवा पालन डैशबोर्ड",
  "Medication adherence history": "दवा पालन इतिहास", "Medication check-in mix": "दवा चेक-इन का विवरण", "Seven day medication check grid": "सात दिनों का दवा जाँच ग्रिड",
  "Marked missed": "छूटी हुई के रूप में दर्ज", "Missed doses": "छूटी हुई खुराकें", "No dose check-ins yet": "अभी तक दवा चेक-इन नहीं हैं",
  "Analyze a prescription above to choose a prescribed medicine. Camera checks are unavailable until a prescription schedule exists.": "निर्धारित दवा चुनने के लिए ऊपर दिए नुस्खे का विश्लेषण करें। नुस्खे की समय-सारणी बनने तक कैमरा जाँच उपलब्ध नहीं है।",
  "For each prescription item, take a separate photo of its box or strip with the printed medicine name and strength in focus. VITAL transcribes the visible package text locally and compares it with that prescription row. It reports “text appears consistent,” “possible strength mismatch,” or “needs manual review.” Also upload tablet photos if you want an optional visual appearance comparison; that comparison does not identify a pill.": "नुस्खे की हर दवा के डिब्बे या स्ट्रिप की अलग फ़ोटो लें, जिसमें छपा नाम और ताकत साफ़ दिखें। VITAL पैकेट का दिखने वाला टेक्स्ट इसी कंप्यूटर पर पढ़कर नुस्खे की पंक्ति से मिलाता है। यह “टेक्स्ट मेल खाता दिखता है”, “ताकत में अंतर हो सकता है” या “हाथ से समीक्षा ज़रूरी” बता सकता है। वैकल्पिक दिखावट तुलना के लिए टैबलेट की फ़ोटो भी दें; इससे गोली की पहचान नहीं होती।",
  "Photograph this medicine’s own box or strip with its printed name and strength visible.": "इस दवा के अपने डिब्बे या स्ट्रिप की फ़ोटो लें, जिसमें छपा नाम और ताकत दिखें।",
  "VITAL stores compressed reference thumbnails and visual features locally in this browser, separately for each medicine and strength. This is a visual similarity aid—not a medical-grade pill identifier. Lookalike pills may still pass; check the package/label every time. A visual check cannot prove ingestion.": "VITAL हर दवा और ताकत के लिए संदर्भ थंबनेल और दिखावट की विशेषताएँ इसी ब्राउज़र में अलग-अलग सहेजता है। यह केवल दिखावट की समानता जाँचने में मदद करता है—चिकित्सकीय गोली पहचान प्रणाली नहीं है। मिलती-जुलती गोलियाँ फिर भी मेल खा सकती हैं; हर बार पैकेट/लेबल जाँचें। दृश्य जाँच से दवा लेने की पुष्टि नहीं होती।",
  "Links open a live search for the parsed name and strength. Confirm brand, dosage, prescription requirement, and stock with the pharmacy.": "लिंक पहचाने गए नाम और ताकत की लाइव खोज खोलते हैं। ब्रांड, खुराक, नुस्खे की ज़रूरत और उपलब्धता फ़ार्मेसी से जाँचें।",
  "The last recorded status is kept below.": "आख़िरी दर्ज स्थिति नीचे रखी गई है।", "Describe symptoms, timing, and any change from usual.": "लक्षण, उनका समय और सामान्य स्थिति से बदलाव बताएँ।",
  "No emergency call has been placed. Use the button to open the phone dialer and call 112.": "कोई आपातकालीन कॉल नहीं की गई है। फ़ोन डायलर खोलने और 112 पर कॉल करने के लिए बटन दबाएँ।",
  "Saved in VITAL only. No emergency service or caretaker was contacted.": "केवल VITAL में सहेजा गया। किसी आपातकालीन सेवा या देखभालकर्ता से संपर्क नहीं किया गया।",
  "For phone fallback, pair the VITAL Android app, enable Phone SMS there, and keep it open or its camera service running. Carrier fees may apply.": "फ़ोन से SMS भेजने के लिए VITAL Android ऐप पेयर करें, उसमें Phone SMS चालू करें और ऐप या कैमरा सेवा चालू रखें। नेटवर्क शुल्क लग सकते हैं।",
  "Caretaker message shortcuts are turned off in Settings.": "सेटिंग्स में देखभालकर्ता संदेश शॉर्टकट बंद हैं।", "Emergency help activity": "आपातकालीन सहायता गतिविधि",
  "Get professional advice for a new, worsening, painful, or persistent concern—even if the image review looks reassuring. Contact emergency services for severe or rapidly worsening symptoms.": "नई, बढ़ती, दर्दनाक या लगातार बनी समस्या पर पेशेवर सलाह लें—भले ही फ़ोटो की समीक्षा ठीक लगे। गंभीर या तेज़ी से बिगड़ते लक्षणों पर आपातकालीन सेवाओं से संपर्क करें।",
  "Do not start leftover medicines or delay care based on an AI description. A qualified clinician can examine the person and decide what evaluation or treatment is appropriate.": "AI के विवरण के आधार पर बची हुई दवा शुरू न करें और इलाज में देरी न करें। योग्य डॉक्टर जाँच करके उचित मूल्यांकन या इलाज तय कर सकते हैं।",
  "This general guidance is based only on the information entered. It is not a diagnosis or a substitute for professional care.": "यह सामान्य सलाह केवल दर्ज जानकारी पर आधारित है। यह निदान या पेशेवर देखभाल का विकल्प नहीं है।",
  "This simple check is not a medical assessment.": "यह साधारण जाँच चिकित्सकीय आकलन नहीं है।", "With this health history, contact a clinician earlier about a new or worsening concern.": "इस स्वास्थ्य इतिहास के साथ कोई नई या बढ़ती समस्या हो तो डॉक्टर से जल्दी संपर्क करें।",
  "Seek emergency help if the person becomes very unwell, symptoms worsen rapidly, or any emergency warning sign appears.": "व्यक्ति की हालत बहुत बिगड़े, लक्षण तेज़ी से बढ़ें या आपातकाल का कोई संकेत दिखे तो तुरंत मदद लें।",
  "Download your VITAL profile, preferences, screening result, symptoms, medication records, appointments, and timeline as a JSON file.": "अपनी VITAL प्रोफ़ाइल, प्राथमिकताएँ, जाँच परिणाम, लक्षण, दवा रिकॉर्ड, अपॉइंटमेंट और समयरेखा JSON फ़ाइल में डाउनलोड करें।",
  "This file contains sensitive health information. It stays on this device unless you choose to move or share it.": "इस फ़ाइल में संवेदनशील स्वास्थ्य जानकारी है। जब तक आप इसे साझा या कहीं और न भेजें, यह इसी डिवाइस पर रहती है।",
  "VITAL uses Twilio when a sender is ready. Otherwise, messages queue for the paired Android phone’s SIM. Phone submission is not proof of carrier delivery.": "भेजने की सुविधा तैयार होने पर VITAL Twilio का उपयोग करता है। अन्यथा संदेश पेयर किए Android फ़ोन के SIM की कतार में जाते हैं। फ़ोन से भेजना नेटवर्क पर डिलीवरी का प्रमाण नहीं है।",
  "Last daily health tip submitted or queued:": "रोज़ाना स्वास्थ्य सुझाव आख़िरी बार भेजा या कतार में डाला गया:", "Last reminder submitted or queued:": "रिमाइंडर आख़िरी बार भेजा या कतार में डाला गया:",
  "Switch visual theme": "रंग थीम बदलें", "Attention & connections": "ध्यान और कनेक्शन", "Health analytics": "स्वास्थ्य विश्लेषण", "Health data charts": "स्वास्थ्य डेटा चार्ट",
  "Health nudge controls": "स्वास्थ्य सुझाव नियंत्रण", "Monitoring preferences": "निगरानी प्राथमिकताएँ", "Your data backup": "आपका डेटा बैकअप", "Your health timeline": "आपकी स्वास्थ्य समयरेखा",
  "Your medication schedule": "आपकी दवा समय-सारणी", "Your planned visits": "आपकी नियोजित मुलाक़ातें", "Recent activity overview": "हाल की गतिविधि का सारांश", "Everyday health precautions": "रोज़मर्रा की स्वास्थ्य सावधानियाँ",
  "Your recognized words will appear here. You can also type a phrase.": "पहचाने गए शब्द यहाँ दिखेंगे। आप वाक्य टाइप भी कर सकते हैं।", "Speech or typed phrase capture": "बोली या टाइप की गई बात दर्ज करें",
  "Voice questions are transcribed locally by VITAL. Audio is not sent to a browser speech service.": "आवाज़ के सवाल VITAL इसी कंप्यूटर पर लिखित रूप में बदलता है। ऑडियो ब्राउज़र की वाक् सेवा को नहीं भेजा जाता।",
  "Local speech when supported": "समर्थित होने पर स्थानीय वाक् पहचान", "Feeds the triage score": "जाँच स्कोर में उपयोग होता है", "Quick tour of VITAL": "VITAL का छोटा परिचय",
  "Start a new conversation": "नई बातचीत शुरू करें", "Cancel response": "जवाब रद्द करें", "Close assistant": "सहायक बंद करें", "Listen to this reply": "यह जवाब सुनें", "New chat": "नई चैट",
  "Phone access is off. Close this VITAL session and reopen": "फ़ोन की पहुँच बंद है। इस VITAL सत्र को बंद करके फिर खोलें",
  ", then refresh this page.": ", फिर यह पेज रीफ़्रेश करें।", "Primary number is taken from Patient profile:": "मुख्य नंबर मरीज़ की प्रोफ़ाइल से लिया गया है:",
  "Package label ·": "पैकेट लेबल ·", "OCR name:": "OCR नाम:", "Measurement time:": "माप का समय:", "Sources:": "स्रोत:", "Time": "समय", "Date": "तारीख", "Reason": "कारण", "Department": "विभाग", "Hospital": "अस्पताल",
  "Recent activity": "हाल की गतिविधि", "Recorded": "दर्ज किया गया", "Verified": "पुष्टि की गई", "Pending": "लंबित", "Prepared": "तैयार",
  "Review screening": "जाँच परिणाम देखें", "Review symptoms & vitals": "लक्षण और माप देखें", "See all": "सभी देखें", "Next health nudge": "अगला स्वास्थ्य सुझाव", "Previous health nudge": "पिछला स्वास्थ्य सुझाव"
});

Object.assign(translations.kn, {
  "Current vital readings": "ಪ್ರಸ್ತುತ ಆರೋಗ್ಯ ಮಾಪನಗಳು", "Visual snapshot of current readings": "ಪ್ರಸ್ತುತ ಮಾಪನಗಳ ದೃಶ್ಯ ಸಾರಾಂಶ",
  "Latest saved screening estimate": "ಇತ್ತೀಚೆಗೆ ಉಳಿಸಿದ ಪರಿಶೀಲನಾ ಅಂದಾಜು", "Latest screening estimate": "ಇತ್ತೀಚಿನ ಪರಿಶೀಲನಾ ಅಂದಾಜು",
  "No screening estimates have been recorded yet.": "ಇನ್ನೂ ಯಾವುದೇ ಪರಿಶೀಲನಾ ಅಂದಾಜು ದಾಖಲಾಗಿಲ್ಲ.", "No recent activity is saved.": "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ ಉಳಿಸಿಲ್ಲ.",
  "No visit reminders saved.": "ಭೇಟಿಯ ಜ್ಞಾಪನೆಗಳನ್ನು ಉಳಿಸಿಲ್ಲ.", "No wearable reading is saved.": "ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಮಾಪನ ಉಳಿಸಿಲ್ಲ.",
  "A photo check records a visual tablet match only. It does not confirm that the dose was taken.": "ಫೋಟೋ ಪರಿಶೀಲನೆ ಮಾತ್ರೆ ನೋಟದ ಹೊಂದಾಣಿಕೆಯನ್ನು ಮಾತ್ರ ದಾಖಲಿಸುತ್ತದೆ. ಡೋಸ್ ತೆಗೆದುಕೊಂಡಿರುವುದನ್ನು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.",
  "A photo match is shown separately and does not confirm a dose was taken.": "ಫೋಟೋ ಹೊಂದಾಣಿಕೆಯನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ತೋರಿಸಲಾಗುತ್ತದೆ; ಡೋಸ್ ತೆಗೆದುಕೊಂಡಿರುವುದನ್ನು ಇದು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.",
  "DOSES MARKED TAKEN": "ತೆಗೆದುಕೊಂಡದ್ದು ಎಂದು ಗುರುತಿಸಿದ ಡೋಸ್‌ಗಳು", "Daily medication check-ins": "ದೈನಂದಿನ ಔಷಧಿ ಚೆಕ್-ಇನ್‌ಗಳು", "Medication Adherence Dashboard": "ಔಷಧಿ ಪಾಲನೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  "Medication adherence history": "ಔಷಧಿ ಪಾಲನೆ ಇತಿಹಾಸ", "Medication check-in mix": "ಔಷಧಿ ಚೆಕ್-ಇನ್ ವಿವರ", "Seven day medication check grid": "ಏಳು ದಿನಗಳ ಔಷಧಿ ಪರಿಶೀಲನಾ ಗ್ರಿಡ್",
  "Marked missed": "ತಪ್ಪಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ", "Missed doses": "ತಪ್ಪಿದ ಡೋಸ್‌ಗಳು", "No dose check-ins yet": "ಇನ್ನೂ ಡೋಸ್ ಚೆಕ್-ಇನ್ ಇಲ್ಲ",
  "Analyze a prescription above to choose a prescribed medicine. Camera checks are unavailable until a prescription schedule exists.": "ನಿಗದಿತ ಔಷಧಿ ಆಯ್ಕೆ ಮಾಡಲು ಮೇಲಿನ ಚೀಟಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ. ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ ಸಿದ್ಧವಾಗುವವರೆಗೆ ಕ್ಯಾಮೆರಾ ಪರಿಶೀಲನೆ ಲಭ್ಯವಿಲ್ಲ.",
  "For each prescription item, take a separate photo of its box or strip with the printed medicine name and strength in focus. VITAL transcribes the visible package text locally and compares it with that prescription row. It reports “text appears consistent,” “possible strength mismatch,” or “needs manual review.” Also upload tablet photos if you want an optional visual appearance comparison; that comparison does not identify a pill.": "ಚೀಟಿಯಲ್ಲಿನ ಪ್ರತಿ ಔಷಧಿಯ ಪೆಟ್ಟಿಗೆ ಅಥವಾ ಪಟ್ಟಿಯ ಪ್ರತ್ಯೇಕ ಫೋಟೋ ತೆಗೆದು, ಮುದ್ರಿತ ಹೆಸರು ಮತ್ತು ಸಾಮರ್ಥ್ಯ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವಂತೆ ಮಾಡಿ. VITAL ಪ್ಯಾಕೆಟ್‌ನ ಪಠ್ಯವನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಓದಿ ಚೀಟಿಯ ಸಾಲಿಗೆ ಹೋಲಿಸುತ್ತದೆ. “ಪಠ್ಯ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ”, “ಸಾಮರ್ಥ್ಯ ವ್ಯತ್ಯಾಸ ಇರಬಹುದು” ಅಥವಾ “ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆ ಅಗತ್ಯ” ಎಂದು ಸೂಚಿಸುತ್ತದೆ. ಐಚ್ಛಿಕ ನೋಟ ಹೋಲಿಕೆಗಾಗಿ ಮಾತ್ರೆಯ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು; ಅದರಿಂದ ಮಾತ್ರೆ ಗುರುತಾಗುವುದಿಲ್ಲ.",
  "Photograph this medicine’s own box or strip with its printed name and strength visible.": "ಈ ಔಷಧಿಯ ಸ್ವಂತ ಪೆಟ್ಟಿಗೆ ಅಥವಾ ಪಟ್ಟಿಯ ಮುದ್ರಿತ ಹೆಸರು ಮತ್ತು ಸಾಮರ್ಥ್ಯ ಕಾಣುವಂತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ.",
  "VITAL stores compressed reference thumbnails and visual features locally in this browser, separately for each medicine and strength. This is a visual similarity aid—not a medical-grade pill identifier. Lookalike pills may still pass; check the package/label every time. A visual check cannot prove ingestion.": "VITAL ಪ್ರತಿ ಔಷಧಿ ಮತ್ತು ಸಾಮರ್ಥ್ಯಕ್ಕೆ ಸಂಕುಚಿತ ಉಲ್ಲೇಖ ಚಿತ್ರಗಳು ಹಾಗೂ ದೃಶ್ಯ ಲಕ್ಷಣಗಳನ್ನು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಪ್ರತ್ಯೇಕವಾಗಿ ಉಳಿಸುತ್ತದೆ. ಇದು ನೋಟದ ಸಾಮ್ಯತೆ ಪರಿಶೀಲನೆಗೆ ಮಾತ್ರ—ವೈದ್ಯಕೀಯ ಮಟ್ಟದ ಮಾತ್ರೆ ಗುರುತಿಸುವಿಕೆ ಅಲ್ಲ. ಹೋಲುವ ಮಾತ್ರೆಗಳು ಹೊಂದಿಕೆಯಾಗಬಹುದು; ಪ್ರತಿಬಾರಿ ಪ್ಯಾಕೆಟ್/ಲೇಬಲ್ ಪರಿಶೀಲಿಸಿ. ದೃಶ್ಯ ಪರಿಶೀಲನೆ ಸೇವನೆಗೆ ಪುರಾವೆಯಲ್ಲ.",
  "Links open a live search for the parsed name and strength. Confirm brand, dosage, prescription requirement, and stock with the pharmacy.": "ಲಿಂಕ್‌ಗಳು ಗುರುತಿಸಿದ ಹೆಸರು ಮತ್ತು ಸಾಮರ್ಥ್ಯಕ್ಕಾಗಿ ನೇರ ಹುಡುಕಾಟ ತೆರೆಯುತ್ತವೆ. ಬ್ರ್ಯಾಂಡ್, ಡೋಸ್, ಚೀಟಿ ಅಗತ್ಯ ಮತ್ತು ಲಭ್ಯತೆಯನ್ನು ಔಷಧಾಲಯದಲ್ಲಿ ದೃಢೀಕರಿಸಿ.",
  "The last recorded status is kept below.": "ಕೊನೆಯದಾಗಿ ದಾಖಲಿಸಿದ ಸ್ಥಿತಿಯನ್ನು ಕೆಳಗೆ ಇಡಲಾಗಿದೆ.", "Describe symptoms, timing, and any change from usual.": "ಲಕ್ಷಣಗಳು, ಸಮಯ ಮತ್ತು ಸಾಮಾನ್ಯ ಸ್ಥಿತಿಯಿಂದ ಆಗಿರುವ ಬದಲಾವಣೆಯನ್ನು ವಿವರಿಸಿ.",
  "No emergency call has been placed. Use the button to open the phone dialer and call 112.": "ತುರ್ತು ಕರೆ ಮಾಡಲಾಗಿಲ್ಲ. ಫೋನ್ ಡಯಲರ್ ತೆರೆಯಲು ಮತ್ತು 112 ಗೆ ಕರೆ ಮಾಡಲು ಬಟನ್ ಬಳಸಿ.",
  "Saved in VITAL only. No emergency service or caretaker was contacted.": "VITAL ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗಿದೆ. ತುರ್ತು ಸೇವೆ ಅಥವಾ ಆರೈಕೆದಾರರನ್ನು ಸಂಪರ್ಕಿಸಿಲ್ಲ.",
  "For phone fallback, pair the VITAL Android app, enable Phone SMS there, and keep it open or its camera service running. Carrier fees may apply.": "ಫೋನ್ ಮೂಲಕ SMS ಕಳುಹಿಸಲು VITAL Android ಆ್ಯಪ್ ಜೋಡಿಸಿ, Phone SMS ಸಕ್ರಿಯಗೊಳಿಸಿ ಮತ್ತು ಆ್ಯಪ್ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಸೇವೆ ಚಾಲನೆಯಲ್ಲಿರಲಿ. ನೆಟ್‌ವರ್ಕ್ ಶುಲ್ಕ ಅನ್ವಯಿಸಬಹುದು.",
  "Caretaker message shortcuts are turned off in Settings.": "ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಆರೈಕೆದಾರರ ಸಂದೇಶ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳನ್ನು ಆಫ್ ಮಾಡಲಾಗಿದೆ.", "Emergency help activity": "ತುರ್ತು ಸಹಾಯ ಚಟುವಟಿಕೆ",
  "Get professional advice for a new, worsening, painful, or persistent concern—even if the image review looks reassuring. Contact emergency services for severe or rapidly worsening symptoms.": "ಹೊಸದು, ಹೆಚ್ಚಾಗುತ್ತಿರುವುದು, ನೋವುಂಟುಮಾಡುವುದು ಅಥವಾ ಮುಂದುವರಿಯುವ ಸಮಸ್ಯೆಗೆ ವೃತ್ತಿಪರ ಸಲಹೆ ಪಡೆಯಿರಿ—ಚಿತ್ರ ಪರಿಶೀಲನೆ ಸಮಾಧಾನಕರವಾಗಿದ್ದರೂ ಸಹ. ತೀವ್ರ ಅಥವಾ ವೇಗವಾಗಿ ಹೆಚ್ಚುವ ಲಕ್ಷಣಗಳಿಗೆ ತುರ್ತು ಸೇವೆ ಸಂಪರ್ಕಿಸಿ.",
  "Do not start leftover medicines or delay care based on an AI description. A qualified clinician can examine the person and decide what evaluation or treatment is appropriate.": "AI ವಿವರಣೆಯ ಆಧಾರದ ಮೇಲೆ ಉಳಿದ ಔಷಧಿ ಆರಂಭಿಸಬೇಡಿ ಅಥವಾ ಆರೈಕೆಯನ್ನು ಮುಂದೂಡಬೇಡಿ. ಅರ್ಹ ವೈದ್ಯರು ಪರೀಕ್ಷಿಸಿ ಸೂಕ್ತ ಮೌಲ್ಯಮಾಪನ ಅಥವಾ ಚಿಕಿತ್ಸೆ ನಿರ್ಧರಿಸಬಹುದು.",
  "This general guidance is based only on the information entered. It is not a diagnosis or a substitute for professional care.": "ಈ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ ನಮೂದಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಆಧರಿಸಿದೆ. ಇದು ರೋಗನಿರ್ಣಯ ಅಥವಾ ವೃತ್ತಿಪರ ಆರೈಕೆಯ ಪರ್ಯಾಯವಲ್ಲ.",
  "This simple check is not a medical assessment.": "ಈ ಸರಳ ಪರಿಶೀಲನೆ ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನವಲ್ಲ.", "With this health history, contact a clinician earlier about a new or worsening concern.": "ಈ ಆರೋಗ್ಯ ಇತಿಹಾಸದೊಂದಿಗೆ ಹೊಸ ಅಥವಾ ಹೆಚ್ಚಾಗುತ್ತಿರುವ ಸಮಸ್ಯೆಗೆ ವೈದ್ಯರನ್ನು ಬೇಗ ಸಂಪರ್ಕಿಸಿ.",
  "Seek emergency help if the person becomes very unwell, symptoms worsen rapidly, or any emergency warning sign appears.": "ವ್ಯಕ್ತಿಯ ಸ್ಥಿತಿ ತುಂಬಾ ಹದಗೆಟ್ಟರೆ, ಲಕ್ಷಣಗಳು ಬೇಗ ಹೆಚ್ಚಾದರೆ ಅಥವಾ ತುರ್ತು ಎಚ್ಚರಿಕೆ ಕಾಣಿಸಿದರೆ ತಕ್ಷಣ ಸಹಾಯ ಪಡೆಯಿರಿ.",
  "Download your VITAL profile, preferences, screening result, symptoms, medication records, appointments, and timeline as a JSON file.": "ನಿಮ್ಮ VITAL ಪ್ರೊಫೈಲ್, ಆಯ್ಕೆಗಳು, ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶ, ಲಕ್ಷಣಗಳು, ಔಷಧಿ ದಾಖಲೆಗಳು, ಭೇಟಿಗಳು ಮತ್ತು ಕಾಲರೇಖೆಯನ್ನು JSON ಫೈಲ್ ಆಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
  "This file contains sensitive health information. It stays on this device unless you choose to move or share it.": "ಈ ಫೈಲ್‌ನಲ್ಲಿ ಸೂಕ್ಷ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಇದೆ. ನೀವು ಸ್ಥಳಾಂತರಿಸುವ ಅಥವಾ ಹಂಚಿಕೊಳ್ಳುವವರೆಗೆ ಇದು ಈ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತದೆ.",
  "VITAL uses Twilio when a sender is ready. Otherwise, messages queue for the paired Android phone’s SIM. Phone submission is not proof of carrier delivery.": "ಕಳುಹಿಸುವ ವ್ಯವಸ್ಥೆ ಸಿದ್ಧವಿದ್ದರೆ VITAL Twilio ಬಳಸುತ್ತದೆ. ಇಲ್ಲದಿದ್ದರೆ ಸಂದೇಶಗಳು ಜೋಡಿಸಿದ Android ಫೋನ್‌ನ SIM ಸರದಿಯಲ್ಲಿ ಇರುತ್ತವೆ. ಫೋನ್ ಸಲ್ಲಿಕೆ ನೆಟ್‌ವರ್ಕ್ ಡೆಲಿವರಿಗೆ ಪುರಾವೆಯಲ್ಲ.",
  "Last daily health tip submitted or queued:": "ದೈನಂದಿನ ಆರೋಗ್ಯ ಸಲಹೆ ಕೊನೆಯದಾಗಿ ಕಳುಹಿಸಿದ ಅಥವಾ ಸರದಿಯಲ್ಲಿ ಇರಿಸಿದ ಸಮಯ:", "Last reminder submitted or queued:": "ಜ್ಞಾಪನೆ ಕೊನೆಯದಾಗಿ ಕಳುಹಿಸಿದ ಅಥವಾ ಸರದಿಯಲ್ಲಿ ಇರಿಸಿದ ಸಮಯ:",
  "Switch visual theme": "ಬಣ್ಣದ ಥೀಮ್ ಬದಲಿಸಿ", "Attention & connections": "ಗಮನ ಮತ್ತು ಸಂಪರ್ಕಗಳು", "Health analytics": "ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ", "Health data charts": "ಆರೋಗ್ಯ ಡೇಟಾ ಚಾರ್ಟ್‌ಗಳು",
  "Health nudge controls": "ಆರೋಗ್ಯ ಸಲಹೆ ನಿಯಂತ್ರಣಗಳು", "Monitoring preferences": "ಮೇಲ್ವಿಚಾರಣಾ ಆಯ್ಕೆಗಳು", "Your data backup": "ನಿಮ್ಮ ಡೇಟಾ ಬ್ಯಾಕಪ್", "Your health timeline": "ನಿಮ್ಮ ಆರೋಗ್ಯ ಕಾಲರೇಖೆ",
  "Your medication schedule": "ನಿಮ್ಮ ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ", "Your planned visits": "ನಿಮ್ಮ ಯೋಜಿತ ಭೇಟಿಗಳು", "Recent activity overview": "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ ಅವಲೋಕನ", "Everyday health precautions": "ದೈನಂದಿನ ಆರೋಗ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು",
  "Your recognized words will appear here. You can also type a phrase.": "ಗುರುತಿಸಿದ ಪದಗಳು ಇಲ್ಲಿ ಕಾಣುತ್ತವೆ. ನೀವು ವಾಕ್ಯವನ್ನೂ ಟೈಪ್ ಮಾಡಬಹುದು.", "Speech or typed phrase capture": "ಮಾತು ಅಥವಾ ಟೈಪ್ ಮಾಡಿದ ವಾಕ್ಯ ದಾಖಲಿಸಿ",
  "Voice questions are transcribed locally by VITAL. Audio is not sent to a browser speech service.": "ಧ್ವನಿ ಪ್ರಶ್ನೆಗಳನ್ನು VITAL ಸ್ಥಳೀಯವಾಗಿ ಪಠ್ಯಕ್ಕೆ ಬದಲಿಸುತ್ತದೆ. ಆಡಿಯೋವನ್ನು ಬ್ರೌಸರ್‌ನ ವಾಕ್ಸೇವೆಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
  "Local speech when supported": "ಬೆಂಬಲವಿದ್ದಾಗ ಸ್ಥಳೀಯ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ", "Feeds the triage score": "ಪರಿಶೀಲನಾ ಅಂಕಕ್ಕೆ ಬಳಸುತ್ತದೆ", "Quick tour of VITAL": "VITAL ನ ಸಂಕ್ಷಿಪ್ತ ಪರಿಚಯ",
  "Start a new conversation": "ಹೊಸ ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ", "Cancel response": "ಉತ್ತರ ರದ್ದುಮಾಡಿ", "Close assistant": "ಸಹಾಯಕ ಮುಚ್ಚಿ", "Listen to this reply": "ಈ ಉತ್ತರ ಕೇಳಿ", "New chat": "ಹೊಸ ಚಾಟ್",
  "Phone access is off. Close this VITAL session and reopen": "ಫೋನ್ ಪ್ರವೇಶ ಆಫ್ ಆಗಿದೆ. ಈ VITAL ಸೆಷನ್ ಮುಚ್ಚಿ ಮತ್ತೆ ತೆರೆಯಿರಿ",
  ", then refresh this page.": ", ನಂತರ ಈ ಪುಟವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ.", "Primary number is taken from Patient profile:": "ಮುಖ್ಯ ಸಂಖ್ಯೆಯನ್ನು ರೋಗಿಯ ಪ್ರೊಫೈಲ್‌ನಿಂದ ಪಡೆಯಲಾಗಿದೆ:",
  "Package label ·": "ಪ್ಯಾಕೆಟ್ ಲೇಬಲ್ ·", "OCR name:": "OCR ಹೆಸರು:", "Measurement time:": "ಮಾಪನ ಸಮಯ:", "Sources:": "ಮೂಲಗಳು:", "Time": "ಸಮಯ", "Date": "ದಿನಾಂಕ", "Reason": "ಕಾರಣ", "Department": "ವಿಭಾಗ", "Hospital": "ಆಸ್ಪತ್ರೆ",
  "Recent activity": "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ", "Recorded": "ದಾಖಲಿಸಲಾಗಿದೆ", "Verified": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ", "Pending": "ಬಾಕಿ", "Prepared": "ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ",
  "Review screening": "ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶ ನೋಡಿ", "Review symptoms & vitals": "ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳನ್ನು ನೋಡಿ", "See all": "ಎಲ್ಲವನ್ನೂ ನೋಡಿ", "Next health nudge": "ಮುಂದಿನ ಆರೋಗ್ಯ ಸಲಹೆ", "Previous health nudge": "ಹಿಂದಿನ ಆರೋಗ್ಯ ಸಲಹೆ"
});

Object.assign(translations.hi, { Remove: "हटाएँ", "Remove this medicine from the prescription draft": "नुस्खे के मसौदे से यह दवा हटाएँ" });
Object.assign(translations.kn, { Remove: "ತೆಗೆದುಹಾಕಿ", "Remove this medicine from the prescription draft": "ಔಷಧ ಚೀಟಿಯ ಕರಡಿನಿಂದ ಈ ಔಷಧಿ ತೆಗೆದುಹಾಕಿ" });

Object.assign(translations.hi, {
  "Try again": "फिर कोशिश करें", "Need review": "समीक्षा ज़रूरी", "Needs review": "समीक्षा ज़रूरी", "Openverse · manual confirmation required": "Openverse · मैन्युअल पुष्टि आवश्यक",
  "Prescription photos are processed by the local Ollama model on this computer. Review and correct the extracted text before analyzing; handwritten or unclear details must be checked against the original. VITAL never fills in missing dose times.": "नुस्खे की फ़ोटो इसी कंप्यूटर पर स्थानीय Ollama मॉडल से संसाधित होती हैं। विश्लेषण से पहले निकाले गए टेक्स्ट की समीक्षा और सुधार करें; हस्तलिखित या अस्पष्ट विवरण मूल नुस्खे से जाँचें। VITAL खुराक का छूटा हुआ समय कभी स्वयं नहीं भरता।",
  "Any matching values above were filled from Health Connect (": "ऊपर के मेल खाते मान Health Connect से भरे गए थे (",
  ". Check that each reading is current; watch records can be older. Missing measurements remain blank.": ")। जाँचें कि हर माप वर्तमान है; वॉच रिकॉर्ड पुराने हो सकते हैं। अनुपलब्ध माप खाली रहेंगे।",
  ". In Health Connect, allow Google Fit to write data and VITAL to read it.": "। Health Connect में Google Fit को डेटा लिखने और VITAL को पढ़ने की अनुमति दें।",
  ". Up to two additional numbers can be added here. Use international format.": "। यहाँ अधिकतम दो अतिरिक्त नंबर जोड़ें। अंतरराष्ट्रीय फ़ॉर्मैट इस्तेमाल करें।",
  ". VITAL cannot confirm that the handset received or displayed it.": "। VITAL यह पुष्टि नहीं कर सकता कि संदेश फ़ोन तक पहुँचा या वहाँ दिखा।",
  "· Compare every detail with the doctor’s original prescription. Your schedule saves on this device.": "· हर विवरण डॉक्टर के मूल नुस्खे से मिलाएँ। समय-सारणी इसी डिवाइस पर सहेजी जाती है।",
  "· Confidence:": "· विश्वास स्तर:", "· Keyword check: typed or speech transcript.": "· कीवर्ड जाँच: टाइप किया टेक्स्ट या वाक्-लिप्यंतरण।",
  "· Possible fall flagged": "· संभावित गिरावट का अलर्ट", "· Strength:": "· ताकत:", "· handset delivery is not confirmed.": "· फ़ोन तक डिलीवरी की पुष्टि नहीं हुई।",
  "· to number ending": "· इस नंबर पर, जिसके अंतिम अंक हैं", "Compare every detail with the doctor’s original prescription. Your schedule saves on this device.": "हर विवरण डॉक्टर के मूल नुस्खे से मिलाएँ। आपकी समय-सारणी इसी डिवाइस पर सहेजी जाती है।",
  "prescribed dose check-ins": "निर्धारित खुराक के चेक-इन", "dose records": "खुराक रिकॉर्ड", "reference photos": "संदर्भ फ़ोटो", "photo checked": "फ़ोटो जाँची गई", "marked taken": "ली गई के रूप में दर्ज", "need review": "समीक्षा ज़रूरी", "compared with enrolled views": "सहेजे गए संदर्भ दृश्यों से तुलना", "confirm printed name and strength": "छपे नाम और ताकत की पुष्टि करें"
});

Object.assign(translations.kn, {
  "Try again": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "Need review": "ಪರಿಶೀಲನೆ ಅಗತ್ಯ", "Needs review": "ಪರಿಶೀಲನೆ ಅಗತ್ಯ", "Openverse · manual confirmation required": "Openverse · ಕೈಯಾರೆ ದೃಢೀಕರಣ ಅಗತ್ಯ",
  "Prescription photos are processed by the local Ollama model on this computer. Review and correct the extracted text before analyzing; handwritten or unclear details must be checked against the original. VITAL never fills in missing dose times.": "ಔಷಧ ಚೀಟಿಯ ಫೋಟೋಗಳನ್ನು ಈ ಕಂಪ್ಯೂಟರ್‌ನ ಸ್ಥಳೀಯ Ollama ಮಾದರಿ ಸಂಸ್ಕರಿಸುತ್ತದೆ. ವಿಶ್ಲೇಷಿಸುವ ಮೊದಲು ಪಡೆದ ಪಠ್ಯ ಪರಿಶೀಲಿಸಿ ಸರಿಪಡಿಸಿ; ಕೈಬರಹ ಅಥವಾ ಅಸ್ಪಷ್ಟ ವಿವರಗಳನ್ನು ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ. VITAL ಕಾಣೆಯಾದ ಡೋಸ್ ಸಮಯವನ್ನು ಎಂದಿಗೂ ಊಹಿಸಿ ತುಂಬುವುದಿಲ್ಲ.",
  "Any matching values above were filled from Health Connect (": "ಮೇಲಿನ ಹೊಂದಾಣಿಕೆಯ ಮೌಲ್ಯಗಳನ್ನು Health Connect ನಿಂದ ತುಂಬಲಾಗಿದೆ (",
  ". Check that each reading is current; watch records can be older. Missing measurements remain blank.": ")। ಪ್ರತಿ ಮಾಪನ ಇತ್ತೀಚಿನದೆಯೇ ಪರಿಶೀಲಿಸಿ; ವಾಚ್ ದಾಖಲೆ ಹಳೆಯದಾಗಿರಬಹುದು. ಲಭ್ಯವಿಲ್ಲದ ಮಾಪನಗಳು ಖಾಲಿಯಾಗಿರುತ್ತವೆ.",
  ". In Health Connect, allow Google Fit to write data and VITAL to read it.": "। Health Connect ನಲ್ಲಿ Google Fit ಗೆ ಡೇಟಾ ಬರೆಯಲು ಮತ್ತು VITAL ಗೆ ಓದಲು ಅನುಮತಿಸಿ.",
  ". Up to two additional numbers can be added here. Use international format.": "। ಇಲ್ಲಿ ಎರಡು ಹೆಚ್ಚುವರಿ ಸಂಖ್ಯೆಗಳನ್ನು ಸೇರಿಸಬಹುದು. ಅಂತರರಾಷ್ಟ್ರೀಯ ಸ್ವರೂಪ ಬಳಸಿ.",
  ". VITAL cannot confirm that the handset received or displayed it.": "। ಫೋನ್ ಸಂದೇಶ ಸ್ವೀಕರಿಸಿದೆಯೇ ಅಥವಾ ತೋರಿಸಿದೆಯೇ ಎಂದು VITAL ದೃಢಪಡಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
  "· Compare every detail with the doctor’s original prescription. Your schedule saves on this device.": "· ಪ್ರತಿಯೊಂದು ವಿವರವನ್ನು ವೈದ್ಯರ ಮೂಲ ಚೀಟಿಯೊಂದಿಗೆ ಹೋಲಿಸಿ. ವೇಳಾಪಟ್ಟಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.",
  "· Confidence:": "· ವಿಶ್ವಾಸ ಮಟ್ಟ:", "· Keyword check: typed or speech transcript.": "· ಕೀವರ್ಡ್ ಪರಿಶೀಲನೆ: ಟೈಪ್ ಮಾಡಿದ ಅಥವಾ ಧ್ವನಿ ಲಿಪ್ಯಂತರ.",
  "· Possible fall flagged": "· ಸಂಭಾವ್ಯ ಬೀಳುವಿಕೆ ಎಚ್ಚರಿಕೆ", "· Strength:": "· ಸಾಮರ್ಥ್ಯ:", "· handset delivery is not confirmed.": "· ಫೋನ್‌ಗೆ ತಲುಪಿರುವುದು ದೃಢಪಟ್ಟಿಲ್ಲ.",
  "· to number ending": "· ಈ ಕೊನೆಯ ಅಂಕೆಗಳ ಸಂಖ್ಯೆಗೆ", "Compare every detail with the doctor’s original prescription. Your schedule saves on this device.": "ಪ್ರತಿಯೊಂದು ವಿವರವನ್ನು ವೈದ್ಯರ ಮೂಲ ಔಷಧ ಚೀಟಿಯೊಂದಿಗೆ ಹೋಲಿಸಿ. ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.",
  "prescribed dose check-ins": "ನಿಗದಿತ ಡೋಸ್ ಚೆಕ್-ಇನ್‌ಗಳು", "dose records": "ಡೋಸ್ ದಾಖಲೆಗಳು", "reference photos": "ಉಲ್ಲೇಖ ಫೋಟೋಗಳು", "photo checked": "ಫೋಟೋ ಪರಿಶೀಲಿಸಲಾಗಿದೆ", "marked taken": "ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ", "need review": "ಪರಿಶೀಲನೆ ಅಗತ್ಯ", "compared with enrolled views": "ಉಳಿಸಿದ ಉಲ್ಲೇಖ ಚಿತ್ರಗಳೊಂದಿಗೆ ಹೋಲಿಸಲಾಗಿದೆ", "confirm printed name and strength": "ಮುದ್ರಿತ ಹೆಸರು ಮತ್ತು ಸಾಮರ್ಥ್ಯ ದೃಢೀಕರಿಸಿ"
});

Object.assign(translations.hi, {
  "A summary of the information recorded in VITAL to help you prepare for a conversation with your care team.": "आपकी देखभाल टीम से बातचीत की तैयारी में मदद के लिए VITAL में दर्ज जानकारी का सारांश।",
  "Additional emergency contact": "अतिरिक्त आपातकालीन संपर्क", "Auto-scan in the selected dose window": "चुने गए खुराक समय में अपने आप स्कैन करें", "Awaiting caregiver check-in": "देखभालकर्ता के चेक-इन की प्रतीक्षा है",
  "Basal metabolic rate": "मूल चयापचय दर", "Based on the symptoms and readings you entered · not a diagnosis": "आपके दर्ज लक्षणों और माप पर आधारित · निदान नहीं", "Body temperature": "शरीर का तापमान", "Caregiver check-in:": "देखभालकर्ता चेक-इन:",
  "Choose a VITAL backup JSON file": "VITAL बैकअप JSON फ़ाइल चुनें", "Choose a health photo": "स्वास्थ्य फ़ोटो चुनें", "Close preview": "पूर्वावलोकन बंद करें", Confirmed: "पुष्टि की गई",
  "Connect your Android phone": "अपना Android फ़ोन कनेक्ट करें", "DAILY CHECK-IN": "रोज़ाना चेक-इन", "DAILY HEALTH NUDGE": "रोज़ाना स्वास्थ्य सुझाव", "Dismiss": "ख़ारिज करें", "Dismiss medicine reminder": "दवा रिमाइंडर हटाएँ", "Distress signal": "संकट संकेत",
  Done: "हो गया", "Emergency Review": "आपातकालीन समीक्षा", Exit: "बाहर जाएँ", "Fall alert setup": "गिरावट अलर्ट सेटअप", "Filter timeline by activity": "गतिविधि के अनुसार समयरेखा फ़िल्टर करें",
  "For discussion with a healthcare professional · Generated": "स्वास्थ्य पेशेवर से चर्चा के लिए · तैयार किया गया", "Health report pages": "स्वास्थ्य रिपोर्ट पृष्ठ", Height: "कद", "Hospital directory": "अस्पताल सूची", IMPORTANT: "महत्वपूर्ण",
  "In the Android app, enter the address and code, then press Start. You may lock the phone afterward; its persistent notification includes a Stop control.": "Android ऐप में पता और कोड दर्ज करें, फिर Start दबाएँ। इसके बाद फ़ोन लॉक कर सकते हैं; स्थायी सूचना में Stop नियंत्रण होगा।",
  "Marked taken by you": "आपने लिया हुआ दर्ज किया", "Medication tracker": "दवा ट्रैकर", "Medicine reminder": "दवा रिमाइंडर", "Message on WhatsApp": "WhatsApp पर संदेश भेजें", "Mobile message": "मोबाइल संदेश",
  "Open the dialer to call 112": "112 पर कॉल करने के लिए डायलर खोलें", "Open phone connection": "फ़ोन कनेक्शन खोलें", "Open phone connection settings": "फ़ोन कनेक्शन सेटिंग खोलें", "PAIR CODE · expires": "पेयर कोड · समाप्त होगा",
  "Paste prescription text: medicine, dose, frequency, timing": "नुस्खे का टेक्स्ट चिपकाएँ: दवा, खुराक, आवृत्ति, समय", "Phone camera monitor": "फ़ोन कैमरा मॉनिटर", "Phone detection:": "फ़ोन पहचान:", "Photo checked": "फ़ोटो जाँची गई",
  "Photo is processed by Ollama on this computer and is not saved to VITAL’s health record. Remove faces, labels, and other identifying details where possible.": "फ़ोटो इसी कंप्यूटर पर Ollama से संसाधित होती है और VITAL स्वास्थ्य रिकॉर्ड में सहेजी नहीं जाती। जहाँ संभव हो, चेहरे, लेबल और पहचान बताने वाली जानकारी हटा दें।",
  "Plan a hospital visit": "अस्पताल मुलाक़ात की योजना बनाएँ", "Possible-fall alert history": "संभावित गिरावट अलर्ट इतिहास", "Prepared for": "इनके लिए तैयार", "Prescribed medicine to check": "जाँचने के लिए निर्धारित दवा",
  "Prescription-linked tablet check": "नुस्खे से जुड़ी टैबलेट जाँच", "Preview a report of information recorded in VITAL. Unavailable and unreported values are identified as such.": "VITAL में दर्ज जानकारी की रिपोर्ट देखें। अनुपलब्ध और दर्ज न किए गए मानों को उसी रूप में दिखाया जाएगा।",
  "Recent care activity": "हाल की देखभाल गतिविधि", "Recent monitoring activity": "हाल की निगरानी गतिविधि", "Recorded schedule · check against your prescription": "दर्ज समय-सारणी · अपने नुस्खे से मिलाएँ", "Recorded vital readings": "दर्ज स्वास्थ्य माप",
  Reference: "संदर्भ", "Reminder saved in VITAL; contact the hospital to confirm.": "रिमाइंडर VITAL में सहेजा गया; पुष्टि के लिए अस्पताल से संपर्क करें।", "Remove photo": "फ़ोटो हटाएँ", Respiration: "श्वसन दर",
  "Review alert": "अलर्ट देखें", "Review the report pages, then download the PDF when you’re ready.": "रिपोर्ट के पृष्ठ देखें, फिर तैयार होने पर PDF डाउनलोड करें।", "Reviewing photo…": "फ़ोटो की समीक्षा हो रही है…", "Revoke phone access": "फ़ोन की पहुँच हटाएँ", "SMS delivery status": "SMS डिलीवरी स्थिति", "SMS:": "SMS:",
  "START VITAL - PHONE CAMERA.cmd": "START VITAL - PHONE CAMERA.cmd", "Scores are recorded screening estimates. Changes alone do not diagnose a condition.": "स्कोर दर्ज किए गए जाँच अनुमान हैं। केवल बदलाव से बीमारी का निदान नहीं होता।", "Search activity…": "गतिविधि खोजें…",
  "See your check-ins and care activity at a glance. Repeated voice checks are grouped by day.": "अपने चेक-इन और देखभाल गतिविधि एक नज़र में देखें। बार-बार की आवाज़ जाँच दिन के अनुसार समूहित हैं।", "Sign out of VITAL": "VITAL से साइन आउट करें", "Speech transcript or typed text": "वाक्-लिप्यंतरण या टाइप किया टेक्स्ट", "Start countdown": "उलटी गिनती शुरू करें", "Symptoms and vitals": "लक्षण और स्वास्थ्य माप", "Systolic BP": "सिस्टोलिक रक्तचाप", "Tablet image matched": "टैबलेट की फ़ोटो मेल खाई",
  Theme: "थीम", "These are generated visual observations, not verified findings. Check them against the photo yourself.": "ये स्वचालित दृश्य टिप्पणियाँ हैं, सत्यापित निष्कर्ष नहीं। इन्हें फ़ोटो से स्वयं मिलाएँ।",
  "This report is based on information saved in VITAL. It is not a diagnosis or a substitute for professional medical advice.": "यह रिपोर्ट VITAL में सहेजी जानकारी पर आधारित है। यह निदान या पेशेवर चिकित्सकीय सलाह का विकल्प नहीं है।",
  "Triage output": "जाँच का परिणाम", "Triage score trend": "जाँच स्कोर का रुझान", "Twilio error code": "Twilio त्रुटि कोड", "Use Windows voice typing · Win+H": "Windows वॉइस टाइपिंग इस्तेमाल करें · Win+H",
  "VITAL considers the symptoms and readings you entered to estimate the level of concern.": "VITAL चिंता के स्तर का अनुमान लगाने के लिए आपके दर्ज लक्षणों और माप पर विचार करता है।", "VITAL health assistant": "VITAL स्वास्थ्य सहायक", "VITAL modules": "VITAL सुविधाएँ", "VITAL screening estimate": "VITAL जाँच अनुमान",
  "VITAL service connection; this does not indicate that a watch is connected": "VITAL सेवा कनेक्शन; इसका अर्थ यह नहीं कि वॉच कनेक्ट है", "View wearables": "वियरेबल देखें", "Voice check:": "आवाज़ जाँच:", "Voice distress check": "आवाज़ से संकट जाँच", "Voice distress detector": "आवाज़ संकट पहचान", "Volume score:": "आवाज़ स्तर स्कोर:", "Walkthrough progress": "परिचय की प्रगति", "Wearable wellness bridge": "वियरेबल स्वास्थ्य कनेक्शन", "Web reference candidates": "वेब संदर्भ विकल्प", Weight: "वज़न",
  "Wellness context only; not a medical measurement.": "केवल स्वास्थ्य संदर्भ; चिकित्सकीय माप नहीं।", "What does the photo show?": "फ़ोटो में क्या दिख रहा है?", "What’s in your report": "आपकी रिपोर्ट में क्या है", "YOUR VITAL TOUR · STEP": "VITAL परिचय · चरण",
  "You can use the symptom check and precaution guide below without a photo.": "आप फ़ोटो के बिना नीचे लक्षण जाँच और सावधानी गाइड इस्तेमाल कर सकते हैं।", "Your recent activity is saved in this browser. It may be incomplete; share it with a clinician as a reference.": "आपकी हाल की गतिविधि इस ब्राउज़र में सहेजी गई है। यह अधूरी हो सकती है; डॉक्टर से चर्चा के संदर्भ के लिए साझा करें।",
  "Compare every detail with the doctor’s original prescription. Your schedule saves on this device.": "हर विवरण डॉक्टर के मूल नुस्खे से मिलाएँ। आपकी समय-सारणी इसी डिवाइस पर सहेजी जाती है।", "Keyword check: typed or speech transcript.": "कीवर्ड जाँच: टाइप किया टेक्स्ट या वाक्-लिप्यंतरण।", "Possible fall flagged": "संभावित गिरावट का अलर्ट", "handset delivery is not confirmed.": "फ़ोन पर डिलीवरी की पुष्टि नहीं हुई।"
});

Object.assign(translations.kn, {
  "A summary of the information recorded in VITAL to help you prepare for a conversation with your care team.": "ನಿಮ್ಮ ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಮಾತನಾಡಲು ಸಿದ್ಧರಾಗಲು VITAL ನಲ್ಲಿ ದಾಖಲಿಸಿದ ಮಾಹಿತಿಯ ಸಾರಾಂಶ.",
  "Additional emergency contact": "ಹೆಚ್ಚುವರಿ ತುರ್ತು ಸಂಪರ್ಕ", "Auto-scan in the selected dose window": "ಆಯ್ದ ಡೋಸ್ ಸಮಯದಲ್ಲಿ ಸ್ವಯಂ ಸ್ಕ್ಯಾನ್", "Awaiting caregiver check-in": "ಆರೈಕೆದಾರರ ಚೆಕ್-ಇನ್‌ಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "Basal metabolic rate": "ಮೂಲ ಚಯಾಪಚಯ ದರ", "Based on the symptoms and readings you entered · not a diagnosis": "ನೀವು ನಮೂದಿಸಿದ ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳ ಆಧಾರ · ರೋಗನಿರ್ಣಯವಲ್ಲ", "Body temperature": "ದೇಹದ ತಾಪಮಾನ", "Caregiver check-in:": "ಆರೈಕೆದಾರರ ಚೆಕ್-ಇನ್:",
  "Choose a VITAL backup JSON file": "VITAL ಬ್ಯಾಕಪ್ JSON ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ", "Choose a health photo": "ಆರೋಗ್ಯ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ", "Close preview": "ಪೂರ್ವವೀಕ್ಷಣೆ ಮುಚ್ಚಿ", Confirmed: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
  "Connect your Android phone": "ನಿಮ್ಮ Android ಫೋನ್ ಸಂಪರ್ಕಿಸಿ", "DAILY CHECK-IN": "ದೈನಂದಿನ ಚೆಕ್-ಇನ್", "DAILY HEALTH NUDGE": "ದೈನಂದಿನ ಆರೋಗ್ಯ ಸಲಹೆ", "Dismiss": "ವಜಾಗೊಳಿಸಿ", "Dismiss medicine reminder": "ಔಷಧಿ ಜ್ಞಾಪನೆ ವಜಾಗೊಳಿಸಿ", "Distress signal": "ಸಂಕಟ ಸೂಚನೆ",
  Done: "ಮುಗಿದಿದೆ", "Emergency Review": "ತುರ್ತು ಪರಿಶೀಲನೆ", Exit: "ನಿರ್ಗಮಿಸಿ", "Fall alert setup": "ಬೀಳುವಿಕೆ ಎಚ್ಚರಿಕೆ ಸೆಟಪ್", "Filter timeline by activity": "ಚಟುವಟಿಕೆಯಂತೆ ಕಾಲರೇಖೆ ಫಿಲ್ಟರ್ ಮಾಡಿ",
  "For discussion with a healthcare professional · Generated": "ಆರೋಗ್ಯ ವೃತ್ತಿಪರರೊಂದಿಗೆ ಚರ್ಚಿಸಲು · ರಚಿಸಲಾಗಿದೆ", "Health report pages": "ಆರೋಗ್ಯ ವರದಿ ಪುಟಗಳು", Height: "ಎತ್ತರ", "Hospital directory": "ಆಸ್ಪತ್ರೆಗಳ ಪಟ್ಟಿ", IMPORTANT: "ಮುಖ್ಯ",
  "In the Android app, enter the address and code, then press Start. You may lock the phone afterward; its persistent notification includes a Stop control.": "Android ಆ್ಯಪ್‌ನಲ್ಲಿ ವಿಳಾಸ ಮತ್ತು ಕೋಡ್ ನಮೂದಿಸಿ, ನಂತರ Start ಒತ್ತಿ. ಬಳಿಕ ಫೋನ್ ಲಾಕ್ ಮಾಡಬಹುದು; ಅದರ ಸ್ಥಿರ ಅಧಿಸೂಚನೆಯಲ್ಲಿ Stop ನಿಯಂತ್ರಣವಿದೆ.",
  "Marked taken by you": "ನೀವು ತೆಗೆದುಕೊಂಡಿದ್ದಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ", "Medication tracker": "ಔಷಧಿ ಟ್ರ್ಯಾಕರ್", "Medicine reminder": "ಔಷಧಿ ಜ್ಞಾಪನೆ", "Message on WhatsApp": "WhatsApp ನಲ್ಲಿ ಸಂದೇಶ", "Mobile message": "ಮೊಬೈಲ್ ಸಂದೇಶ",
  "Open the dialer to call 112": "112 ಗೆ ಕರೆ ಮಾಡಲು ಡಯಲರ್ ತೆರೆಯಿರಿ", "Open phone connection": "ಫೋನ್ ಸಂಪರ್ಕ ತೆರೆಯಿರಿ", "Open phone connection settings": "ಫೋನ್ ಸಂಪರ್ಕ ಸೆಟ್ಟಿಂಗ್ ತೆರೆಯಿರಿ", "PAIR CODE · expires": "ಜೋಡಣೆ ಕೋಡ್ · ಅವಧಿ ಮುಗಿಯುತ್ತದೆ",
  "Paste prescription text: medicine, dose, frequency, timing": "ಔಷಧ ಚೀಟಿ ಪಠ್ಯ ಅಂಟಿಸಿ: ಔಷಧಿ, ಡೋಸ್, ಆವರ್ತನೆ, ಸಮಯ", "Phone camera monitor": "ಫೋನ್ ಕ್ಯಾಮೆರಾ ಮಾನಿಟರ್", "Phone detection:": "ಫೋನ್ ಪತ್ತೆ:", "Photo checked": "ಫೋಟೋ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
  "Photo is processed by Ollama on this computer and is not saved to VITAL’s health record. Remove faces, labels, and other identifying details where possible.": "ಫೋಟೋವನ್ನು ಈ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ Ollama ಸಂಸ್ಕರಿಸುತ್ತದೆ; VITAL ಆರೋಗ್ಯ ದಾಖಲೆಯಲ್ಲಿ ಉಳಿಸುವುದಿಲ್ಲ. ಸಾಧ್ಯವಾದರೆ ಮುಖ, ಲೇಬಲ್ ಮತ್ತು ಗುರುತಿಸಬಹುದಾದ ವಿವರಗಳನ್ನು ತೆಗೆದುಹಾಕಿ.",
  "Plan a hospital visit": "ಆಸ್ಪತ್ರೆ ಭೇಟಿಯನ್ನು ಯೋಜಿಸಿ", "Possible-fall alert history": "ಸಂಭಾವ್ಯ ಬೀಳುವಿಕೆ ಎಚ್ಚರಿಕೆ ಇತಿಹಾಸ", "Prepared for": "ಇವರಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ", "Prescribed medicine to check": "ಪರಿಶೀಲಿಸಬೇಕಾದ ನಿಗದಿತ ಔಷಧಿ",
  "Prescription-linked tablet check": "ಔಷಧ ಚೀಟಿಗೆ ಜೋಡಿಸಿದ ಮಾತ್ರೆ ಪರಿಶೀಲನೆ", "Preview a report of information recorded in VITAL. Unavailable and unreported values are identified as such.": "VITAL ನಲ್ಲಿ ದಾಖಲಿಸಿದ ಮಾಹಿತಿಯ ವರದಿ ಪೂರ್ವವೀಕ್ಷಿಸಿ. ಲಭ್ಯವಿಲ್ಲದ ಮತ್ತು ವರದಿಯಾಗದ ಮೌಲ್ಯಗಳನ್ನು ಹಾಗೆಯೇ ಗುರುತಿಸಲಾಗುತ್ತದೆ.",
  "Recent care activity": "ಇತ್ತೀಚಿನ ಆರೈಕೆ ಚಟುವಟಿಕೆ", "Recent monitoring activity": "ಇತ್ತೀಚಿನ ಮೇಲ್ವಿಚಾರಣಾ ಚಟುವಟಿಕೆ", "Recorded schedule · check against your prescription": "ದಾಖಲಿಸಿದ ವೇಳಾಪಟ್ಟಿ · ಔಷಧ ಚೀಟಿಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ", "Recorded vital readings": "ದಾಖಲಿಸಿದ ಆರೋಗ್ಯ ಮಾಪನಗಳು",
  Reference: "ಉಲ್ಲೇಖ", "Reminder saved in VITAL; contact the hospital to confirm.": "ಜ್ಞಾಪನೆ VITAL ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ; ದೃಢೀಕರಿಸಲು ಆಸ್ಪತ್ರೆಗೆ ಸಂಪರ್ಕಿಸಿ.", "Remove photo": "ಫೋಟೋ ತೆಗೆದುಹಾಕಿ", Respiration: "ಉಸಿರಾಟದ ದರ",
  "Review alert": "ಎಚ್ಚರಿಕೆ ಪರಿಶೀಲಿಸಿ", "Review the report pages, then download the PDF when you’re ready.": "ವರದಿ ಪುಟಗಳನ್ನು ನೋಡಿ, ಸಿದ್ಧವಾದಾಗ PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.", "Reviewing photo…": "ಫೋಟೋ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…", "Revoke phone access": "ಫೋನ್ ಪ್ರವೇಶ ಹಿಂಪಡೆಯಿರಿ", "SMS delivery status": "SMS ವಿತರಣೆಯ ಸ್ಥಿತಿ", "SMS:": "SMS:",
  "START VITAL - PHONE CAMERA.cmd": "START VITAL - PHONE CAMERA.cmd", "Scores are recorded screening estimates. Changes alone do not diagnose a condition.": "ಅಂಕಗಳು ದಾಖಲಿಸಿದ ಪರಿಶೀಲನಾ ಅಂದಾಜುಗಳು. ಬದಲಾವಣೆ ಮಾತ್ರದಿಂದ ರೋಗನಿರ್ಣಯ ಆಗುವುದಿಲ್ಲ.", "Search activity…": "ಚಟುವಟಿಕೆ ಹುಡುಕಿ…",
  "See your check-ins and care activity at a glance. Repeated voice checks are grouped by day.": "ನಿಮ್ಮ ಚೆಕ್-ಇನ್ ಮತ್ತು ಆರೈಕೆ ಚಟುವಟಿಕೆಯನ್ನು ಒಂದೇ ನೋಟದಲ್ಲಿ ನೋಡಿ. ಮರುಕಳಿಸಿದ ಧ್ವನಿ ಪರಿಶೀಲನೆಗಳನ್ನು ದಿನದಂತೆ ಗುಂಪು ಮಾಡಲಾಗಿದೆ.", "Sign out of VITAL": "VITAL ನಿಂದ ಸೈನ್ ಔಟ್ ಮಾಡಿ", "Speech transcript or typed text": "ಧ್ವನಿ ಲಿಪ್ಯಂತರ ಅಥವಾ ಟೈಪ್ ಮಾಡಿದ ಪಠ್ಯ", "Start countdown": "ಕೌಂಟ್‌ಡೌನ್ ಪ್ರಾರಂಭಿಸಿ", "Symptoms and vitals": "ಲಕ್ಷಣಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಮಾಪನಗಳು", "Systolic BP": "ಸಿಸ್ಟೋಲಿಕ್ ರಕ್ತದೊತ್ತಡ", "Tablet image matched": "ಮಾತ್ರೆಯ ಚಿತ್ರ ಹೊಂದಿಕೆಯಾಗಿದೆ",
  Theme: "ಥೀಮ್", "These are generated visual observations, not verified findings. Check them against the photo yourself.": "ಇವು ರಚಿಸಿದ ದೃಶ್ಯ ಗಮನಿಕೆಗಳು, ದೃಢೀಕೃತ ಕಂಡುಬಂದ ಅಂಶಗಳಲ್ಲ. ಫೋಟೋದೊಂದಿಗೆ ನೀವೇ ಹೋಲಿಸಿ ನೋಡಿ.",
  "This report is based on information saved in VITAL. It is not a diagnosis or a substitute for professional medical advice.": "ಈ ವರದಿ VITAL ನಲ್ಲಿ ಉಳಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಆಧರಿಸಿದೆ. ಇದು ರೋಗನಿರ್ಣಯ ಅಥವಾ ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.",
  "Triage output": "ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶ", "Triage score trend": "ಪರಿಶೀಲನಾ ಅಂಕದ ಪ್ರವೃತ್ತಿ", "Twilio error code": "Twilio ದೋಷ ಕೋಡ್", "Use Windows voice typing · Win+H": "Windows ಧ್ವನಿ ಟೈಪಿಂಗ್ ಬಳಸಿ · Win+H",
  "VITAL considers the symptoms and readings you entered to estimate the level of concern.": "ಕಳವಳದ ಮಟ್ಟ ಅಂದಾಜಿಸಲು ನೀವು ನಮೂದಿಸಿದ ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾಪನಗಳನ್ನು VITAL ಪರಿಗಣಿಸುತ್ತದೆ.", "VITAL health assistant": "VITAL ಆರೋಗ್ಯ ಸಹಾಯಕ", "VITAL modules": "VITAL ವಿಭಾಗಗಳು", "VITAL screening estimate": "VITAL ಪರಿಶೀಲನಾ ಅಂದಾಜು",
  "VITAL service connection; this does not indicate that a watch is connected": "VITAL ಸೇವೆಯ ಸಂಪರ್ಕ; ವಾಚ್ ಸಂಪರ್ಕವಾಗಿದೆ ಎಂದರ್ಥವಲ್ಲ", "View wearables": "ಧರಿಸಬಹುದಾದ ಸಾಧನಗಳನ್ನು ನೋಡಿ", "Voice check:": "ಧ್ವನಿ ಪರಿಶೀಲನೆ:", "Voice distress check": "ಧ್ವನಿ ಸಂಕಟ ಪರಿಶೀಲನೆ", "Voice distress detector": "ಧ್ವನಿ ಸಂಕಟ ಪತ್ತೆ", "Volume score:": "ಧ್ವನಿ ಮಟ್ಟದ ಅಂಕ:", "Walkthrough progress": "ಮಾರ್ಗದರ್ಶಿ ಪ್ರಗತಿ", "Wearable wellness bridge": "ಧರಿಸಬಹುದಾದ ಸಾಧನದ ಆರೋಗ್ಯ ಸಂಪರ್ಕ", "Web reference candidates": "ವೆಬ್ ಉಲ್ಲೇಖ ಆಯ್ಕೆಗಳು", Weight: "ತೂಕ",
  "Wellness context only; not a medical measurement.": "ಆರೋಗ್ಯ ಸಂದರ್ಭಕ್ಕಾಗಿ ಮಾತ್ರ; ವೈದ್ಯಕೀಯ ಮಾಪನವಲ್ಲ.", "What does the photo show?": "ಫೋಟೋದಲ್ಲಿ ಏನು ಕಾಣುತ್ತದೆ?", "What’s in your report": "ನಿಮ್ಮ ವರದಿಯಲ್ಲಿ ಏನಿದೆ", "YOUR VITAL TOUR · STEP": "ನಿಮ್ಮ VITAL ಪರಿಚಯ · ಹಂತ",
  "You can use the symptom check and precaution guide below without a photo.": "ಫೋಟೋ ಇಲ್ಲದೆಯೂ ಕೆಳಗಿನ ಲಕ್ಷಣ ಪರಿಶೀಲನೆ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ ಮಾರ್ಗದರ್ಶಿ ಬಳಸಬಹುದು.", "Your recent activity is saved in this browser. It may be incomplete; share it with a clinician as a reference.": "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ಅದು ಅಪೂರ್ಣವಾಗಿರಬಹುದು; ವೈದ್ಯರೊಂದಿಗೆ ಚರ್ಚಿಸಲು ಉಲ್ಲೇಖವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ.",
  "Compare every detail with the doctor’s original prescription. Your schedule saves on this device.": "ಪ್ರತಿ ವಿವರವನ್ನು ವೈದ್ಯರ ಮೂಲ ಔಷಧ ಚೀಟಿಯೊಂದಿಗೆ ಹೋಲಿಸಿ. ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.", "Keyword check: typed or speech transcript.": "ಕೀವರ್ಡ್ ಪರಿಶೀಲನೆ: ಟೈಪ್ ಮಾಡಿದ ಅಥವಾ ಧ್ವನಿಯಿಂದ ಬಂದ ಪಠ್ಯ.", "Possible fall flagged": "ಸಂಭಾವ್ಯ ಬೀಳುವಿಕೆ ಎಚ್ಚರಿಕೆ", "handset delivery is not confirmed.": "ಫೋನ್‌ಗೆ ತಲುಪಿರುವುದು ದೃಢಪಟ್ಟಿಲ್ಲ."
});

const textNodeState = new WeakMap<Text, { source: string; last: string }>();
const attributeState = new WeakMap<Element, Map<string, { source: string; last: string }>>();
const translatableAttributes = ["aria-label", "title", "placeholder", "alt"];

function translateValue(value: string, language: VitalLanguage) {
  if (language === "en") return value;
  const clean = value.trim().replace(/\s+/g, " ");
  const removeDose = clean.match(/^Remove (.+) from prescription$/);
  if (removeDose) {
    return language === "hi" ? `नुस्खे से ${removeDose[1]} हटाएँ` : `${removeDose[1]} ಅನ್ನು ಔಷಧ ಚೀಟಿಯಿಂದ ತೆಗೆದುಹಾಕಿ`;
  }
  const direct = translations[language][clean];
  const punctuated = clean.match(/^([.!?,:;…·]*)(.*?)([.!?,:;…·]*)$/u);
  const translated = direct ?? (punctuated ? `${punctuated[1]}${translations[language][punctuated[2]] || punctuated[2]}${punctuated[3]}` : undefined);
  if (!translated) return value;
  const prefix = value.match(/^\s*/)?.[0] || "";
  const suffix = value.match(/\s*$/)?.[0] || "";
  return `${prefix}${translated}${suffix}`;
}

function translateTextNode(node: Text, language: VitalLanguage) {
  const current = node.nodeValue || "";
  let state = textNodeState.get(node);
  if (!state || current !== state.last) {
    state = { source: current, last: current };
    textNodeState.set(node, state);
  }
  const translated = translateValue(state.source, language);
  if (translated !== current) node.nodeValue = translated;
  state.last = translated;
}

function translateElement(element: Element, language: VitalLanguage) {
  let state = attributeState.get(element);
  if (!state) {
    state = new Map();
    attributeState.set(element, state);
  }
  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;
    let entry = state.get(attribute);
    if (!entry || current !== entry.last) {
      entry = { source: current, last: current };
      state.set(attribute, entry);
    }
    const translated = translateValue(entry.source, language);
    if (translated !== current) element.setAttribute(attribute, translated);
    entry.last = translated;
  }
}

function visit(node: Node, language: VitalLanguage) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (parent && !parent.closest("script,style,textarea,input,[contenteditable='true']")) translateTextNode(node as Text, language);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (element.matches("script,style,textarea,input")) return;
  translateElement(element, language);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode: Node | null;
  while ((textNode = walker.nextNode())) {
    const parent = textNode.parentElement;
    if (parent && !parent.closest("script,style,textarea,input,[contenteditable='true']")) translateTextNode(textNode as Text, language);
  }
}

export function applyUiLanguage(language: VitalLanguage) {
  document.documentElement.lang = language === "en" ? "en" : language === "hi" ? "hi-IN" : "kn-IN";
  visit(document.body, language);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData" && record.target.nodeType === Node.TEXT_NODE) {
        translateTextNode(record.target as Text, language);
      }
      record.addedNodes.forEach((node) => visit(node, language));
      if (record.type === "attributes" && record.target.nodeType === Node.ELEMENT_NODE) translateElement(record.target as Element, language);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatableAttributes });
  return () => observer.disconnect();
}
