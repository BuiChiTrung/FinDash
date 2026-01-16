// Free Currency Exchange API Configuration (github.com/fawazahmed0/exchange-api)
const API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";
const API_FALLBACK = "https://latest.currency-api.pages.dev/v1";

// Cache Configuration
const CACHE_KEY_PREFIX = "findash_forex_cache_";
const CACHE_EXPIRY_DAYS = 1; // Cache expires after 1 day

// Helper function to generate cache key for a currency pair
function getCacheKey(from, to, days) {
  return `${CACHE_KEY_PREFIX}${from}_${to}_${days}`;
}

// Helper function to check if cache is still valid
function isCacheValid(cacheKey) {
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return false;

  try {
    const data = JSON.parse(cached);
    const cacheTime = data.timestamp;
    const now = new Date().getTime();
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    return now - cacheTime < expiryTime;
  } catch (e) {
    return false;
  }
}

// Helper function to get cached data
function getCachedData(cacheKey) {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached && isCacheValid(cacheKey)) {
      return JSON.parse(cached).data;
    }
  } catch (e) {
    console.error("Error reading cache:", e);
  }
  return null;
}

// Helper function to save data to cache
function saveCacheData(cacheKey, data) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: new Date().getTime(),
        data: data,
      })
    );
  } catch (e) {
    console.error("Error saving cache:", e);
  }
}

// Currency Converter Elements
const fromCurrency = document.getElementById("from-currency");
const toCurrency = document.getElementById("to-currency");
const fromAmount = document.getElementById("from-amount");
const toAmount = document.getElementById("to-amount");
const exchangeRateDisplay = document.getElementById("exchange-rate");
const rateUnit = document.getElementById("rate-unit");
const rateInfo = document.getElementById("rate-info");
const swapBtn = document.getElementById("swap-btn");
const fromWrapper = document.getElementById("from-wrapper");
const toWrapper = document.getElementById("to-wrapper");
const fromDropdown = document.getElementById("from-dropdown");
const toDropdown = document.getElementById("to-dropdown");

let currentRate = null;

const currencyData = {
  TWD: { flag: "🇹🇼", name: "Taiwan Dollar" },
  USD: { flag: "🇺🇸", name: "US Dollar" },
  EUR: { flag: "🇪🇺", name: "Euro" },
  GBP: { flag: "🇬🇧", name: "British Pound" },
  JPY: { flag: "🇯🇵", name: "Japanese Yen" },
  CNY: { flag: "🇨🇳", name: "Chinese Yuan" },
  VND: { flag: "🇻🇳", name: "Vietnamese Dong" },
  AUD: { flag: "🇦🇺", name: "Australian Dollar" },
  CAD: { flag: "🇨🇦", name: "Canadian Dollar" },
  CHF: { flag: "🇨🇭", name: "Swiss Franc" },
};

const currencyList = Object.keys(currencyData);

function generateDropdownItems(dropdown, currentValue) {
  dropdown.innerHTML = currencyList
    .map((code) => {
      const data = currencyData[code];
      const isSelected = code === currentValue ? "selected" : "";
      return `
                    <div class="currency-dropdown-item ${isSelected}" data-currency="${code}">
                      <div class="currency-dropdown-item-flag">${data.flag}</div>
                      <div class="currency-dropdown-item-info">
                        <div class="currency-dropdown-item-code">${code}</div>
                        <div class="currency-dropdown-item-name">${data.name}</div>
                      </div>
                    </div>
                  `;
    })
    .join("");
}

function setupDropdownListener(wrapper, dropdown, selectElement) {
  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close other dropdowns
    document
      .querySelectorAll(".currency-dropdown")
      .forEach((d) => d.classList.remove("active"));
    dropdown.classList.add("active");
  });

  dropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".currency-dropdown-item");
    if (item) {
      const currency = item.dataset.currency;
      selectElement.value = currency;
      updateCurrencyDisplay(
        selectElement,
        wrapper.querySelector(".currency-code"),
        wrapper
      );
      dropdown.classList.remove("active");
      fetchExchangeRate();
    }
  });
}

