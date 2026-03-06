// Generator PDF rozliczenia delegacji — grayscale modernist
var PdfGenerator = (function () {
  var fmt = DelegationUtils.formatAmount;
  var fmtDate = DelegationUtils.formatDate;
  var toWords = DelegationUtils.amountToWords;

  // Grayscale palette
  var C = {
    black:    [20, 20, 20],      // near-black for headers
    dark:     [45, 45, 45],      // dark gray for body text
    mid:      [110, 110, 110],   // medium gray for labels
    light:    [170, 170, 170],   // light gray for muted text
    rule:     [200, 200, 200],   // rule lines
    zebra:    [245, 245, 245],   // zebra stripe bg
    head:     [235, 235, 235],   // table header bg
    white:    [255, 255, 255],
  };

  function setColor(doc, rgb) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  function hLine(doc, x1, y1, x2, color, w) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(w || 0.25);
    doc.line(x1, y1, x2, y1);
  }

  function drawRow(doc, x, y, cols, h, opts) {
    opts = opts || {};
    var fs = opts.fontSize || 7;
    var bold = opts.bold || false;
    var fill = opts.fill || null;
    var tc = opts.textColor || C.dark;

    doc.setFontSize(fs);
    doc.setFont("Arial", bold ? "bold" : "normal");

    var cx = x;
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var w = col.w;
      var text = String(col.t || "");
      var a = col.a || "left";

      if (fill) {
        doc.setFillColor(fill[0], fill[1], fill[2]);
        doc.rect(cx, y, w, h, "F");
      }

      // Bottom border
      hLine(doc, cx, y + h, cx + w, C.rule, 0.15);

      var tx = a === "center" ? cx + w / 2 : a === "right" ? cx + w - 2.5 : cx + 2.5;
      setColor(doc, tc);
      doc.text(text, tx, y + h / 2, { align: a, baseline: "middle" });
      cx += w;
    }
  }

  function sectionHead(doc, x, y, w, text) {
    doc.setFont("Arial", "bold");
    doc.setFontSize(7.5);
    setColor(doc, C.black);
    doc.text(text, x, y);
    y += 1.2;
    hLine(doc, x, y, x + w, C.black, 0.6);
    return y + 3.5;
  }

  function lbl(doc, x, y, text) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(6);
    setColor(doc, C.mid);
    doc.text(text, x, y);
  }

  function val(doc, x, y, text) {
    doc.setFont("Arial", "bold");
    doc.setFontSize(7.5);
    setColor(doc, C.dark);
    doc.text(String(text || "—"), x, y);
  }

  function field(doc, x, y, l, v) {
    lbl(doc, x, y, l);
    val(doc, x, y + 3.5, v);
  }

  function generate(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var W = 210;
    var M = 18;
    var CW = W - 2 * M;
    var y = 0;

    var sym = CURRENCY_SYMBOLS[data.country.currency] || data.country.currency;

    PdfFonts.register(doc);

    // ============================================================
    // HEADER — charcoal bar
    // ============================================================
    doc.setFillColor(C.black[0], C.black[1], C.black[2]);
    doc.rect(0, 0, W, 24, "F");

    doc.setFont("Arial", "bold");
    doc.setFontSize(12);
    setColor(doc, C.white);
    doc.text("ROZLICZENIE DELEGACJI ZAGRANICZNEJ", W / 2, 10, { align: "center" });

    doc.setFont("Arial", "normal");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    var sub = data.trip.number;
    if (data.trip.projectNumber) sub += "  /  Projekt " + data.trip.projectNumber;
    doc.text(sub, W / 2, 16.5, { align: "center" });

    doc.setFontSize(6);
    doc.text("Data rozliczenia: " + fmtDate(data.settlementDate), W - M, 21, { align: "right" });

    y = 31;

    // ============================================================
    // EMPLOYEE + TRIP INFO
    // ============================================================
    var col1 = M;
    var col2 = M + CW / 2 + 5;

    doc.setFont("Arial", "bold");
    doc.setFontSize(6);
    setColor(doc, C.light);
    doc.text("DELEGOWANY", col1, y);
    doc.text("WYJAZD", col2, y);
    y += 4;

    field(doc, col1, y, "Imię i nazwisko", data.employee.name);
    field(doc, col2, y, "Cel podróży", data.trip.purpose);
    y += 8;

    field(doc, col1, y, "Adres", data.employee.address || "—");
    field(doc, col2, y, "Kraj docelowy", data.trip.country);
    y += 8;

    if (data.employee.nip) {
      field(doc, col1, y, "NIP", data.employee.nip);
    }
    field(doc, col2, y, "Miejscowość", data.trip.destinationCity);
    y += 8;

    if (data.employee.email || data.employee.phone) {
      if (data.employee.email) field(doc, col1, y, "Email", data.employee.email);
      if (data.employee.phone) field(doc, col2, y, "Telefon", data.employee.phone);
      y += 8;
    }

    field(doc, col1, y, "Środek lokomocji", data.trip.transport);
    y += 10;

    hLine(doc, M, y, M + CW, C.rule, 0.25);
    y += 6;

    // ============================================================
    // TRASA PODRÓŻY
    // ============================================================
    y = sectionHead(doc, M, y, CW, "TRASA PODRÓŻY");

    var tw = [CW * 0.22, CW * 0.16, CW * 0.12, CW * 0.22, CW * 0.16, CW * 0.12];

    drawRow(doc, M, y, [
      { w: tw[0], t: "Skąd", a: "center" },
      { w: tw[1], t: "Data", a: "center" },
      { w: tw[2], t: "Godz.", a: "center" },
      { w: tw[3], t: "Dokąd", a: "center" },
      { w: tw[4], t: "Data", a: "center" },
      { w: tw[5], t: "Godz.", a: "center" },
    ], 5.5, { bold: true, fill: C.head, textColor: C.black, fontSize: 6.5 });
    y += 5.5;

    drawRow(doc, M, y, [
      { w: tw[0], t: data.departure.city },
      { w: tw[1], t: fmtDate(data.departure.date), a: "center" },
      { w: tw[2], t: data.departure.time, a: "center" },
      { w: tw[3], t: data.trip.destinationCity },
      { w: tw[4], t: data.arrivalDest.date ? fmtDate(data.arrivalDest.date) : "—", a: "center" },
      { w: tw[5], t: data.arrivalDest.time || "—", a: "center" },
    ], 5.5);
    y += 5.5;

    drawRow(doc, M, y, [
      { w: tw[0], t: data.trip.destinationCity },
      { w: tw[1], t: fmtDate(data.returnDep.date), a: "center" },
      { w: tw[2], t: data.returnDep.time, a: "center" },
      { w: tw[3], t: data.departure.city },
      { w: tw[4], t: fmtDate(data.arrivalHome.date), a: "center" },
      { w: tw[5], t: data.arrivalHome.time, a: "center" },
    ], 5.5, { fill: C.zebra });
    y += 9;

    // ============================================================
    // PRZEKROCZENIE GRANICY RP
    // ============================================================
    y = sectionHead(doc, M, y, CW, "PRZEKROCZENIE GRANICY RP");

    var bw = CW / 3;

    drawRow(doc, M, y, [
      { w: bw, t: "", a: "center" },
      { w: bw, t: "Data", a: "center" },
      { w: bw, t: "Godzina", a: "center" },
    ], 5.5, { bold: true, fill: C.head, textColor: C.black, fontSize: 6.5 });
    y += 5.5;

    drawRow(doc, M, y, [
      { w: bw, t: "Wyjazd z RP" },
      { w: bw, t: fmtDate(data.borderExit.date), a: "center" },
      { w: bw, t: data.borderExit.time, a: "center" },
    ], 5.5);
    y += 5.5;

    drawRow(doc, M, y, [
      { w: bw, t: "Przyjazd do RP" },
      { w: bw, t: fmtDate(data.borderEntry.date), a: "center" },
      { w: bw, t: data.borderEntry.time, a: "center" },
    ], 5.5, { fill: C.zebra });
    y += 9;

    // ============================================================
    // ROZLICZENIE KOSZTÓW
    // ============================================================
    y = sectionHead(doc, M, y, CW, "ROZLICZENIE KOSZTÓW");

    var dw = [CW * 0.42, CW * 0.14, CW * 0.20, CW * 0.24];

    drawRow(doc, M, y, [
      { w: dw[0], t: "Pozycja" },
      { w: dw[1], t: "Ilość", a: "center" },
      { w: dw[2], t: "Stawka", a: "right" },
      { w: dw[3], t: "Kwota", a: "right" },
    ], 5.5, { bold: true, fill: C.head, textColor: C.black, fontSize: 6.5 });
    y += 5.5;

    var dietLabel = DelegationUtils.formatDietCount(data.calculation.foreignDietInfo);
    drawRow(doc, M, y, [
      { w: dw[0], t: "Diety zagraniczne (" + data.trip.country + ")" },
      { w: dw[1], t: dietLabel, a: "center" },
      { w: dw[2], t: fmt(data.calculation.effectiveDietRate) + " " + sym, a: "right" },
      { w: dw[3], t: fmt(data.calculation.dietTotalForeign) + " " + sym, a: "right" },
    ], 5.5, { bold: true });
    y += 5.5;

    var domTotal = data.calculation.domesticDiets * 45;
    drawRow(doc, M, y, [
      { w: dw[0], t: "Diety krajowe" },
      { w: dw[1], t: fmt(data.calculation.domesticDiets), a: "center" },
      { w: dw[2], t: "45,00 zł", a: "right" },
      { w: dw[3], t: domTotal > 0 ? fmt(domTotal) + " zł" : "—", a: "right" },
    ], 5.5, { fill: C.zebra });
    y += 5.5;

    drawRow(doc, M, y, [
      { w: dw[0], t: "Wydatki krajowe wg załączników" },
      { w: dw[1], t: "—", a: "center" },
      { w: dw[2], t: "—", a: "right" },
      { w: dw[3], t: "—", a: "right" },
    ], 5.5);
    y += 5.5;

    drawRow(doc, M, y, [
      { w: dw[0], t: "Ewidencja przebiegu pojazdu" },
      { w: dw[1], t: "—", a: "center" },
      { w: dw[2], t: "—", a: "right" },
      { w: dw[3], t: "—", a: "right" },
    ], 5.5, { fill: C.zebra });
    y += 9;

    // ============================================================
    // KURS NBP — inline
    // ============================================================
    y = sectionHead(doc, M, y, CW, "KURS WYMIANY WALUT");

    var items = [
      { l: "Tabela NBP:", v: data.nbpRate.no },
      { l: "Waluta:", v: data.country.currency },
      { l: "Kurs średni:", v: fmt(data.nbpRate.mid, 4) + " zł" },
      { l: "Z dnia:", v: fmtDate(data.nbpRate.effectiveDate) },
    ];

    var rx = M;
    for (var i = 0; i < items.length; i++) {
      doc.setFont("Arial", "normal");
      doc.setFontSize(6.5);
      setColor(doc, C.mid);
      doc.text(items[i].l, rx, y);
      var lw = doc.getTextWidth(items[i].l);

      doc.setFont("Arial", "bold");
      doc.setFontSize(7);
      setColor(doc, C.dark);
      doc.text(items[i].v, rx + lw + 1.5, y);
      var vw = doc.getTextWidth(items[i].v);
      rx += lw + vw + 8;
    }
    y += 10;

    // ============================================================
    // DO WYPŁATY — prominent box
    // ============================================================
    var boxH = 26;
    var boxR = 2;

    doc.setFillColor(C.black[0], C.black[1], C.black[2]);
    doc.roundedRect(M, y, CW, boxH, boxR, boxR, "F");

    // Label
    doc.setFont("Arial", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(140, 140, 140);
    doc.text("DO WYPŁATY", M + 7, y + 5.5);

    // PLN amount
    doc.setFont("Arial", "bold");
    doc.setFontSize(18);
    setColor(doc, C.white);
    doc.text(fmt(data.calculation.totalPLN) + " PLN", M + CW - 7, y + 8.5, { align: "right" });

    // Foreign currency
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(fmt(data.calculation.totalForeign) + " " + data.country.currency, M + CW - 7, y + 15, { align: "right" });

    // Words
    doc.setFont("Arial", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Słownie: " + toWords(data.calculation.totalPLN, "PLN"), M + 7, y + 21);

    y += boxH + 14;

    // ============================================================
    // SIGNATURES
    // ============================================================
    var sigW = 55;
    var sigGap = CW - 2 * sigW;

    hLine(doc, M, y, M + sigW, C.light, 0.35);
    hLine(doc, M + sigW + sigGap, y, M + CW, C.light, 0.35);
    y += 3;

    doc.setFont("Arial", "normal");
    doc.setFontSize(5.5);
    setColor(doc, C.light);
    doc.text("data i podpis delegowanego", M + sigW / 2, y, { align: "center" });
    doc.text("podpis zatwierdzającego", M + sigW + sigGap + sigW / 2, y, { align: "center" });

    // ============================================================
    // FOOTER
    // ============================================================
    var fy = 284;
    hLine(doc, M, fy, M + CW, C.rule, 0.15);
    fy += 3;

    doc.setFontSize(5);
    setColor(doc, C.light);
    var fp = [data.employee.name];
    if (data.employee.address) fp.push(data.employee.address);
    if (data.employee.nip) fp.push("NIP: " + data.employee.nip);
    if (data.employee.email) fp.push(data.employee.email);
    if (data.employee.phone) fp.push(data.employee.phone);
    doc.text(fp.join("  \u2022  "), W / 2, fy, { align: "center" });

    // ============================================================
    // SAVE
    // ============================================================
    var fileName = data.trip.number.replace(/\//g, "_") + "_Delegacja.pdf";
    doc.save(fileName);
  }

  return { generate: generate };
})();
