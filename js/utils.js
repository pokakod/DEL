// Funkcje pomocnicze
var DelegationUtils = (function () {

  /**
   * Oblicza diety zagraniczne.
   * Zwraca obiekt z pełnymi dobami, progiem niepełnej doby i etykietą.
   * Kwotę oblicza precyzyjnie (bez float 1/3).
   */
  function calculateForeignDiets(borderExit, borderEntry) {
    var diffMs = borderEntry.getTime() - borderExit.getTime();
    if (diffMs <= 0) return { fullDays: 0, partialLabel: "", partialNumerator: 0, partialDenominator: 1 };

    var totalHours = diffMs / (1000 * 60 * 60);
    var fullDays = Math.floor(totalHours / 24);
    var remainingHours = totalHours - fullDays * 24;

    // 3 progi wg Rozporządzenia §13 ust. 3:
    var partialNumerator = 0; // licznik
    var partialDenominator = 1; // mianownik
    var partialLabel = "";

    if (remainingHours > 12) {
      partialNumerator = 1;
      partialDenominator = 1;
      partialLabel = "1";
    } else if (remainingHours > 8) {
      partialNumerator = 1;
      partialDenominator = 2;
      partialLabel = "1/2";
    } else if (remainingHours > 0) {
      partialNumerator = 1;
      partialDenominator = 3;
      partialLabel = "1/3";
    }

    return {
      fullDays: fullDays,
      partialLabel: partialLabel,
      partialNumerator: partialNumerator,
      partialDenominator: partialDenominator,
    };
  }

  /**
   * Oblicza kwotę diet precyzyjnie (bez floatowego 1/3).
   * fullDays * dietRate + (partialNumerator * dietRate) / partialDenominator
   * Zaokrąglenie do 2 miejsc dopiero na końcu.
   */
  function calculateDietAmount(dietInfo, dietRate) {
    var fullAmount = dietInfo.fullDays * dietRate;
    var partialAmount = (dietInfo.partialNumerator * dietRate) / dietInfo.partialDenominator;
    return Math.round((fullAmount + partialAmount) * 100) / 100;
  }

  /**
   * Formatuje ilość diet do wyświetlenia, np. "20 1/3"
   */
  function formatDietCount(dietInfo) {
    if (dietInfo.partialLabel) {
      return dietInfo.fullDays + " " + dietInfo.partialLabel;
    }
    return String(dietInfo.fullDays);
  }

  function calculateDomesticDiets(departureTime, borderExit, borderEntry, arrivalTime) {
    var domesticHours1 = (borderExit.getTime() - departureTime.getTime()) / (1000 * 60 * 60);
    var domesticHours2 = (arrivalTime.getTime() - borderEntry.getTime()) / (1000 * 60 * 60);
    var totalHours = Math.max(0, domesticHours1) + Math.max(0, domesticHours2);

    if (totalHours <= 0) return 0;
    if (totalHours > 12) return 1;
    if (totalHours > 8) return 0.5;
    return 0;
  }

  function formatDate(date) {
    if (typeof date === "string") date = new Date(date + "T12:00:00");
    var d = String(date.getDate()).padStart(2, "0");
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var y = date.getFullYear();
    return d + "." + m + "." + y;
  }

  function formatTime(date) {
    if (typeof date === "string") date = new Date(date);
    var h = String(date.getHours()).padStart(2, "0");
    var min = String(date.getMinutes()).padStart(2, "0");
    return h + ":" + min;
  }

  function formatAmount(amount, decimals) {
    if (decimals === undefined) decimals = 2;
    return amount.toFixed(decimals).replace(".", ",");
  }

  function amountToWords(amount, currency) {
    var intPart = Math.floor(amount);
    var decPart = Math.round((amount - intPart) * 100);
    var words = numberToPolishWords(intPart);
    return words + " " + currency + " " + String(decPart).padStart(2, "0") + "/100";
  }

  function numberToPolishWords(n) {
    if (n === 0) return "zero";

    var ones = [
      "", "jeden", "dwa", "trzy", "cztery", "piec", "szesc", "siedem",
      "osiem", "dziewiec", "dziesiec", "jedenascie", "dwanascie", "trzynascie",
      "czternascie", "pietnascie", "szesnascie", "siedemnascie", "osiemnascie", "dziewietnascie",
    ];
    var tens = [
      "", "", "dwadziescia", "trzydziesci", "czterdziesci", "piecdziesiat",
      "szescdziesiat", "siedemdziesiat", "osiemdziesiat", "dziewiecdziesiat",
    ];
    var hundreds = [
      "", "sto", "dwiescie", "trzysta", "czterysta", "piecset",
      "szescset", "siedemset", "osiemset", "dziewiecset",
    ];

    var parts = [];

    if (n >= 1000000) {
      var millions = Math.floor(n / 1000000);
      if (millions === 1) parts.push("milion");
      else if (millions >= 2 && millions <= 4) parts.push(numberToPolishWords(millions) + " miliony");
      else parts.push(numberToPolishWords(millions) + " milionow");
      n %= 1000000;
    }

    if (n >= 1000) {
      var thousands = Math.floor(n / 1000);
      if (thousands === 1) parts.push("tysiac");
      else if (thousands >= 2 && thousands <= 4) parts.push(numberToPolishWords(thousands) + " tysiace");
      else if (thousands >= 5 && thousands <= 21) parts.push(numberToPolishWords(thousands) + " tysiecy");
      else {
        var lastDigit = thousands % 10;
        if (lastDigit >= 2 && lastDigit <= 4 && (thousands % 100 < 12 || thousands % 100 > 14)) {
          parts.push(numberToPolishWords(thousands) + " tysiace");
        } else {
          parts.push(numberToPolishWords(thousands) + " tysiecy");
        }
      }
      n %= 1000;
    }

    if (n >= 100) {
      parts.push(hundreds[Math.floor(n / 100)]);
      n %= 100;
    }

    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }

    if (n > 0) {
      parts.push(ones[n]);
    }

    return parts.filter(Boolean).join(" ");
  }

  function parseDatetime(dateStr, timeStr) {
    return new Date(dateStr + "T" + timeStr + ":00");
  }

  return {
    calculateForeignDiets: calculateForeignDiets,
    calculateDietAmount: calculateDietAmount,
    formatDietCount: formatDietCount,
    calculateDomesticDiets: calculateDomesticDiets,
    formatDate: formatDate,
    formatTime: formatTime,
    formatAmount: formatAmount,
    amountToWords: amountToWords,
    parseDatetime: parseDatetime,
  };
})();