function updateCurrencyDisplay(selectElement, codeElement, wrapper) {
  const value = selectElement.value;
  const data = currencyData[value];
  const codeEl = wrapper.querySelector(".currency-code");
  const nameEl = wrapper.querySelector(".currency-name");
  const flagEl = wrapper.querySelector("span:first-child");

  codeEl.textContent = value;
  nameEl.textContent = data.name;
  flagEl.textContent = data.flag;

  // Update dropdown selection
  const dropdown = wrapper.querySelector(".currency-dropdown");
  dropdown.querySelectorAll(".currency-dropdown-item").forEach((item) => {
    item.classList.toggle("selected", item.dataset.currency === value);
  });
}

async function fetchExchangeRate() {
  try {
    const from = fromCurrency.value.toLowerCase();
    const to = toCurrency.value.toLowerCase();

    // Try primary API first, fallback to secondary
    let response = await fetch(`${API_URL}/currencies/${from}.json`);
    if (!response.ok) {
      response = await fetch(`${API_FALLBACK}/currencies/${from}.json`);
    }

    const data = await response.json();
    const rates = data[from];

    if (rates && rates[to]) {
      currentRate = rates[to];
      exchangeRateDisplay.textContent = currentRate.toFixed(4);
      rateUnit.textContent = `${to.toUpperCase()} per 1 ${from.toUpperCase()}`;
      rateInfo.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
      updateConversion();
    } else {
      throw new Error("Currency rate not found");
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    exchangeRateDisplay.textContent = "Error";
    rateInfo.textContent = "Unable to fetch live rates";
  }
}

function updateConversion() {
  if (currentRate) {
    const amount = parseFloat(fromAmount.value) || 0;
    const converted = amount * currentRate;
    toAmount.value = converted.toFixed(2);
  }
}

function swapCurrencies() {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;

  updateCurrencyDisplay(fromCurrency, null, fromWrapper);
  updateCurrencyDisplay(toCurrency, null, toWrapper);

  fetchExchangeRate();
}

// Setup dropdowns
generateDropdownItems(fromDropdown, fromCurrency.value);
generateDropdownItems(toDropdown, toCurrency.value);

setupDropdownListener(fromWrapper, fromDropdown, fromCurrency);
setupDropdownListener(toWrapper, toDropdown, toCurrency);

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
  document.querySelectorAll(".currency-dropdown").forEach((d) => {
    d.classList.remove("active");
  });
});

fromAmount.addEventListener("input", updateConversion);
swapBtn.addEventListener("click", swapCurrencies);

// Fetch other rates
async function fetchOtherRates() {
  try {
    // Try primary API first, fallback to secondary
    let response = await fetch(`${API_URL}/currencies/usd.json`);
    if (!response.ok) {
      response = await fetch(`${API_FALLBACK}/currencies/usd.json`);
    }

    const data = await response.json();
    const rates = data.usd;

    if (rates) {
      document.getElementById("eur-usd").textContent = (1 / rates.eur).toFixed(
        4
      );
      document.getElementById("gbp-usd").textContent = (1 / rates.gbp).toFixed(
        4
      );
      document.getElementById("jpy-usd").textContent = (1 / rates.jpy).toFixed(
        2
      );
      document.getElementById("usd-cny").textContent = rates.cny.toFixed(4);
    }
  } catch (error) {
    console.error("Error fetching rates:", error);
    document.getElementById("eur-usd").textContent = "1.0876";
    document.getElementById("gbp-usd").textContent = "1.2754";
    document.getElementById("jpy-usd").textContent = "149.45";
    document.getElementById("usd-cny").textContent = "7.1234";
  }
}

// Initialize
fetchExchangeRate();
fetchOtherRates();

// Chart initialization
let rateChart = null;
let chartData = {
  7: [],
  30: [],
  90: [],
  365: [],
};

