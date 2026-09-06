const copy = {
	english: {
		title: "Now type mentioned:",
		subtitle: "Choose any option to open the business view.",
		welcome: "Hello! What would you like to know about today?",
		placeholder: "Type 1, 2 or ask your question...",
		options: ["Aaj ka batao", "Status"],
		botName: "Code&Clover Pro Bot", botStatus: "Business Analysis", flowLabel: "FLOW 1/5 · CHAT INITIATION", greeting: "Hello! I can help you with abandonment analysis.", languagePrompt: "Please choose your preferred language for the report:", selected: "Language selected: English ✓", sampleTitle: "✎ Example customers analysis · sample list:", idLabel: "ID", customerLabel: "Customer", attemptsLabel: "Cart attempts", riskLabel: "Risk", savedLabel: "Revenue saved", location: "Ghaziabad"
	},
	hindi: {
		title: "अब type mentioned:",
		subtitle: "Business view खोलने के लिए कोई option चुनें।",
		welcome: "नमस्ते! आज के बारे में आप क्या जानना चाहते हैं?",
		placeholder: "1, 2 लिखें या अपना सवाल पूछें...",
		options: ["आज का बताओ", "स्टेटस"],
		botName: "Code&Clover Pro Bot", botStatus: "बिज़नेस एनालिसिस", flowLabel: "फ्लो 1/5 · चैट शुरुआत", greeting: "नमस्ते! मैं अबैंडनमेंट एनालिसिस में आपकी मदद कर सकता हूँ।", languagePrompt: "रिपोर्ट के लिए अपनी पसंदीदा भाषा चुनें:", selected: "चुनी गई भाषा: हिंदी ✓", sampleTitle: "✎ कस्टमर एनालिसिस · सैंपल लिस्ट:", idLabel: "आईडी", customerLabel: "कस्टमर", attemptsLabel: "कार्ट प्रयास", riskLabel: "रिस्क", savedLabel: "बचाया रेवेन्यू", location: "गाज़ियाबाद"
	},
	hinglish: {
		title: "Now type mentioned:",
		subtitle: "Business view open karne ke liye koi option choose karo.",
		welcome: "Hello! Aaj aap kya jaan-na chahte ho?",
		placeholder: "1, 2 type karo ya apna sawaal poochho...",
		options: ["Aaj ka batao", "Status"],
		botName: "Code&Clover Pro Bot", botStatus: "Business Analysis", flowLabel: "FLOW 1/5 · CHAT INITIATION", greeting: "Hello! Main abandonment analysis mein help kar sakta hoon.", languagePrompt: "Report ke liye apni preferred language choose karo:", selected: "Language selected: Hinglish ✓", sampleTitle: "✎ Example customer analysis · sample list:", idLabel: "ID", customerLabel: "Customer", attemptsLabel: "Cart attempts", riskLabel: "Risk", savedLabel: "Revenue saved", location: "Ghaziabad"
	}
};

const routes = ["/dashboard", "/all"];
let selectedLanguage = "hinglish";

function setLanguage(language) {
	selectedLanguage = language;
	localStorage.setItem("preferredLanguage", language === "hindi" ? "hi" : language === "hinglish" ? "hinglish" : "en");
	const languageCopy = copy[language];
	document.getElementById("bot-title").textContent = languageCopy.title;
	document.getElementById("bot-subtitle").textContent = languageCopy.subtitle;
	document.getElementById("welcome-message").textContent = languageCopy.languagePrompt;
	document.getElementById("chat-text").placeholder = languageCopy.placeholder;
	document.getElementById("selected-language").textContent = languageCopy.selected;
	document.querySelectorAll("[data-i18n]").forEach((element) => {
		if (languageCopy[element.dataset.i18n]) element.textContent = languageCopy[element.dataset.i18n];
	});
	document.querySelectorAll(".action-btn span").forEach((label, index) => {
		label.textContent = languageCopy.options[index];
	});
	document.querySelectorAll(".language-btn").forEach((button) => {
		button.classList.toggle("active", button.dataset.language === language);
	});
}

function openFlow(flowNumber) {
	const route = routes[flowNumber - 1];
	if (route) {
		window.location.href = route;
	}
}

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

async function fetchReportData() {
	try {
		const response = await fetch("/api/report");
		if (response.ok) return response.json();
	} catch (error) {
		// Fall back to the CSV when the page is opened with Live Server.
	}
	const rows = (await (await fetch("/dataset.csv")).text()).trim().split(/\r?\n/).slice(1).map((line) => line.split(","));
	const statusIndex = 10;
	const revenueIndex = 11;
	const count = (status) => rows.filter((row) => row[statusIndex] === status).length;
	const recoveredRows = rows.filter((row) => row[statusIndex] === "RECOVERED");
	return { total_carts: rows.length, recovered: count("RECOVERED"), abandoned: count("ABANDONED"), cancelled: count("CANCELLED"), revenue: recoveredRows.reduce((total, row) => total + Number(row[revenueIndex] || 0), 0), average_order_value: recoveredRows.length ? recoveredRows.reduce((total, row) => total + Number(row[revenueIndex] || 0), 0) / recoveredRows.length : 0, customers: [] };
}

