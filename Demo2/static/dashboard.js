const languageCopy = {
    en: {
        title: "Choose your business view", subtitle: "Select a dashboard to open the detailed view with predictions, carts, revenue and customer signals.",
        brand: "Code&Clover Pro Bot", controlRoom: "CONTROL ROOM", commandCentre: "TODAY'S COMMAND CENTRE", liveCarts: "LIVE CARTS", updatedNow: "Updated just now", mlTitle: "With ML predictions", mlDescription: "Risk scoring, recovery probability and smart coupon recommendations.", openPrediction: "Open prediction view ↗", baselineTitle: "Without ML predictions", baselineDescription: "Rule-based cart recovery performance and fixed coupon outcomes.", openBaseline: "Open baseline view ↗", combinedTitle: "All combined", combinedDescription: "Compare both engines across customers, carts, revenue and conversion.", openCombined: "Open combined view ↗", comparisonTitle: "Comparison", comparisonDescription: "See the lift, extra revenue and bot profit in one executive snapshot.", openComparison: "Open comparison view ↗", summaryTitle: "Today's summary", summaryDescription: "A concise pulse check of orders, revenue, risk and next best action.", openSummary: "Open summary view ↗", dataActive: "● Data stream active", backToBot: "← Back to bot"
    },
    hi: {
        title: "अपना बिज़नेस व्यू चुनें", subtitle: "प्रेडिक्शन, कार्ट, रेवेन्यू और कस्टमर डेटा वाला डैशबोर्ड खोलें।",
        brand: "Code&Clover Pro Bot", controlRoom: "बिज़नेस एनालिसिस", commandCentre: "आज का कमांड सेंटर", liveCarts: "लाइव कार्ट", updatedNow: "अभी अपडेट हुआ", mlTitle: "ML प्रेडिक्शन के साथ", mlDescription: "रिस्क स्कोर, रिकवरी संभावना और स्मार्ट कूपन सुझाव।", openPrediction: "प्रेडिक्शन व्यू खोलें ↗", baselineTitle: "ML प्रेडिक्शन के बिना", baselineDescription: "रूल-बेस्ड कार्ट रिकवरी और फिक्स्ड कूपन परिणाम।", openBaseline: "बेसलाइन व्यू खोलें ↗", combinedTitle: "सभी डेटा साथ में", combinedDescription: "दोनों सिस्टम के कस्टमर, कार्ट, रेवेन्यू और कन्वर्ज़न की तुलना।", openCombined: "कंबाइंड व्यू खोलें ↗", comparisonTitle: "तुलना", comparisonDescription: "लिफ्ट, अतिरिक्त रेवेन्यू और बॉट प्रॉफिट एक जगह देखें।", openComparison: "कंपैरिजन व्यू खोलें ↗", summaryTitle: "आज का सारांश", summaryDescription: "ऑर्डर, रेवेन्यू, रिस्क और अगले एक्शन का छोटा सारांश।", openSummary: "सारांश व्यू खोलें ↗", dataActive: "● डेटा स्ट्रीम चालू", backToBot: "← बॉट पर वापस जाएँ"
    },
    hinglish: {
        title: "Apna business view choose karo", subtitle: "Predictions, carts, revenue aur customer signals wala detailed dashboard kholo.",
        brand: "Code&Clover Pro Bot", controlRoom: "CONTROL ROOM", commandCentre: "AAJ KA COMMAND CENTRE", liveCarts: "LIVE CARTS", updatedNow: "Abhi updated", mlTitle: "With ML predictions", mlDescription: "Risk scoring, recovery chance aur smart coupon suggestions.", openPrediction: "Prediction view kholo ↗", baselineTitle: "Without ML predictions", baselineDescription: "Rule-based cart recovery aur fixed coupon results.", openBaseline: "Baseline view kholo ↗", combinedTitle: "All combined", combinedDescription: "Dono engines ke customers, carts, revenue aur conversion compare karo.", openCombined: "Combined view kholo ↗", comparisonTitle: "Comparison", comparisonDescription: "Lift, extra revenue aur bot profit ek executive snapshot mein dekho.", openComparison: "Comparison view kholo ↗", summaryTitle: "Aaj ka summary", summaryDescription: "Orders, revenue, risk aur next best action ka quick pulse check.", openSummary: "Summary view kholo ↗", dataActive: "● Data stream active", backToBot: "← Bot par wapas"
    }
};

const updateClock = () => {
    const now = new Date();
    document.getElementById("today-date").textContent = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    document.getElementById("current-time").textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

document.getElementById("language-select").addEventListener("change", (event) => {
    localStorage.setItem("preferredLanguage", event.target.value);
    const selected = languageCopy[event.target.value];
    document.getElementById("hub-title").textContent = selected.title;
    document.getElementById("hub-subtitle").textContent = selected.subtitle;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = selected[element.dataset.i18n];
    });
});

const savedLanguage = localStorage.getItem("preferredLanguage");
if (savedLanguage && languageCopy[savedLanguage]) {
    document.getElementById("language-select").value = savedLanguage;
    document.getElementById("language-select").dispatchEvent(new Event("change"));
}
updateClock();
setInterval(updateClock, 1000);