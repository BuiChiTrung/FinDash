// Tab Configuration
      const tabConfig = {
        forex: {
          title: "Forex Converter",
          description: "Real-time currency exchange rates",
          file: "forex.html",
        },
        gold: {
          title: "Gold Prices",
          description: "Live gold price information and charts",
          file: "gold.html",
        },
        companies: {
          title: "Companies Market Cap",
          description: "Track global company valuations",
          file: "companies.html",
        },
      };

      const tabButtons = document.querySelectorAll(".tab-button");
      const pageTitle = document.getElementById("page-title");
      const pageDescription = document.getElementById("page-description");
      const contentFrame = document.getElementById("content-frame");

      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const tabName = button.getAttribute("data-tab");
          const config = tabConfig[tabName];

          // Remove active class from all buttons
          tabButtons.forEach((btn) => btn.classList.remove("active"));

          // Add active class to clicked button
          button.classList.add("active");

          // Update header
          pageTitle.textContent = config.title;
          pageDescription.textContent = config.description;

          // Load iframe content
          contentFrame.src = config.file;
        });
      });

      // Set initial active tab
      document.querySelector('[data-tab="forex"]').classList.add("active");

      // Sidebar Toggle
      const toggleButton = document.getElementById("toggle-sidebar");
      const sidebar = document.querySelector(".sidebar");

      toggleButton.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        toggleButton.textContent = sidebar.classList.contains("collapsed")
          ? "▶"
          : "☰";
      });