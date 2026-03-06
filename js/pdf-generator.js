// Generator PDF rozliczenia delegacji — flat design
var PdfGenerator = (function () {
  var fmt = DelegationUtils.formatAmount;
  var fmtDate = DelegationUtils.formatDate;
  var toWords = DelegationUtils.amountToWords;

  // Flat grayscale
  var C = {
    black:  [30, 30, 30],
    text:   [50, 50, 50],
    label:  [120, 120, 120],
    line:   [210, 210, 210],
    bg:     [245, 245, 245],
    white:  [255, 255, 255],
  };

  function tc(doc, c) { doc.setTextColor(c[0], c[1], c[2]); }
  function fc(doc, c) { doc.setFillColor(c[0], c[1], c[2]); }
  function dc(doc, c) { doc.setDrawColor(c[0], c[1], c[2]); }

  function line(doc, x1, y, x2, c, w) {
    dc(doc, c || C.line);
    doc.setLineWidth(w || 0.2);
    doc.line(x1, y, x2, y);
  }

  function row(doc, x, y, cols, h, opts) {
    opts = opts || {};
    doc.setFontSize(opts.fs || 7);
    doc.setFont("Arial", opts.bold ? "bold" : "normal");
    var fill = opts.fill;
    var cx = x;
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var w = col.w, t = String(col.t || ""), a = col.a || "left";
      if (fill) { fc(doc, fill); doc.rect(cx, y, w, h, "F"); }
      line(doc, cx, y + h, cx + w, C.line, 0.15);
      var tx = a === "center" ? cx + w / 2 : a === "right" ? cx + w - 2 : cx + 2;
      tc(doc, opts.tc || C.text);
      doc.text(t, tx, y + h / 2, { align: a, baseline: "middle" });
      cx += w;
    }
  }

  function section(doc, x, y, w, text) {
    doc.setFont("Arial", "bold");
    doc.setFontSize(7.5);
    tc(doc, C.black);
    doc.text(text, x, y);
    y += 1.5;
    line(doc, x, y, x + w, C.black, 0.4);
    return y + 3;
  }

  function field(doc, x, y, l, v) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(6);
    tc(doc, C.label);
    doc.text(l, x, y);
    doc.setFont("Arial", "bold");
    doc.setFontSize(7.5);
    tc(doc, C.text);
    doc.text(String(v || "—"), x, y + 3.5);
  }

  function generate(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var W = 210, M = 18, CW = W - 2 * M, y = 0;
    var sym = CURRENCY_SYMBOLS[data.country.currency] || data.country.currency;

    PdfFonts.register(doc);

    // ── HEADER ──
    y = 14;
    doc.setFont("Arial", "bold");
    doc.setFontSize(12);
    tc(doc, C.black);
    doc.text("ROZLICZENIE DELEGACJI ZAGRANICZNEJ", W / 2, y, { align: "center" });
    y += 5;

    doc.setFont("Arial", "normal");
    doc.setFontSize(7);
    tc(doc, C.label);
    var sub = data.trip.number;
    if (data.trip.projectNumber) sub += "  /  Projekt " + data.trip.projectNumber;
    doc.text(sub, M, y);

    doc.text("Data rozliczenia: " + fmtDate(data.settlementDate), W - M, y, { align: "right" });
    y += 2;

    line(doc, M, y, M + CW, C.black, 0.5);
    y += 6;

    // ── DANE ──
    var c1 = M, c2 = M + CW / 2 + 4;

    doc.setFont("Arial", "bold");
    doc.setFontSize(6);
    tc(doc, C.label);
    doc.text("DELEGOWANY", c1, y);
    doc.text("WYJAZD", c2, y);
    y += 4;

    field(doc, c1, y, "Imię i nazwisko", data.employee.name);
    field(doc, c2, y, "Cel podróży", data.trip.purpose);
    y += 8;

    field(doc, c1, y, "Adres", data.employee.address || "—");
    field(doc, c2, y, "Kraj docelowy", data.trip.country);
    y += 8;

    if (data.employee.nip) field(doc, c1, y, "NIP", data.employee.nip);
    field(doc, c2, y, "Miejscowość", data.trip.destinationCity);
    y += 8;

    if (data.employee.email || data.employee.phone) {
      if (data.employee.email) field(doc, c1, y, "Email", data.employee.email);
      if (data.employee.phone) field(doc, c2, y, "Telefon", data.employee.phone);
      y += 8;
    }

    field(doc, c1, y, "Środek lokomocji", data.trip.transport);
    y += 10;

    line(doc, M, y, M + CW, C.line);
    y += 5;

    // ── TRASA PODRÓŻY ──
    y = section(doc, M, y, CW, "TRASA PODRÓŻY");
    var tw = [CW * 0.22, CW * 0.16, CW * 0.12, CW * 0.22, CW * 0.16, CW * 0.12];

    row(doc, M, y, [
      { w: tw[0], t: "Skąd", a: "center" }, { w: tw[1], t: "Data", a: "center" },
      { w: tw[2], t: "Godz.", a: "center" }, { w: tw[3], t: "Dokąd", a: "center" },
      { w: tw[4], t: "Data", a: "center" }, { w: tw[5], t: "Godz.", a: "center" },
    ], 5.5, { bold: true, fill: C.bg, tc: C.black, fs: 6.5 });
    y += 5.5;

    row(doc, M, y, [
      { w: tw[0], t: data.departure.city },
      { w: tw[1], t: fmtDate(data.departure.date), a: "center" },
      { w: tw[2], t: data.departure.time, a: "center" },
      { w: tw[3], t: data.trip.destinationCity },
      { w: tw[4], t: data.arrivalDest.date ? fmtDate(data.arrivalDest.date) : "—", a: "center" },
      { w: tw[5], t: data.arrivalDest.time || "—", a: "center" },
    ], 5.5);
    y += 5.5;

    row(doc, M, y, [
      { w: tw[0], t: data.trip.destinationCity },
      { w: tw[1], t: fmtDate(data.returnDep.date), a: "center" },
      { w: tw[2], t: data.returnDep.time, a: "center" },
      { w: tw[3], t: data.departure.city },
      { w: tw[4], t: fmtDate(data.arrivalHome.date), a: "center" },
      { w: tw[5], t: data.arrivalHome.time, a: "center" },
    ], 5.5);
    y += 8;

    // ── PRZEKROCZENIE GRANICY ──
    y = section(doc, M, y, CW, "PRZEKROCZENIE GRANICY RP");
    var bw = CW / 3;

    row(doc, M, y, [
      { w: bw, t: "" }, { w: bw, t: "Data", a: "center" }, { w: bw, t: "Godzina", a: "center" },
    ], 5.5, { bold: true, fill: C.bg, tc: C.black, fs: 6.5 });
    y += 5.5;

    row(doc, M, y, [
      { w: bw, t: "Wyjazd z RP" },
      { w: bw, t: fmtDate(data.borderExit.date), a: "center" },
      { w: bw, t: data.borderExit.time, a: "center" },
    ], 5.5);
    y += 5.5;

    row(doc, M, y, [
      { w: bw, t: "Przyjazd do RP" },
      { w: bw, t: fmtDate(data.borderEntry.date), a: "center" },
      { w: bw, t: data.borderEntry.time, a: "center" },
    ], 5.5);
    y += 8;

    // ── ROZLICZENIE KOSZTÓW ──
    y = section(doc, M, y, CW, "ROZLICZENIE KOSZTÓW");
    var dw = [CW * 0.42, CW * 0.14, CW * 0.20, CW * 0.24];

    row(doc, M, y, [
      { w: dw[0], t: "Pozycja" }, { w: dw[1], t: "Ilość", a: "center" },
      { w: dw[2], t: "Stawka", a: "right" }, { w: dw[3], t: "Kwota", a: "right" },
    ], 5.5, { bold: true, fill: C.bg, tc: C.black, fs: 6.5 });
    y += 5.5;

    var dietLabel = DelegationUtils.formatDietCount(data.calculation.foreignDietInfo);
    row(doc, M, y, [
      { w: dw[0], t: "Diety zagraniczne (" + data.trip.country + ")" },
      { w: dw[1], t: dietLabel, a: "center" },
      { w: dw[2], t: fmt(data.calculation.effectiveDietRate) + " " + sym, a: "right" },
      { w: dw[3], t: fmt(data.calculation.dietTotalForeign) + " " + sym, a: "right" },
    ], 5.5, { bold: true });
    y += 5.5;

    var domTotal = data.calculation.domesticDiets * 45;
    row(doc, M, y, [
      { w: dw[0], t: "Diety krajowe" },
      { w: dw[1], t: fmt(data.calculation.domesticDiets), a: "center" },
      { w: dw[2], t: "45,00 zł", a: "right" },
      { w: dw[3], t: domTotal > 0 ? fmt(domTotal) + " zł" : "—", a: "right" },
    ], 5.5);
    y += 5.5;

    row(doc, M, y, [
      { w: dw[0], t: "Wydatki krajowe wg załączników" },
      { w: dw[1], t: "—", a: "center" },
      { w: dw[2], t: "—", a: "right" },
      { w: dw[3], t: "—", a: "right" },
    ], 5.5);
    y += 5.5;

    row(doc, M, y, [
      { w: dw[0], t: "Ewidencja przebiegu pojazdu" },
      { w: dw[1], t: "—", a: "center" },
      { w: dw[2], t: "—", a: "right" },
      { w: dw[3], t: "—", a: "right" },
    ], 5.5);
    y += 8;

    // ── KURS NBP — inline ──
    y = section(doc, M, y, CW, "KURS WYMIANY WALUT");
    var items = [
      { l: "Tabela NBP:", v: data.nbpRate.no },
      { l: "Waluta:", v: data.country.currency },
      { l: "Kurs średni:", v: fmt(data.nbpRate.mid, 4) + " zł" },
      { l: "Z dnia:", v: fmtDate(data.nbpRate.effectiveDate) },
    ];
    var rx = M;
    for (var i = 0; i < items.length; i++) {
      doc.setFont("Arial", "normal"); doc.setFontSize(6.5); tc(doc, C.label);
      doc.text(items[i].l, rx, y);
      var lw = doc.getTextWidth(items[i].l);
      doc.setFont("Arial", "bold"); doc.setFontSize(7); tc(doc, C.text);
      doc.text(items[i].v, rx + lw + 1.5, y);
      rx += lw + doc.getTextWidth(items[i].v) + 8;
    }
    y += 9;

    // ── DO WYPŁATY — outlined box ──
    var boxH = 24;
    dc(doc, C.black);
    doc.setLineWidth(0.5);
    doc.rect(M, y, CW, boxH);

    doc.setFont("Arial", "normal"); doc.setFontSize(6.5); tc(doc, C.label);
    doc.text("DO WYPŁATY", M + 6, y + 5);

    doc.setFont("Arial", "bold"); doc.setFontSize(18); tc(doc, C.black);
    doc.text(fmt(data.calculation.totalPLN) + " PLN", M + CW - 6, y + 8, { align: "right" });

    doc.setFontSize(9); tc(doc, C.label);
    doc.text(fmt(data.calculation.totalForeign) + " " + data.country.currency, M + CW - 6, y + 14.5, { align: "right" });

    doc.setFont("Arial", "normal"); doc.setFontSize(5.5); tc(doc, C.label);
    doc.text("Słownie: " + toWords(data.calculation.totalPLN, "PLN"), M + 6, y + 20);

    y += boxH + 14;

    // ── PODPISY ──
    var sigW = 55;
    var sigGap = CW - 2 * sigW;

    // Embedded signature (if selected)
    if (data.signature !== "none" && typeof SIGNATURE_IMG !== "undefined") {
      var imgW = 38, imgH = 12;
      doc.addImage(SIGNATURE_IMG, "PNG", M + (sigW - imgW) / 2, y - imgH - 1, imgW, imgH);
    }

    line(doc, M, y, M + sigW, C.label, 0.3);
    line(doc, M + sigW + sigGap, y, M + CW, C.label, 0.3);
    y += 3;

    doc.setFont("Arial", "normal"); doc.setFontSize(5.5); tc(doc, C.label);
    doc.text("data i podpis delegowanego", M + sigW / 2, y, { align: "center" });
    doc.text("podpis zatwierdzającego", M + sigW + sigGap + sigW / 2, y, { align: "center" });

    // ── STOPKA ──
    var fy = 284;
    line(doc, M, fy, M + CW, C.line, 0.15);
    fy += 3;
    doc.setFontSize(5); tc(doc, C.label);
    var fp = [data.employee.name];
    if (data.employee.address) fp.push(data.employee.address);
    if (data.employee.nip) fp.push("NIP: " + data.employee.nip);
    if (data.employee.email) fp.push(data.employee.email);
    if (data.employee.phone) fp.push(data.employee.phone);
    doc.text(fp.join("  \u2022  "), W / 2, fy, { align: "center" });

    // ── SAVE ──
    doc.save(data.trip.number.replace(/\//g, "_") + "_Delegacja.pdf");
  }

  return { generate: generate };
})();
