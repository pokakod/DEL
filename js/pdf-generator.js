// Generator PDF rozliczenia delegacji
var PdfGenerator = (function () {
  var fmt = DelegationUtils.formatAmount;
  var fmtDate = DelegationUtils.formatDate;
  var toWords = DelegationUtils.amountToWords;

  function drawCell(doc, x, y, w, h, text, bold) {
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h);
    if (bold) doc.setFont("helvetica", "bold");
    doc.text(text, x + w / 2, y + h / 2 + 1.5, { align: "center" });
    if (bold) doc.setFont("helvetica", "normal");
  }

  function generate(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var W = 210;
    var margin = 15;
    var contentW = W - 2 * margin;
    var y = 15;

    var sym = CURRENCY_SYMBOLS[data.country.currency] || data.country.currency;

    doc.setFont("helvetica");

    // === NAGLOWEK ===
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text("ROZLICZENIE DELEGACJI ZAGRANICZNEJ", W / 2, y, { align: "center" });
    y += 6;

    // --- Numer wyjazdu + nr projektu ---
    doc.setFontSize(9);
    doc.setTextColor(40);
    doc.text("Wyjazd sluzbowy nr:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(data.trip.number, margin + 38, y);
    doc.setFont("helvetica", "normal");
    doc.text("Nr projektu:", W - margin - 50, y);
    doc.setFont("helvetica", "bold");
    doc.text(data.trip.projectNumber || "-", W - margin - 20, y);
    y += 6;

    // --- Dane pracownika ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    var leftX = margin;
    var rightX = W / 2 + 10;

    doc.text("Dla:", leftX, y);
    doc.setFont("helvetica", "bold");
    doc.text(data.employee.name, leftX + 15, y);
    doc.text(data.employee.name, rightX, y);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.text("Do:", leftX, y);
    doc.text(data.trip.destinationCity, leftX + 15, y);
    doc.text("Kraj:", leftX + 60, y);
    doc.text(data.trip.country, leftX + 75, y);
    if (data.employee.address) doc.text(data.employee.address, rightX, y);
    y += 4.5;

    doc.text("od:", leftX, y);
    doc.text(fmtDate(data.departure.date), leftX + 15, y);
    doc.text("do:", leftX + 40, y);
    doc.text(fmtDate(data.arrivalHome.date), leftX + 50, y);
    if (data.employee.nip) doc.text("NIP: " + data.employee.nip, rightX, y);
    y += 4.5;

    doc.text("w celu:", leftX, y);
    doc.text(data.trip.purpose, leftX + 15, y);
    y += 7;

    // === RACHUNEK KOSZTOW ===
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("RACHUNEK KOSZTOW PODROZY", W / 2, y, { align: "center" });
    y += 6;

    // --- Tabela WYJAZD / PRZYJAZD / SRODKI ---
    var tableTop = y;
    var col1 = margin;
    var col2 = margin + contentW * 0.33;
    var col3 = margin + contentW * 0.66;

    doc.setFontSize(7.5);
    drawCell(doc, col1, y, contentW * 0.33, 6, "WYJAZD", true);
    drawCell(doc, col2, y, contentW * 0.33, 6, "PRZYJAZD", true);
    drawCell(doc, col3, y, contentW * 0.34, 6, "SRODKI LOKOMOCJI", true);
    y += 6;

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("miejscowosc", col1 + 2, y + 3);
    doc.text("data", col1 + 28, y + 3);
    doc.text("godzina", col1 + 42, y + 3);
    doc.text("miejscowosc", col2 + 2, y + 3);
    doc.text("data", col2 + 28, y + 3);
    doc.text("godzina", col2 + 42, y + 3);
    y += 5;

    doc.setFontSize(7);
    doc.text(data.departure.city, col1 + 2, y + 3);
    doc.text(fmtDate(data.departure.date), col1 + 28, y + 3);
    doc.text(data.departure.time, col1 + 42, y + 3);
    doc.text(data.trip.destinationCity, col2 + 2, y + 3);
    doc.text(data.arrivalDest.date ? fmtDate(data.arrivalDest.date) : "-", col2 + 28, y + 3);
    doc.text(data.arrivalDest.time || "-", col2 + 42, y + 3);
    doc.text(data.trip.transport, col3 + 2, y + 3);
    y += 5;

    doc.text(data.trip.destinationCity, col1 + 2, y + 3);
    doc.text(fmtDate(data.returnDep.date), col1 + 28, y + 3);
    doc.text(data.returnDep.time, col1 + 42, y + 3);
    doc.text(data.departure.city, col2 + 2, y + 3);
    doc.text(fmtDate(data.arrivalHome.date), col2 + 28, y + 3);
    doc.text(data.arrivalHome.time, col2 + 42, y + 3);
    doc.text(data.trip.transport, col3 + 2, y + 3);
    y += 8;

    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.rect(col1, tableTop, contentW, y - tableTop);
    doc.line(col2, tableTop, col2, y);
    doc.line(col3, tableTop, col3, y);
    y += 3;

    // === PRZEKROCZENIE GRANICY + DIETY ===
    var dietTop = y;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Przekroczenie granicy RP", margin, y + 4);
    y += 7;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("data", margin + 20, y + 3);
    doc.text("godzina", margin + 40, y + 3);
    y += 5;

    doc.text("Wyjazd", margin + 2, y + 3);
    doc.text(fmtDate(data.borderExit.date), margin + 20, y + 3);
    doc.text(data.borderExit.time, margin + 40, y + 3);
    y += 4.5;

    doc.text("Przyjazd", margin + 2, y + 3);
    doc.text(fmtDate(data.borderEntry.date), margin + 20, y + 3);
    doc.text(data.borderEntry.time, margin + 40, y + 3);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("ilosc diet:   " + DelegationUtils.formatDietCount(data.calculation.foreignDietInfo), margin + 2, y + 3);
    y += 4;

    // Prawa strona - diety
    var dtX = margin + contentW * 0.45;
    var dy = dietTop;

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");

    doc.text("Ilosc", dtX + 50, dy + 3);
    doc.text("Koszt jedn.", dtX + 65, dy + 3);
    doc.text("Koszt calkowity", dtX + 85, dy + 3);
    dy += 5;

    doc.text("Diety krajowe", dtX + 2, dy + 3);
    doc.text(fmt(data.calculation.domesticDiets), dtX + 50, dy + 3);
    doc.text("45,00 zl", dtX + 65, dy + 3);
    var domTotal = data.calculation.domesticDiets * 45;
    doc.text(domTotal > 0 ? fmt(domTotal) + " zl" : "- zl", dtX + 85, dy + 3);
    dy += 4.5;

    doc.text("Wydatki krajowe wg zal.", dtX + 2, dy + 3);
    doc.text("0,00", dtX + 50, dy + 3);
    doc.text("- zl", dtX + 65, dy + 3);
    doc.text("- zl", dtX + 85, dy + 3);
    dy += 4.5;

    doc.text("Ewidencja przebiegu pojazdu", dtX + 2, dy + 3);
    doc.text("0,00", dtX + 50, dy + 3);
    doc.text("- zl", dtX + 65, dy + 3);
    doc.text("- zl", dtX + 85, dy + 3);
    dy += 5;

    doc.setFont("helvetica", "bold");
    doc.text("Diety zagraniczne", dtX + 2, dy + 3);
    doc.text(DelegationUtils.formatDietCount(data.calculation.foreignDietInfo), dtX + 50, dy + 3);
    doc.text(fmt(data.calculation.effectiveDietRate) + " " + sym, dtX + 65, dy + 3);
    doc.text(fmt(data.calculation.dietTotalForeign) + " " + sym, dtX + 85, dy + 3);
    dy += 4.5;

    y = Math.max(y, dy) + 8;

    // === PODSUMOWANIE ===
    doc.setDrawColor(180);
    doc.line(margin, y, margin + contentW, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PODSUMOWANIE", margin, y);
    y += 6;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("Ilosc zalacznikow:    " + data.attachmentsCount, margin, y);
    doc.text("Numer tabeli kursu wymiany walut NBP:", margin + contentW * 0.45, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(data.nbpRate.no, margin + contentW * 0.45, y);
    y += 7;

    var kursX = margin + contentW * 0.45;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("Waluta", kursX + 20, y);
    doc.text("Kurs", kursX + 40, y);
    doc.text("Razem", kursX + 60, y);
    y += 4;

    doc.text("Kurs waluty:", kursX, y);
    doc.setFont("helvetica", "bold");
    doc.text(data.country.currency, kursX + 20, y);
    doc.text(fmt(data.nbpRate.mid, 4) + " zl", kursX + 40, y);
    doc.text(fmt(data.calculation.totalPLN) + " zl", kursX + 60, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.text("Z dnia:", kursX, y);
    doc.text(fmtDate(data.nbpRate.effectiveDate), kursX + 20, y);
    y += 10;

    // === DO WYPLATY ===
    doc.setDrawColor(40);
    doc.setLineWidth(0.5);
    var payBoxX = margin + contentW * 0.35;
    var payBoxW = contentW * 0.65;
    doc.rect(payBoxX, y, payBoxW, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DO WYPLATY:", payBoxX + 4, y + 6);

    doc.setFontSize(13);
    doc.text(fmt(data.calculation.totalPLN) + " PLN", payBoxX + payBoxW - 4, y + 6, { align: "right" });

    doc.setFontSize(9);
    doc.text(fmt(data.calculation.totalForeign) + " " + data.country.currency, payBoxX + payBoxW - 4, y + 13, { align: "right" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Slownie:", payBoxX + 4, y + 19);
    doc.setFontSize(6.5);
    doc.text(toWords(data.calculation.totalPLN, "PLN"), payBoxX + 4, y + 23);
    doc.text(toWords(data.calculation.totalForeign, data.country.currency), payBoxX + 4, y + 27);

    y += 36;

    // === DATA I PODPIS ===
    doc.setFontSize(8);
    doc.setTextColor(40);
    doc.text(fmtDate(data.settlementDate), margin, y);
    doc.text(".........................................", margin + 50, y);
    y += 4;
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text("(data)", margin + 10, y);
    doc.text("(podpis)", margin + 65, y);
    y += 10;

    // === STOPKA ===
    doc.setDrawColor(180);
    doc.line(margin, y, margin + contentW, y);
    y += 4;

    doc.setFontSize(6.5);
    doc.setTextColor(100);
    doc.text(data.employee.name, margin, y);
    if (data.employee.email) doc.text(data.employee.email, margin + contentW * 0.4, y);
    y += 3.5;
    if (data.employee.address) doc.text(data.employee.address, margin, y);
    if (data.employee.phone) doc.text(data.employee.phone, margin + contentW * 0.4, y);
    y += 3.5;
    if (data.employee.nip) doc.text("NIP: " + data.employee.nip, margin, y);
    // === ZAPIS ===
    var fileName = data.trip.number.replace(/\//g, "_") + "_Delegacja.pdf";
    doc.save(fileName);
  }

  return { generate: generate };
})();
