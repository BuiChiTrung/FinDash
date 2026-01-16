// Initialize TradingView widget for gold
new TradingView.widget({
  autosize: true,
  symbol: "OANDA:XAUUSD",
  interval: "D",
  timezone: "Etc/UTC",
  theme: "light",
  style: "1",
  locale: "en",
  toolbar_bg: "rgba(0, 0, 0, 0)",
  enable_publishing: false,
  allow_symbol_change: true,
  container_id: "tradingview_chart",
});

// Initialize TradingView widget for silver
new TradingView.widget({
  autosize: true,
  symbol: "OANDA:XAGUSD",
  interval: "D",
  timezone: "Etc/UTC",
  theme: "light",
  style: "1",
  locale: "en",
  toolbar_bg: "rgba(0, 0, 0, 0)",
  enable_publishing: false,
  allow_symbol_change: true,
  container_id: "tradingview_chart_silver",
});