async function showReport() {
	const report = document.getElementById("inline-report");
	const data = await fetchReportData();
	const total = data.total_carts || 1;
	const setValue = (name, value) => document.querySelector(`[data-report="${name}"]`).textContent = value;
	setValue("total_carts", data.total_carts);
	setValue("recovered", data.recovered);
	setValue("cancelled", data.cancelled);
	setValue("abandoned", data.abandoned);
	setValue("recovery_rate", `${Math.round(data.recovered / total * 100)}%`);
	["one_attempt", "two_attempts", "three_attempts", "four_plus_attempts"].forEach((attempt) => {
		document.querySelector(`[data-attempt-count="${attempt}"]`).textContent = `${data[attempt]} log`;
	});
	document.querySelector('[data-report-currency="revenue"]').textContent = formatCurrency(data.revenue);
	document.querySelector('[data-report-currency="lost_revenue"]').textContent = formatCurrency(data.total_carts * 2500 - data.revenue);
	document.querySelector('[data-report-currency="average_order_value"]').textContent = formatCurrency(data.average_order_value);
	["recovered", "cancelled", "abandoned"].forEach((status) => {
		document.querySelector(`[data-report-percent="${status}"]`).textContent = `${Math.round(data[status] / total * 100)}% of total`;
	});
	document.querySelector("#report-donut").style.background = `conic-gradient(#51d5bb 0 ${data.recovered / total * 100}%, #e56c5c ${data.recovered / total * 100}% ${(data.recovered + data.cancelled) / total * 100}%, #f4b34f ${(data.recovered + data.cancelled) / total * 100}% 100%)`;
	document.querySelector("#report-donut span").textContent = `${Math.round(data.recovered / total * 100)}%`;
	const statusSymbols = { RECOVERED: "✅", CANCELLED: "❌", ABANDONED: "⏳" };
	document.getElementById("report-customers").innerHTML = data.customers.map((customer) => `<tr><td>${customer.customer_name}</td><td>${customer.product}</td><td>🛒 ${customer.times_added} baar</td><td class="${customer.final_status.toLowerCase()}">${statusSymbols[customer.final_status] || "•"} ${customer.final_status}</td><td>${formatCurrency(customer.revenue)}</td></tr>`).join("");
	report.classList.remove("hidden");
	report.scrollIntoView({ behavior: "smooth", block: "start" });
}

function findFlow(text) {
	const value = text.toLowerCase().trim();
	if (/^1\b|aaj ka batao|aaj ka update|today.*summary|daily summary/.test(value)) return 1;
	if (/^2\b|^status\b|trend|रुझान|aaj ka trend|business status/.test(value)) return 2;
	return null;
}

document.querySelectorAll(".language-btn").forEach((button) => {
	button.addEventListener("click", () => setLanguage(button.dataset.language));
});

	document.querySelectorAll(".action-btn").forEach((button) => {
	button.addEventListener("click", () => {
		if (button.dataset.flow === "with_ml") {
			window.location.href = "/dashboard";
			return;
		}
		window.location.href = "/all";
	});
});

document.getElementById("chat-form").addEventListener("submit", (event) => {
	event.preventDefault();
	const input = document.getElementById("chat-text");
	const message = input.value.trim();
	if (!message) return;
	const flowNumber = findFlow(input.value);
	if (flowNumber) {
		openFlow(flowNumber);
		return;
	}
	const thread = document.getElementById("chat-thread");
	const userMessage = document.createElement("div");
	userMessage.className = "chat-user-message";
	userMessage.textContent = message;
	thread.appendChild(userMessage);
	input.value = "";
	const response = document.createElement("div");
	response.className = "chat-bot-message chat-reply pending";
	response.textContent = "Data check kar raha hoon...";
	thread.appendChild(response);
	thread.scrollIntoView({ behavior: "smooth", block: "end" });
	fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, language: selectedLanguage }) })
		.then((result) => result.json())
		.then((data) => { response.textContent = data.reply || "Iska answer abhi available nahi hai."; response.classList.remove("pending"); })
		.catch(() => { response.textContent = "Server se connect nahi ho paaya. Dashboard try karo."; response.classList.remove("pending"); });
	input.focus();
});

const savedLanguage = localStorage.getItem("preferredLanguage");
if (savedLanguage === "hi") setLanguage("hindi");
if (savedLanguage === "en") setLanguage("english");