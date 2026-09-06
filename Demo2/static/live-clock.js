const formatLiveDate = (date) => date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
const formatLiveTime = (date) => date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const updateLiveClock = () => {
    const now = new Date();
    document.querySelectorAll("[data-live-date]").forEach((element) => {
        element.textContent = formatLiveDate(now);
    });
    document.querySelectorAll("[data-live-time]").forEach((element) => {
        element.textContent = formatLiveTime(now);
    });
    document.querySelectorAll("[data-live-datetime]").forEach((element) => {
        element.textContent = `${formatLiveDate(now)} · ${formatLiveTime(now)}`;
    });
};

updateLiveClock();
setInterval(updateLiveClock, 1000);
