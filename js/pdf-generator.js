// Generator PDF rozliczenia delegacji — Claude-inspired warm minimal
var PdfGenerator = (function () {
  var fmt = DelegationUtils.formatAmount;
  var fmtDate = DelegationUtils.formatDate;
  var toWords = DelegationUtils.amountToWords;

  // Warm palette inspired by Claude UI
  var C = {
    text:    [61, 57, 41],       // #3D3929 warm charcoal
    label:   [155, 150, 136],    // #9B9688 warm muted
    light:   [185, 181, 170],    // #B9B5AA lighter muted
    rule:    [232, 229, 223],    // #E8E5DF warm border
    cream:   [250, 249, 246],    // #FAF9F6 warm bg
    accent:  [212, 113, 78],     // #D4714E coral/terracotta
    white:   [255, 255, 255],
  };

  function tc(doc, c) { doc.setTextColor(c[0], c[1], c[2]); }
  function fc(doc, c) { doc.setFillColor(c[0], c[1], c[2]); }
  function dc(doc, c) { doc.setDrawColor(c[0], c[1], c[2]); }

  function hline(doc, x1, y, x2, c, w) {
    dc(doc, c || C.rule);
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
      hline(doc, cx, y + h, cx + w, C.rule, 0.15);
      var tx = a === "center" ? cx + w / 2 : a === "right" ? cx + w - 2.5 : cx + 2.5;
      tc(doc, opts.tc || C.text);
      doc.text(t, tx, y + h / 2, { align: a, baseline: "middle" });
      cx += w;
    }
  }

  function sect(doc, x, y, w, text) {
    doc.setFont("Arial", "bold");
    doc.setFontSize(7.5);
    tc(doc, C.text);
    doc.text(text, x, y);
    y += 1.5;
    hline(doc, x, y, x + w, C.text, 0.3);
    return y + 3.5;
  }

  function field(doc, x, y, l, v) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(6);
    tc(doc, C.label);
    doc.text(l, x, y);
    doc.setFont("Arial", "normal");
    doc.setFontSize(7.5);
    tc(doc, C.text);
    doc.text(String(v || "\u2014"), x, y + 3.5);
  }

  function generate(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var W = 210, M = 20, CW = W - 2 * M, y = 0;
    var sym = CURRENCY_SYMBOLS[data.country.currency] || data.country.currency;

    PdfFonts.register(doc);

    // Warm cream page background
    fc(doc, C.cream);
    doc.rect(0, 0, W, 297, "F");

    // ── HEADER ──
    y = 18;
    doc.setFont("Arial", "bold");
    doc.setFontSize(13);
    tc(doc, C.text);
    doc.text("Rozliczenie delegacji zagranicznej", M, y);

    // Accent dot
    fc(doc, C.accent);
    doc.circle(M - 5, y - 1.5, 1.5, "F");

    y += 5;
    doc.setFont("Arial", "normal");
    doc.setFontSize(7);
    tc(doc, C.label);
    doc.text(data.trip.number + (data.trip.projectNumber ? "  /  Projekt " + data.trip.projectNumber : ""), M, y);
    doc.text(fmtDate(data.settlementDate), W - M, y, { align: "right" });

    y += 3;
    hline(doc, M, y, M + CW, C.rule, 0.3);
    y += 8;

    // ── DANE ──
    var c1 = M, c2 = M + CW / 2 + 6;

    doc.setFont("Arial", "bold");
    doc.setFontSize(6);
    tc(doc, C.light);
    doc.text("DELEGOWANY", c1, y);
    doc.text("WYJAZD", c2, y);
    y += 4.5;

    field(doc, c1, y, "Imię i nazwisko", data.employee.name);
    field(doc, c2, y, "Cel podróży", data.trip.purpose);
    y += 9;

    field(doc, c1, y, "Adres", data.employee.address || "\u2014");
    field(doc, c2, y, "Kraj docelowy", data.trip.country);
    y += 9;

    if (data.employee.nip) field(doc, c1, y, "NIP", data.employee.nip);
    field(doc, c2, y, "Miejscowość", data.trip.destinationCity);
    y += 9;

    if (data.employee.email || data.employee.phone) {
      if (data.employee.email) field(doc, c1, y, "Email", data.employee.email);
      if (data.employee.phone) field(doc, c2, y, "Telefon", data.employee.phone);
      y += 9;
    }

    field(doc, c1, y, "Środek lokomocji", data.trip.transport);
    y += 11;

    hline(doc, M, y, M + CW, C.rule, 0.2);
    y += 6;

    // ── TRASA PODRÓŻY ──
    y = sect(doc, M, y, CW, "Trasa podróży");
    var tw = [CW * 0.22, CW * 0.16, CW * 0.12, CW * 0.22, CW * 0.16, CW * 0.12];

    row(doc, M, y, [
      { w: tw[0], t: "Skąd", a: "center" }, { w: tw[1], t: "Data", a: "center" },
      { w: tw[2], t: "Godz.", a: "center" }, { w: tw[3], t: "Dokąd", a: "center" },
      { w: tw[4], t: "Data", a: "center" }, { w: tw[5], t: "Godz.", a: "center" },
    ], 5.5, { bold: true, tc: C.label, fs: 6.5 });
    y += 5.5;

    row(doc, M, y, [
      { w: tw[0], t: data.departure.city },
      { w: tw[1], t: fmtDate(data.departure.date), a: "center" },
      { w: tw[2], t: data.departure.time, a: "center" },
      { w: tw[3], t: data.trip.destinationCity },
      { w: tw[4], t: data.arrivalDest.date ? fmtDate(data.arrivalDest.date) : "\u2014", a: "center" },
      { w: tw[5], t: data.arrivalDest.time || "\u2014", a: "center" },
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
    y += 9;

    // ── PRZEKROCZENIE GRANICY ──
    y = sect(doc, M, y, CW, "Przekroczenie granicy RP");
    var bw = CW / 3;

    row(doc, M, y, [
      { w: bw, t: "" }, { w: bw, t: "Data", a: "center" }, { w: bw, t: "Godzina", a: "center" },
    ], 5.5, { bold: true, tc: C.label, fs: 6.5 });
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
    y += 9;

    // ── ROZLICZENIE KOSZTÓW ──
    y = sect(doc, M, y, CW, "Rozliczenie kosztów");
    var dw = [CW * 0.42, CW * 0.14, CW * 0.20, CW * 0.24];

    row(doc, M, y, [
      { w: dw[0], t: "Pozycja" }, { w: dw[1], t: "Ilość", a: "center" },
      { w: dw[2], t: "Stawka", a: "right" }, { w: dw[3], t: "Kwota", a: "right" },
    ], 5.5, { bold: true, tc: C.label, fs: 6.5 });
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
      { w: dw[3], t: domTotal > 0 ? fmt(domTotal) + " zł" : "\u2014", a: "right" },
    ], 5.5);
    y += 5.5;

    row(doc, M, y, [
      { w: dw[0], t: "Wydatki krajowe wg załączników" },
      { w: dw[1], t: "\u2014", a: "center" },
      { w: dw[2], t: "\u2014", a: "right" },
      { w: dw[3], t: "\u2014", a: "right" },
    ], 5.5);
    y += 5.5;

    row(doc, M, y, [
      { w: dw[0], t: "Ewidencja przebiegu pojazdu" },
      { w: dw[1], t: "\u2014", a: "center" },
      { w: dw[2], t: "\u2014", a: "right" },
      { w: dw[3], t: "\u2014", a: "right" },
    ], 5.5);
    y += 9;

    // ── KURS NBP ──
    y = sect(doc, M, y, CW, "Kurs wymiany walut");
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
    y += 10;

    // ── DO WYPŁATY — warm accent card ──
    var boxH = 26;

    // Accent left stripe
    fc(doc, C.accent);
    doc.rect(M, y, 2.5, boxH, "F");

    // Soft border
    dc(doc, C.rule);
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, boxH);

    doc.setFont("Arial", "normal"); doc.setFontSize(6.5); tc(doc, C.label);
    doc.text("Do wypłaty", M + 8, y + 5.5);

    doc.setFont("Arial", "bold"); doc.setFontSize(18); tc(doc, C.text);
    doc.text(fmt(data.calculation.totalPLN) + " PLN", M + CW - 7, y + 9, { align: "right" });

    doc.setFont("Arial", "normal"); doc.setFontSize(9); tc(doc, C.label);
    doc.text(fmt(data.calculation.totalForeign) + " " + data.country.currency, M + CW - 7, y + 15.5, { align: "right" });

    doc.setFontSize(5.5); tc(doc, C.light);
    doc.text("Słownie: " + toWords(data.calculation.totalPLN, "PLN"), M + 8, y + 21.5);

    y += boxH + 16;

    // ── PODPISY ──
    var sigW = 55;
    var sigGap = CW - 2 * sigW;

    if (data.signature !== "none" && typeof SIGNATURE_IMG !== "undefined") {
      var imgW = 38, imgH = 12;
      doc.addImage(SIGNATURE_IMG, "PNG", M + (sigW - imgW) / 2, y - imgH - 1, imgW, imgH);
    }

    hline(doc, M, y, M + sigW, C.rule, 0.3);
    hline(doc, M + sigW + sigGap, y, M + CW, C.rule, 0.3);
    y += 3;

    doc.setFont("Arial", "normal"); doc.setFontSize(5.5); tc(doc, C.light);
    doc.text("data i podpis delegowanego", M + sigW / 2, y, { align: "center" });
    doc.text("podpis zatwierdzającego", M + sigW + sigGap + sigW / 2, y, { align: "center" });

    // ── STOPKA ──
    var fy = 284;
    hline(doc, M, fy, M + CW, C.rule, 0.15);
    fy += 3;
    doc.setFontSize(5); tc(doc, C.light);
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
