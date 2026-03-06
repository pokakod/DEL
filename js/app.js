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

  // Cached DOM elements (populated on DOMContentLoaded)
  var els = {};

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
    // Cache all DOM elements once
    FIELD_IDS.forEach(function (id) { els[id] = document.getElementById(id); });
    ["delegationForm", "countryInfo", "countryInfoText", "rateInfo",
     "rateTableNo", "rateCurrency", "rateValue", "rateDate",
     "fetchRateBtn", "calculateBtn", "generatePdfBtn", "clearFormBtn",
     "resultSection", "resDietCount", "resDietRate", "resDietTotal",
     "resRate", "resDietPLN", "resTotalPLN", "resTotalWords",
     "depFromHome", "nowDepartBtn", "nowReturnBtn"
    ].forEach(function (id) { els[id] = document.getElementById(id); });

    initCountrySelect();
    initEventListeners();
    restoreForm();
  });

  function initCountrySelect() {
    var select = els.country;
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
    FIELD_IDS.forEach(function (id) { data[id] = els[id].value; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function restoreForm() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        els.settlementDate.value = toDateStr(new Date());
        return;
      }
      var data = JSON.parse(raw);
      FIELD_IDS.forEach(function (id) {
        if (data[id] !== undefined && data[id] !== "") els[id].value = data[id];
      });
      onCountryChange();
    } catch (e) {
      els.settlementDate.value = toDateStr(new Date());
    }
  }

  function initEventListeners() {
    els.country.addEventListener("change", onCountryChange);
    els.fetchRateBtn.addEventListener("click", onFetchRate);
    els.calculateBtn.addEventListener("click", onCalculate);
    els.generatePdfBtn.addEventListener("click", onGeneratePdf);

    els.clearFormBtn.addEventListener("click", function () {
      if (!confirm("Wyczyścić wszystkie dane formularza?")) return;
      FIELD_IDS.forEach(function (id) { els[id].value = ""; });
      els.depTime.value = "08:00";
      els.retTime.value = "14:00";
      els.arrHomeTime.value = "22:00";
      els.borderExitTime.value = "17:00";
      els.borderEntryTime.value = "22:00";
      els.settlementDate.value = toDateStr(new Date());
      els.depFromHome.checked = false;
      state.selectedCountry = null;
      state.nbpRate = null;
      state.calculation = null;
      els.countryInfo.style.display = "none";
      els.rateInfo.style.display = "none";
      els.resultSection.style.display = "none";
      localStorage.removeItem(STORAGE_KEY);
    });

    els.depDate.addEventListener("change", function (e) {
      var val = e.target.value;
      if (!els.borderExitDate.value) els.borderExitDate.value = val;
      els.arrDestDate.min = val;
      els.retDate.min = val;
      els.arrHomeDate.min = val;
      els.borderExitDate.min = val;
      els.borderEntryDate.min = val;
      els.settlementDate.min = val;
    });
    els.retDate.addEventListener("change", function (e) {
      var val = e.target.value;
      els.arrHomeDate.min = val;
      els.borderEntryDate.min = val;
    });
    els.arrHomeDate.addEventListener("change", function (e) {
      if (!els.borderEntryDate.value) els.borderEntryDate.value = e.target.value;
      var d = new Date(e.target.value);
      d.setDate(d.getDate() + 1);
      els.settlementDate.value = toDateStr(d);
    });

    // Prevent buttons inside summary from toggling the details
    els.nowDepartBtn.closest("summary").addEventListener("click", function (e) {
      if (e.target.closest(".summary-actions")) e.preventDefault();
    });

    els.nowDepartBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var now = roundTo15(new Date());
      els.depDate.value = toDateStr(now);
      els.depTime.value = toTimeStr(now);
      if (!els.borderExitDate.value) els.borderExitDate.value = toDateStr(now);
      saveForm();
    });

    els.nowReturnBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var now = roundTo15(new Date());
      els.retDate.value = toDateStr(now);
      els.retTime.value = toTimeStr(now);
      els.arrHomeDate.value = toDateStr(now);
      els.arrHomeTime.value = toTimeStr(now);
      if (!els.borderEntryDate.value) els.borderEntryDate.value = toDateStr(now);
      var nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      els.settlementDate.value = toDateStr(nextDay);
      saveForm();
    });

    els.depFromHome.addEventListener("change", function () {
      if (this.checked) {
        var addr = els.employeeAddress.value;
        var city = addr.split(",").pop().trim().replace(/^\d{2}-\d{3}\s*/, "");
        if (city) els.depCity.value = city;
      }
      saveForm();
    });

    // Auto-save on any input change
    els.delegationForm.addEventListener("input", saveForm);
    els.delegationForm.addEventListener("change", saveForm);
  }

  function onCountryChange() {
    var idx = parseInt(els.country.value);
    if (isNaN(idx)) {
      state.selectedCountry = null;
      els.countryInfo.style.display = "none";
      return;
    }

    state.selectedCountry = COUNTRIES[idx];
    var c = state.selectedCountry;
    var sym = CURRENCY_SYMBOLS[c.currency] || c.currency;

    els.countryInfo.style.display = "block";
    els.countryInfoText.textContent =
      "Dieta: " + c.dietRate + " " + sym + " | Waluta: " + c.currency + " | Limit noclegu: " + c.hotelLimit + " " + sym;

    state.nbpRate = null;
    els.rateInfo.style.display = "none";
  }

  async function onFetchRate() {
    if (!state.selectedCountry) {
      showError("Wybierz kraj.");
      return;
    }

    var settlementDate = els.settlementDate.value;
    if (!settlementDate) {
      showError("Podaj datę rozliczenia.");
      return;
    }

    var btn = els.fetchRateBtn;
    btn.disabled = true;
    btn.innerHTML = 'Pobieram... <span class="spinner"></span>';
    clearError();

    try {
      var rate = await NbpApi.fetchRateBeforeDate(state.selectedCountry.currency, settlementDate);
      state.nbpRate = rate;

      els.rateInfo.style.display = "grid";
      els.rateTableNo.textContent = rate.no;
      els.rateCurrency.textContent = state.selectedCountry.currency;
      els.rateValue.textContent = DelegationUtils.formatAmount(rate.mid, 4) + " zł";
      els.rateDate.textContent = DelegationUtils.formatDate(rate.effectiveDate);
    } catch (e) {
      showError("Błąd pobierania kursu NBP: " + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Pobierz kurs NBP";
    }
  }

  async function onCalculate() {
    clearError();

    // Check required fields manually for better mobile compatibility
    var requiredFields = els.delegationForm.querySelectorAll("[required]");
    for (var i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value) {
        var fieldWrap = requiredFields[i].closest(".field, .field-inline");
        var labelEl = fieldWrap ? fieldWrap.querySelector("label") : null;
        showError("Wypełnij pole: " + (labelEl ? labelEl.textContent.replace(" *", "") : requiredFields[i].id));
        requiredFields[i].focus();
        return;
      }
    }

    if (!state.selectedCountry) {
      showError("Wybierz kraj.");
      return;
    }

    try {
      if (!state.nbpRate) {
        await onFetchRate();
        if (!state.nbpRate) return;
      }

      var c = state.selectedCountry;
      var rate = state.nbpRate;

      var depTime = DelegationUtils.parseDatetime(els.depDate.value, els.depTime.value);
      var arrHomeTime = DelegationUtils.parseDatetime(els.arrHomeDate.value, els.arrHomeTime.value);
      var borderExit = DelegationUtils.parseDatetime(els.borderExitDate.value, els.borderExitTime.value);
      var borderEntry = DelegationUtils.parseDatetime(els.borderEntryDate.value, els.borderEntryTime.value);

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
      els.resultSection.style.display = "block";
      els.resDietCount.textContent = dietCountLabel;
      els.resDietRate.textContent = fmt(effectiveDietRate) + " " + sym;
      els.resDietTotal.textContent = fmt(dietTotalForeign) + " " + sym;
      els.resRate.textContent = fmt(rate.mid, 4) + " zł";
      els.resDietPLN.textContent = fmt(totalPLN) + " zł";
      els.resTotalPLN.textContent = fmt(totalPLN) + " PLN";
      els.resTotalWords.textContent = DelegationUtils.amountToWords(totalPLN, "PLN");

      els.resultSection.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      showError("Błąd obliczania: " + e.message);
    }
  }

  function onGeneratePdf() {
    if (!state.calculation || !state.nbpRate || !state.selectedCountry) {
      showError("Najpierw oblicz rozliczenie.");
      return;
    }

    PdfGenerator.generate({
      employee: {
        name: els.employeeName.value,
        address: els.employeeAddress.value,
        nip: els.employeeNip.value,
        email: els.employeeEmail.value,
        phone: els.employeePhone.value,
      },
      trip: {
        number: els.tripNumber.value,
        projectNumber: els.projectNumber.value,
        purpose: els.tripPurpose.value,
        country: state.selectedCountry.name,
        destinationCity: els.destinationCity.value,
        transport: els.transport.value,
      },
      departure: { city: els.depCity.value, date: els.depDate.value, time: els.depTime.value },
      arrivalDest: { date: els.arrDestDate.value, time: els.arrDestTime.value },
      returnDep: { date: els.retDate.value, time: els.retTime.value },
      arrivalHome: { date: els.arrHomeDate.value, time: els.arrHomeTime.value },
      borderExit: { date: els.borderExitDate.value, time: els.borderExitTime.value },
      borderEntry: { date: els.borderEntryDate.value, time: els.borderEntryTime.value },
      settlementDate: els.settlementDate.value,
      attachmentsCount: 0,
      country: state.selectedCountry,
      nbpRate: state.nbpRate,
      calculation: state.calculation,
    });
  }

  function showError(msg) {
    clearError();
    var el = document.createElement("div");
    el.className = "error-msg";
    el.id = "errorMsg";
    el.textContent = msg;
    els.delegationForm.prepend(el);
    el.scrollIntoView({ behavior: "smooth" });
  }

  function clearError() {
    var el = document.getElementById("errorMsg");
    if (el) el.remove();
  }
})();
