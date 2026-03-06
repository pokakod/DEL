// Główna logika aplikacji
(function () {
  var STORAGE_KEY = "delegacja_form";
  var FIELD_IDS = [
    "employeeName", "employeeAddress", "employeeNip",
    "employeeEmail", "employeePhone", "tripNumber", "projectNumber",
    "tripPurpose", "country", "destinationCity", "transport",
    "depCity", "depDate", "depTime", "arrDestDate", "arrDestTime",
    "retDate", "retTime", "arrHomeDate", "arrHomeTime",
    "borderExitDate", "borderExitTime", "borderEntryDate", "borderEntryTime",
    "settlementDate"
  ];

  function roundTo15(d) {
    var ms = 15 * 60 * 1000;
    return new Date(Math.round(d.getTime() / ms) * ms);
  }
  function toDateStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function toTimeStr(d) {
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  var state = {
    selectedCountry: null,
    nbpRate: null,
    calculation: null,
  };

  document.addEventListener("DOMContentLoaded", function () {
    initCountrySelect();
    initEventListeners();
    restoreForm();
  });

  function initCountrySelect() {
    var select = document.getElementById("country");
    COUNTRIES.forEach(function (c, i) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = c.name;
      select.appendChild(opt);
    });

    var deIdx = COUNTRIES.findIndex(function (c) { return c.name === "Niemcy"; });
    if (deIdx >= 0) select.value = deIdx;
    onCountryChange();
  }

  function saveForm() {
    var data = {};
    FIELD_IDS.forEach(function (id) {
      data[id] = document.getElementById(id).value;
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function restoreForm() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        document.getElementById("settlementDate").value = new Date().toISOString().slice(0, 10);
        return;
      }
      var data = JSON.parse(raw);
      FIELD_IDS.forEach(function (id) {
        if (data[id] !== undefined && data[id] !== "") {
          document.getElementById(id).value = data[id];
        }
      });
      onCountryChange();
    } catch (e) {
      document.getElementById("settlementDate").value = new Date().toISOString().slice(0, 10);
    }
  }

  function initEventListeners() {
    document.getElementById("country").addEventListener("change", onCountryChange);
    document.getElementById("fetchRateBtn").addEventListener("click", onFetchRate);
    document.getElementById("calculateBtn").addEventListener("click", onCalculate);
    document.getElementById("generatePdfBtn").addEventListener("click", onGeneratePdf);

    document.getElementById("clearFormBtn").addEventListener("click", function () {
      if (!confirm("Wyczyścić wszystkie dane formularza?")) return;
      FIELD_IDS.forEach(function (id) {
        document.getElementById(id).value = "";
      });
      document.getElementById("depTime").value = "08:00";
      document.getElementById("retTime").value = "14:00";
      document.getElementById("arrHomeTime").value = "22:00";
      document.getElementById("borderExitTime").value = "17:00";
      document.getElementById("borderEntryTime").value = "22:00";
      document.getElementById("settlementDate").value = new Date().toISOString().slice(0, 10);
      document.getElementById("depFromHome").checked = false;
      state.selectedCountry = null;
      state.nbpRate = null;
      state.calculation = null;
      document.getElementById("countryInfo").style.display = "none";
      document.getElementById("rateInfo").style.display = "none";
      document.getElementById("resultSection").style.display = "none";
      localStorage.removeItem(STORAGE_KEY);
    });

    document.getElementById("depDate").addEventListener("change", function (e) {
      var val = e.target.value;
      if (!document.getElementById("borderExitDate").value) {
        document.getElementById("borderExitDate").value = val;
      }
      // Set min dates on all subsequent date fields
      document.getElementById("arrDestDate").min = val;
      document.getElementById("retDate").min = val;
      document.getElementById("arrHomeDate").min = val;
      document.getElementById("borderExitDate").min = val;
      document.getElementById("borderEntryDate").min = val;
      document.getElementById("settlementDate").min = val;
    });
    document.getElementById("retDate").addEventListener("change", function (e) {
      var val = e.target.value;
      document.getElementById("arrHomeDate").min = val;
      document.getElementById("borderEntryDate").min = val;
    });
    document.getElementById("arrHomeDate").addEventListener("change", function (e) {
      if (!document.getElementById("borderEntryDate").value) {
        document.getElementById("borderEntryDate").value = e.target.value;
      }
      var d = new Date(e.target.value);
      d.setDate(d.getDate() + 1);
      document.getElementById("settlementDate").value = toDateStr(d);
    });

    // Prevent buttons inside summary from toggling the details
    document.getElementById("nowDepartBtn").closest("summary").addEventListener("click", function (e) {
      if (e.target.closest(".summary-actions")) e.preventDefault();
    });

    document.getElementById("nowDepartBtn").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var now = roundTo15(new Date());
      document.getElementById("depDate").value = toDateStr(now);
      document.getElementById("depTime").value = toTimeStr(now);
      if (!document.getElementById("borderExitDate").value) {
        document.getElementById("borderExitDate").value = toDateStr(now);
      }
      saveForm();
    });

    document.getElementById("nowReturnBtn").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var now = roundTo15(new Date());
      document.getElementById("retDate").value = toDateStr(now);
      document.getElementById("retTime").value = toTimeStr(now);
      document.getElementById("arrHomeDate").value = toDateStr(now);
      document.getElementById("arrHomeTime").value = toTimeStr(now);
      if (!document.getElementById("borderEntryDate").value) {
        document.getElementById("borderEntryDate").value = toDateStr(now);
      }
      var nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      document.getElementById("settlementDate").value = toDateStr(nextDay);
      saveForm();
    });

    document.getElementById("depFromHome").addEventListener("change", function () {
      if (this.checked) {
        var addr = document.getElementById("employeeAddress").value;
        var city = addr.split(",").pop().trim().replace(/^\d{2}-\d{3}\s*/, "");
        if (city) document.getElementById("depCity").value = city;
      }
      saveForm();
    });

    // Auto-save on any input change
    document.getElementById("delegationForm").addEventListener("input", saveForm);
    document.getElementById("delegationForm").addEventListener("change", saveForm);
  }

  function onCountryChange() {
    var select = document.getElementById("country");
    var idx = parseInt(select.value);
    if (isNaN(idx)) {
      state.selectedCountry = null;
      document.getElementById("countryInfo").style.display = "none";
      return;
    }

    state.selectedCountry = COUNTRIES[idx];
    var c = state.selectedCountry;
    var sym = CURRENCY_SYMBOLS[c.currency] || c.currency;

    document.getElementById("countryInfo").style.display = "block";
    document.getElementById("countryInfoText").textContent =
      "Dieta: " + c.dietRate + " " + sym + " | Waluta: " + c.currency + " | Limit noclegu: " + c.hotelLimit + " " + sym;

    state.nbpRate = null;
    document.getElementById("rateInfo").style.display = "none";
  }

  async function onFetchRate() {
    if (!state.selectedCountry) {
      showError("Wybierz kraj.");
      return;
    }

    var settlementDate = document.getElementById("settlementDate").value;
    if (!settlementDate) {
      showError("Podaj date rozliczenia.");
      return;
    }

    var btn = document.getElementById("fetchRateBtn");
    btn.disabled = true;
    btn.innerHTML = 'Pobieram... <span class="spinner"></span>';
    clearError();

    try {
      var rate = await NbpApi.fetchRateBeforeDate(state.selectedCountry.currency, settlementDate);
      state.nbpRate = rate;

      document.getElementById("rateInfo").style.display = "grid";
      document.getElementById("rateTableNo").textContent = rate.no;
      document.getElementById("rateCurrency").textContent = state.selectedCountry.currency;
      document.getElementById("rateValue").textContent = DelegationUtils.formatAmount(rate.mid, 4) + " zl";
      document.getElementById("rateDate").textContent = DelegationUtils.formatDate(rate.effectiveDate);
    } catch (e) {
      showError("Blad pobierania kursu NBP: " + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Pobierz kurs NBP";
    }
  }

  async function onCalculate() {
    clearError();

    var form = document.getElementById("delegationForm");
    if (!form.reportValidity()) return;

    if (!state.selectedCountry) {
      showError("Wybierz kraj.");
      return;
    }

    if (!state.nbpRate) {
      await onFetchRate();
      if (!state.nbpRate) return;
    }

    var c = state.selectedCountry;
    var rate = state.nbpRate;

    var depTime = DelegationUtils.parseDatetime(
      document.getElementById("depDate").value,
      document.getElementById("depTime").value
    );
    var arrHomeTime = DelegationUtils.parseDatetime(
      document.getElementById("arrHomeDate").value,
      document.getElementById("arrHomeTime").value
    );
    var borderExit = DelegationUtils.parseDatetime(
      document.getElementById("borderExitDate").value,
      document.getElementById("borderExitTime").value
    );
    var borderEntry = DelegationUtils.parseDatetime(
      document.getElementById("borderEntryDate").value,
      document.getElementById("borderEntryTime").value
    );

    var foreignDietInfo = DelegationUtils.calculateForeignDiets(borderExit, borderEntry);
    var domesticDiets = DelegationUtils.calculateDomesticDiets(depTime, borderExit, borderEntry, arrHomeTime);

    var effectiveDietRate = c.dietRate;
    var dietTotalForeign = DelegationUtils.calculateDietAmount(foreignDietInfo, effectiveDietRate);
    var totalForeign = dietTotalForeign;
    var totalPLN = Math.round(totalForeign * rate.mid * 100) / 100;

    var sym = CURRENCY_SYMBOLS[c.currency] || c.currency;

    state.calculation = {
      foreignDietInfo: foreignDietInfo,
      domesticDiets: domesticDiets,
      effectiveDietRate: effectiveDietRate,
      dietTotalForeign: dietTotalForeign,
      totalForeign: totalForeign,
      totalPLN: totalPLN,
    };

    var fmt = DelegationUtils.formatAmount;
    var dietCountLabel = DelegationUtils.formatDietCount(foreignDietInfo);
    document.getElementById("resultSection").style.display = "block";
    document.getElementById("resDietCount").textContent = dietCountLabel;
    document.getElementById("resDietRate").textContent = fmt(effectiveDietRate) + " " + sym;
    document.getElementById("resDietTotal").textContent = fmt(dietTotalForeign) + " " + sym;
    document.getElementById("resRate").textContent = fmt(rate.mid, 4) + " zl";
    document.getElementById("resDietPLN").textContent = fmt(totalPLN) + " zl";
    document.getElementById("resTotalPLN").textContent = fmt(totalPLN) + " PLN";
    document.getElementById("resTotalWords").textContent = DelegationUtils.amountToWords(totalPLN, "PLN");

    document.getElementById("resultSection").scrollIntoView({ behavior: "smooth" });
  }

  function onGeneratePdf() {
    if (!state.calculation || !state.nbpRate || !state.selectedCountry) {
      showError("Najpierw oblicz rozliczenie.");
      return;
    }

    var data = {
      employee: {
        name: document.getElementById("employeeName").value,
        address: document.getElementById("employeeAddress").value,
        nip: document.getElementById("employeeNip").value,
        email: document.getElementById("employeeEmail").value,
        phone: document.getElementById("employeePhone").value,
      },
      trip: {
        number: document.getElementById("tripNumber").value,
        projectNumber: document.getElementById("projectNumber").value,
        purpose: document.getElementById("tripPurpose").value,
        country: state.selectedCountry.name,
        destinationCity: document.getElementById("destinationCity").value,
        transport: document.getElementById("transport").value,
      },
      departure: {
        city: document.getElementById("depCity").value,
        date: document.getElementById("depDate").value,
        time: document.getElementById("depTime").value,
      },
      arrivalDest: {
        date: document.getElementById("arrDestDate").value,
        time: document.getElementById("arrDestTime").value,
      },
      returnDep: {
        date: document.getElementById("retDate").value,
        time: document.getElementById("retTime").value,
      },
      arrivalHome: {
        date: document.getElementById("arrHomeDate").value,
        time: document.getElementById("arrHomeTime").value,
      },
      borderExit: {
        date: document.getElementById("borderExitDate").value,
        time: document.getElementById("borderExitTime").value,
      },
      borderEntry: {
        date: document.getElementById("borderEntryDate").value,
        time: document.getElementById("borderEntryTime").value,
      },
      settlementDate: document.getElementById("settlementDate").value,
      attachmentsCount: 0,
      country: state.selectedCountry,
      nbpRate: state.nbpRate,
      calculation: state.calculation,
    };

    PdfGenerator.generate(data);
  }

  function showError(msg) {
    clearError();
    var el = document.createElement("div");
    el.className = "error-msg";
    el.id = "errorMsg";
    el.textContent = msg;
    document.getElementById("delegationForm").prepend(el);
    el.scrollIntoView({ behavior: "smooth" });
  }

  function clearError() {
    var el = document.getElementById("errorMsg");
    if (el) el.remove();
  }
})();
