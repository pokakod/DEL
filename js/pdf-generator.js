// Generator PDF rozliczenia delegacji — modern layout
var PdfGenerator = (function () {
  var fmt = DelegationUtils.formatAmount;
  var fmtDate = DelegationUtils.formatDate;
  var toWords = DelegationUtils.amountToWords;

  // Color palette
  var C = {
    navy:     [15, 23, 42],     // #0f172a - headers, accents
    slate:    [51, 65, 85],     // #334155 - body text
    muted:    [100, 116, 139],  // #64748b - labels
    border:   [203, 213, 225],  // #cbd5e1 - lines
    bgLight:  [248, 250, 252],  // #f8fafc - zebra rows
    bgHead:   [241, 245, 249],  // #f1f5f9 - table header
    accent:   [5, 150, 105],    // #059669 - emerald for totals
    white:    [255, 255, 255],
  };

  // --- Helpers ---

  function setColor(doc, rgb) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  function drawLine(doc, x1, y1, x2, y2, color, width) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(width || 0.3);
    doc.line(x1, y1, x2, y2);
  }

  function drawTableRow(doc, x, y, cols, h, opts) {
    opts = opts || {};
    var fontSize = opts.fontSize || 7;
    var bold = opts.bold || false;
    var fill = opts.fill || null;
    var textColor = opts.textColor || C.slate;
    var borderColor = opts.borderColor || C.border;

    doc.setFontSize(fontSize);
    doc.setFont("Arial", bold ? "bold" : "normal");

    var cx = x;
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var w = col.w;
      var text = String(col.t || "");
      var a = col.a || "left";

      // Fill
      if (fill) {
        doc.setFillColor(fill[0], fill[1], fill[2]);
        doc.rect(cx, y, w, h, "F");
      }

      // Bottom border only (clean look)
      drawLine(doc, cx, y + h, cx + w, y + h, borderColor, 0.2);

      // Text
      var tx = a === "center" ? cx + w / 2 : a === "right" ? cx + w - 2.5 : cx + 2.5;
      setColor(doc, textColor);
      doc.text(text, tx, y + h / 2, { align: a, baseline: "middle" });
      cx += w;
    }
  }

  function sectionTitle(doc, x, y, text) {
    doc.setFont("Arial", "bold");
    doc.setFontSize(8.5);
    setColor(doc, C.navy);
    doc.text(text, x, y);
    y += 1.5;
    drawLine(doc, x, y, x + 180, y, C.navy, 0.5);
    return y + 3;
  }

  function label(doc, x, y, text) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(6.5);
    setColor(doc, C.muted);
    doc.text(text, x, y);
  }

  function value(doc, x, y, text) {
    doc.setFont("Arial", "bold");
    doc.setFontSize(7.5);
    setColor(doc, C.slate);
    doc.text(String(text || "—"), x, y);
  }

  function fieldBlock(doc, x, y, lbl, val) {
    label(doc, x, y, lbl);
    value(doc, x, y + 3.5, val);
  }

  function generate(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var W = 210;
    var M = 16;       // margin
    var CW = W - 2 * M; // content width = 178
    var y = 0;

    var sym = CURRENCY_SYMBOLS[data.country.currency] || data.country.currency;

    PdfFonts.register(doc);

    // ============================================================
    // HEADER
    // ============================================================
    doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.rect(0, 0, W, 26, "F");

    // Decorative accent line
    doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
    doc.rect(0, 26, W, 1, "F");

    doc.setFont("Arial", "bold");
    doc.setFontSize(13);
    setColor(doc, C.white);
    doc.text("ROZLICZENIE DELEGACJI ZAGRANICZNEJ", W / 2, 11, { align: "center" });

    doc.setFont("Arial", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    var subtitle = "Nr wyjazdu: " + data.trip.number;
    if (data.trip.projectNumber) subtitle += "   \u2022   Projekt: " + data.trip.projectNumber;
    doc.text(subtitle, W / 2, 18, { align: "center" });

    // Date in top-right corner
    doc.setFontSize(6.5);
    doc.text("Data rozliczenia: " + fmtDate(data.settlementDate), W - M, 23, { align: "right" });

    y = 33;

    // ============================================================
    // EMPLOYEE & TRIP INFO — two-column layout
    // ============================================================
    var col1 = M;
    var col2 = M + CW / 2 + 4;
    var fieldW = CW / 2 - 4;

    // Left column — Delegowany
    doc.setFont("Arial", "bold");
    doc.setFontSize(7);
    setColor(doc, C.muted);
    doc.text("DELEGOWANY", col1, y);

    // Right column — Wyjazd
    doc.text("WYJAZD", col2, y);
    y += 4;

    // Row 1
    fieldBlock(doc, col1, y, "Imię i nazwisko", data.employee.name);
    fieldBlock(doc, col2, y, "Cel podróży", data.trip.purpose);
    y += 8.5;

    // Row 2
    fieldBlock(doc, col1, y, "Adres", data.employee.address || "—");
    fieldBlock(doc, col2, y, "Kraj docelowy", data.trip.country);
    y += 8.5;

    // Row 3
    if (data.employee.nip) {
      fieldBlock(doc, col1, y, "NIP", data.employee.nip);
    }
    fieldBlock(doc, col2, y, "Miejscowość", data.trip.destinationCity);
    y += 8.5;

    // Row 4 (optional)
    if (data.employee.email || data.employee.phone) {
      if (data.employee.email) fieldBlock(doc, col1, y, "Email", data.employee.email);
      if (data.employee.phone) fieldBlock(doc, col2, y, "Telefon", data.employee.phone);
      y += 8.5;
    }

    fieldBlock(doc, col1, y, "Środek lokomocji", data.trip.transport);
    y += 11;

    // Separator
    drawLine(doc, M, y, M + CW, y, C.border, 0.3);
    y += 6;

    // ============================================================
    // TRASA PODRÓŻY
    // ============================================================
    y = sectionTitle(doc, M, y, "TRASA PODRÓŻY");

    var tw = [CW * 0.22, CW * 0.16, CW * 0.12, CW * 0.22, CW * 0.16, CW * 0.12];

    drawTableRow(doc, M, y, [
      { w: tw[0], t: "Skąd", a: "center" },
      { w: tw[1], t: "Data", a: "center" },
      { w: tw[2], t: "Godz.", a: "center" },
      { w: tw[3], t: "Dokąd", a: "center" },
      { w: tw[4], t: "Data", a: "center" },
      { w: tw[5], t: "Godz.", a: "center" },
    ], 5.5, { bold: true, fill: C.bgHead, textColor: C.navy, fontSize: 6.5 });
    y += 5.5;

    drawTableRow(doc, M, y, [
      { w: tw[0], t: data.departure.city },
      { w: tw[1], t: fmtDate(data.departure.date), a: "center" },
      { w: tw[2], t: data.departure.time, a: "center" },
      { w: tw[3], t: data.trip.destinationCity },
      { w: tw[4], t: data.arrivalDest.date ? fmtDate(data.arrivalDest.date) : "—", a: "center" },
      { w: tw[5], t: data.arrivalDest.time || "—", a: "center" },
    ], 5.5);
    y += 5.5;

    drawTableRow(doc, M, y, [
      { w: tw[0], t: data.trip.destinationCity },
      { w: tw[1], t: fmtDate(data.returnDep.date), a: "center" },
      { w: tw[2], t: data.returnDep.time, a: "center" },
      { w: tw[3], t: data.departure.city },
      { w: tw[4], t: fmtDate(data.arrivalHome.date), a: "center" },
      { w: tw[5], t: data.arrivalHome.time, a: "center" },
    ], 5.5);
    y += 10;

    // ============================================================
    // PRZEKROCZENIE GRANICY RP
    // ============================================================
    y = sectionTitle(doc, M, y, "PRZEKROCZENIE GRANICY RP");

    var bw = CW / 3;

    drawTableRow(doc, M, y, [
      { w: bw, t: "", a: "center" },
      { w: bw, t: "Data", a: "center" },
      { w: bw, t: "Godzina", a: "center" },
    ], 5.5, { bold: true, fill: C.bgHead, textColor: C.navy, fontSize: 6.5 });
    y += 5.5;

    drawTableRow(doc, M, y, [
      { w: bw, t: "Wyjazd z RP" },
      { w: bw, t: fmtDate(data.borderExit.date), a: "center" },
      { w: bw, t: data.borderExit.time, a: "center" },
    ], 5.5);
    y += 5.5;

    drawTableRow(doc, M, y, [
      { w: bw, t: "Przyjazd do RP" },
      { w: bw, t: fmtDate(data.borderEntry.date), a: "center" },
      { w: bw, t: data.borderEntry.time, a: "center" },
    ], 5.5);
    y += 10;

    // ============================================================
    // ROZLICZENIE KOSZTÓW
    // ============================================================
    y = sectionTitle(doc, M, y, "ROZLICZENIE KOSZTÓW");

    var dw = [CW * 0.42, CW * 0.14, CW * 0.20, CW * 0.24];

    drawTableRow(doc, M, y, [
      { w: dw[0], t: "Pozycja", a: "left" },
      { w: dw[1], t: "Ilość", a: "center" },
      { w: dw[2], t: "Stawka", a: "right" },
      { w: dw[3], t: "Kwota", a: "right" },
    ], 5.5, { bold: true, fill: C.bgHead, textColor: C.navy, fontSize: 6.5 });
    y += 5.5;

    // Foreign diets
    var dietLabel = DelegationUtils.formatDietCount(data.calculation.foreignDietInfo);
    drawTableRow(doc, M, y, [
      { w: dw[0], t: "Diety zagraniczne (" + data.trip.country + ")" },
      { w: dw[1], t: dietLabel, a: "center" },
      { w: dw[2], t: fmt(data.calculation.effectiveDietRate) + " " + sym, a: "right" },
      { w: dw[3], t: fmt(data.calculation.dietTotalForeign) + " " + sym, a: "right" },
    ], 5.5, { bold: true });
    y += 5.5;

    // Domestic diets
    var domTotal = data.calculation.domesticDiets * 45;
    drawTableRow(doc, M, y, [
      { w: dw[0], t: "Diety krajowe" },
      { w: dw[1], t: fmt(data.calculation.domesticDiets), a: "center" },
      { w: dw[2], t: "45,00 zł", a: "right" },
      { w: dw[3], t: domTotal > 0 ? fmt(domTotal) + " zł" : "—", a: "right" },
    ], 5.5, { fill: C.bgLight });
    y += 5.5;

    // Placeholder rows
    drawTableRow(doc, M, y, [
      { w: dw[0], t: "Wydatki krajowe wg załączników" },
      { w: dw[1], t: "—", a: "center" },
      { w: dw[2], t: "—", a: "right" },
      { w: dw[3], t: "—", a: "right" },
    ], 5.5);
    y += 5.5;

    drawTableRow(doc, M, y, [
      { w: dw[0], t: "Ewidencja przebiegu pojazdu" },
      { w: dw[1], t: "—", a: "center" },
      { w: dw[2], t: "—", a: "right" },
      { w: dw[3], t: "—", a: "right" },
    ], 5.5, { fill: C.bgLight });
    y += 10;

    // ============================================================
    // KURS NBP
    // ============================================================
    y = sectionTitle(doc, M, y, "KURS WYMIANY WALUT");

    // Inline display instead of table — more modern
    var rateItems = [
      { lbl: "Tabela NBP:", val: data.nbpRate.no },
      { lbl: "Waluta:", val: data.country.currency },
      { lbl: "Kurs średni:", val: fmt(data.nbpRate.mid, 4) + " zł" },
      { lbl: "Z dnia:", val: fmtDate(data.nbpRate.effectiveDate) },
    ];

    var rx = M;
    for (var i = 0; i < rateItems.length; i++) {
      doc.setFont("Arial", "normal");
      doc.setFontSize(6.5);
      setColor(doc, C.muted);
      doc.text(rateItems[i].lbl, rx, y);
      var lblW = doc.getTextWidth(rateItems[i].lbl);

      doc.setFont("Arial", "bold");
      doc.setFontSize(7);
      setColor(doc, C.slate);
      doc.text(rateItems[i].val, rx + lblW + 1.5, y);
      var valW = doc.getTextWidth(rateItems[i].val);

      rx += lblW + valW + 8;
    }
    y += 10;

    // ============================================================
    // DO WYPŁATY — summary box
    // ============================================================
    var boxH = 28;
    var boxR = 2.5;

    // Dark background
    doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.roundedRect(M, y, CW, boxH, boxR, boxR, "F");

    // Accent stripe on left
    doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
    doc.rect(M, y, 3, boxH, "F");
    // Fix rounded corner overlap
    doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.rect(M, y, boxR, boxR, "F");
    doc.rect(M, y + boxH - boxR, boxR, boxR, "F");
    doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
    doc.rect(M + boxR, y, 3 - boxR, boxR, "F");
    doc.rect(M + boxR, y + boxH - boxR, 3 - boxR, boxR, "F");

    // "DO WYPŁATY" label
    doc.setFont("Arial", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("DO WYPŁATY", M + 8, y + 6);

    // Main PLN amount
    doc.setFont("Arial", "bold");
    doc.setFontSize(18);
    setColor(doc, C.white);
    doc.text(fmt(data.calculation.totalPLN) + " PLN", M + CW - 6, y + 9, { align: "right" });

    // Foreign currency
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(fmt(data.calculation.totalForeign) + " " + data.country.currency, M + CW - 6, y + 16, { align: "right" });

    // Amount in words
    doc.setFont("Arial", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("Słownie: " + toWords(data.calculation.totalPLN, "PLN"), M + 8, y + 22);

    y += boxH + 14;

    // ============================================================
    // SIGNATURES
    // ============================================================
    var sigW = 55;
    var sigGap = CW - 2 * sigW;

    drawLine(doc, M, y, M + sigW, y, C.border, 0.4);
    drawLine(doc, M + sigW + sigGap, y, M + CW, y, C.border, 0.4);
    y += 3.5;

    doc.setFont("Arial", "normal");
    doc.setFontSize(5.5);
    setColor(doc, C.muted);
    doc.text("data i podpis delegowanego", M + sigW / 2, y, { align: "center" });
    doc.text("podpis zatwierdzającego", M + sigW + sigGap + sigW / 2, y, { align: "center" });

    // ============================================================
    // FOOTER
    // ============================================================
    var footerY = 283;
    drawLine(doc, M, footerY, M + CW, footerY, C.border, 0.2);
    footerY += 3;

    doc.setFontSize(5);
    setColor(doc, C.muted);
    doc.setFont("Arial", "normal");

    var footerParts = [data.employee.name];
    if (data.employee.address) footerParts.push(data.employee.address);
    if (data.employee.nip) footerParts.push("NIP: " + data.employee.nip);
    if (data.employee.email) footerParts.push(data.employee.email);
    if (data.employee.phone) footerParts.push(data.employee.phone);
    doc.text(footerParts.join("  \u2022  "), W / 2, footerY, { align: "center" });

    // ============================================================
    // SAVE
    // ============================================================
    var fileName = data.trip.number.replace(/\//g, "_") + "_Delegacja.pdf";
    doc.save(fileName);
  }

  return { generate: generate };
})();
