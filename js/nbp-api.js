// Klient API NBP - pobieranie kursów walut z tabeli A
var NbpApi = (function () {
  var NBP_BASE = "https://api.nbp.pl/api";

  function subtractDays(dateStr, days) {
    var d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Pobiera kurs waluty z NBP na podaną datę.
   * Jeśli brak notowania (weekend/święto), cofa się wstecz (max 7 dni).
   */
  async function fetchRate(currencyCode, date) {
    var code = currencyCode.toLowerCase();
    if (code === "pln") {
      return { mid: 1, no: "-", effectiveDate: date };
    }

    for (var i = 0; i < 7; i++) {
      var d = subtractDays(date, i);
      try {
        var url = NBP_BASE + "/exchangerates/rates/a/" + code + "/" + d + "/?format=json";
        var res = await fetch(url);
        if (res.status === 404) continue;
        if (!res.ok) throw new Error("NBP API error: " + res.status);

        var data = await res.json();
        var rate = data.rates[0];
        return {
          mid: rate.mid,
          no: rate.no,
          effectiveDate: rate.effectiveDate,
        };
      } catch (e) {
        if (i < 6) continue; // retry on any error except last attempt
        throw e;
      }
    }

    throw new Error("Nie znaleziono kursu " + currencyCode + " w NBP dla daty " + date + " ani 7 dni wstecz.");
  }

  /**
   * Pobiera kurs z ostatniego dnia roboczego PRZED podaną datą.
   */
  async function fetchRateBeforeDate(currencyCode, date) {
    var dayBefore = subtractDays(date, 1);
    return fetchRate(currencyCode, dayBefore);
  }

  return {
    fetchRate: fetchRate,
    fetchRateBeforeDate: fetchRateBeforeDate,
  };
})();