async function fetchHistoricalRates(days) {
  const from = fromCurrency.value.toLowerCase();
  const to = toCurrency.value.toLowerCase();

  // Check browser localStorage cache first
  const cacheKey = getCacheKey(from, to, days);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    console.log(`✓ Loaded ${from}/${to} data from localStorage (${days} days)`);
    return cachedData;
  }

  try {
    // Try to load from static cache file first
    const cacheFile = `cache/${from}_${to}.json`;
    console.log(`📁 Attempting to load from cache file: ${cacheFile}`);

    let fileData = null;
    try {
      const response = await fetch(cacheFile);
      if (response.ok) {
        fileData = await response.json();
        console.log(`✓ Loaded ${from}/${to} from static cache file`);
      }
    } catch (e) {
      console.log(`ℹ Cache file not available, falling back to API`);
    }

    let dates = [];
    let rates = [];

    if (fileData && fileData.dates && fileData.rates) {
      // Use file data
      dates = fileData.dates;
      rates = fileData.rates;
      console.log(`✓ Using cached data: ${rates.length} rates available`);
    } else {
      // Fetch from API if cache file doesn't exist
      console.log(`🔄 Fetching ${from}/${to} from API...`);

      // Generate dates for the requested period
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
      }

      // Fetch rates for all dates
      for (const dateStr of dates) {
        try {
          // Try primary API
          let response = await fetch(
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/${from}.json`
          );

          // Fallback if specific date not available
          if (!response.ok) {
            response = await fetch(`${API_URL}/currencies/${from}.json`);
          }

          const data = await response.json();
          const rateData = data[from];

          if (rateData && rateData[to]) {
            rates.push(rateData[to]);
          }
        } catch (e) {
          console.log(`Could not fetch rate for ${dateStr}`);
        }
      }
    }

    const result = { dates: dates.slice(-rates.length), rates };

    // Save to browser localStorage for future use
    saveCacheData(cacheKey, result);
    console.log(`✓ Cached ${from}/${to} in localStorage (${days} days)`);

    return result;
  } catch (error) {
    console.error("Error fetching historical rates:", error);
    return { dates: [], rates: [] };
  }
}

async function updateChart(days) {
  const from = fromCurrency.value.toUpperCase();
  const to = toCurrency.value.toUpperCase();

  if (!chartData[days] || chartData[days].length === 0) {
    chartData[days] = await fetchHistoricalRates(days);
  }

  const data = chartData[days];

  if (rateChart) {
    rateChart.destroy();
  }

  const ctx = document.getElementById("rateChart").getContext("2d");
  rateChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.dates,
      datasets: [
        {
          label: `${from}/${to} Exchange Rate`,
          data: data.rates,
          borderColor: "#1e3799",
          backgroundColor: "rgba(26, 115, 232, 0.05)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 8,
          pointBackgroundColor: "#1e3799",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverBorderColor: "#1e3799",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              size: 14,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            },
            color: "#666",
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#1a1a1a",
          padding: 12,
          titleFont: {
            size: 14,
            weight: "bold",
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          },
          bodyFont: {
            size: 13,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          },
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#1e3799",
          borderWidth: 1,
          displayColors: false,
          cornerRadius: 6,
          callbacks: {
            title: function (context) {
              // Format the date
              const date = new Date(context[0].label);
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            },
            label: function (context) {
              // Display the exchange rate value
              const value = context.parsed.y;
              return "Rate: " + value.toFixed(4);
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: "#f0f0f0",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              size: 12,
              weight: "500",
            },
            maxTicksLimit: 8,
            padding: 8,
            callback: function (value, index) {
              // Format date labels to be shorter
              const date = new Date(this.getLabelForValue(value));
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            },
          },
        },
        y: {
          display: true,
          grid: {
            color: "#f0f0f0",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              size: 12,
              weight: "500",
            },
            padding: 12,
            callback: function (value) {
              // Format y-axis numbers with proper decimal places
              return value.toFixed(2);
            },
          },
        },
      },
    },
  });
}

// Chart button handlers
document.querySelectorAll(".chart-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    document
      .querySelectorAll(".chart-btn")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    const days = parseInt(e.target.dataset.days);
    await updateChart(days);
  });
});

// Update chart when currency changes
const originalFetchExchangeRate = fetchExchangeRate;
fetchExchangeRate = async function () {
  await originalFetchExchangeRate();
  // Clear cached chart data when currencies change
  chartData = { 7: [], 30: [], 90: [], 365: [] };
  const activeBtn = document.querySelector(".chart-btn.active");
  if (activeBtn) {
    const days = parseInt(activeBtn.dataset.days);
    await updateChart(days);
  }
};

// Refresh rates every 5 minutes
setInterval(fetchExchangeRate, 5 * 60 * 1000);
setInterval(fetchOtherRates, 5 * 60 * 1000);

// Initialize chart on page load
setTimeout(() => {
  updateChart(7);
}, 500);
