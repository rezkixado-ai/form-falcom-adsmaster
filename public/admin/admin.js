(function () {
    "use strict";

    var loginScreen = document.getElementById("loginScreen");
    var dashboard = document.getElementById("dashboard");
    var loginForm = document.getElementById("loginForm");
    var loginError = document.getElementById("loginError");

    var allLeads = [];
    var trendChartInstance = null;

    // ---------- Login ----------
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        loginError.hidden = true;
        var password = document.getElementById("loginPassword").value;

        fetch("/api/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: password })
        })
            .then(function (res) {
                if (!res.ok) throw new Error("unauthorized");
                return res.json();
            })
            .then(function () {
                loginScreen.hidden = true;
                dashboard.hidden = false;
                loadLeads();
            })
            .catch(function () {
                loginError.textContent = "Password salah, coba lagi.";
                loginError.hidden = false;
            });
    });

    // ---------- Load leads ----------
    function loadLeads() {
        fetch("/api/get-leads")
            .then(function (res) {
                if (!res.ok) throw new Error("gagal ambil data");
                return res.json();
            })
            .then(function (json) {
                allLeads = json.leads || [];
                renderAll();
            })
            .catch(function (err) {
                console.error(err);
                alert("Gagal memuat data lead. Coba refresh halaman.");
            });
    }

    // ---------- Render everything ----------
    function renderAll() {
        renderStats();
        renderTrendChart();
        renderCampaignBars();
        renderRegionBars();
        populateRegionFilter();
        renderTable(applyFilters(allLeads));
    }

    function populateRegionFilter() {
        var select = document.getElementById("regionFilter");
        var current = select.value;
        var regions = Array.from(new Set(allLeads.map(function (l) { return l.region; }).filter(Boolean))).sort();
        select.innerHTML = '<option value="">Semua wilayah</option>';
        regions.forEach(function (r) {
            var opt = document.createElement("option");
            opt.value = r;
            opt.textContent = r;
            select.appendChild(opt);
        });
        select.value = current;
    }

    function renderRegionBars() {
        var counts = {};
        allLeads.forEach(function (l) {
            var key = l.region || "(belum pilih wilayah)";
            counts[key] = (counts[key] || 0) + 1;
        });
        var entries = Object.keys(counts).map(function (k) { return [k, counts[k]]; });
        entries.sort(function (a, b) { return b[1] - a[1]; });
        var max = entries.length ? entries[0][1] : 1;
        var container = document.getElementById("regionBars");
        container.innerHTML = "";
        entries.forEach(function (entry) {
            var row = document.createElement("div");
            row.className = "ad-bar-row";
            row.innerHTML =
                '<span>' + escapeHtml(entry[0]) + '</span>' +
                '<span class="ad-bar-track"><span class="ad-bar-fill" style="width:' +
                Math.round((entry[1] / max) * 100) + '%"></span></span>' +
                '<span class="ad-bar-count">' + entry[1] + '</span>';
            container.appendChild(row);
        });
    }

    function renderStats() {
        var now = new Date();
        var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        var total = allLeads.length;
        var thisWeek = allLeads.filter(function (l) { return new Date(l.created_at) >= weekAgo; }).length;
        var belumDihubungi = allLeads.filter(function (l) { return l.status === "baru"; }).length;
        var dealBulanIni = allLeads.filter(function (l) {
            return l.status === "deal" && new Date(l.created_at) >= monthStart;
        }).length;
        var pipeline = allLeads
            .filter(function (l) { return l.status === "ditawar" || l.status === "deal"; })
            .reduce(function (sum, l) { return sum + (Number(l.deal_value) || 0); }, 0);

        document.getElementById("statTotal").textContent = total;
        document.getElementById("statWeek").textContent = thisWeek;
        document.getElementById("statBaru").textContent = belumDihubungi;
        document.getElementById("statDeal").textContent = dealBulanIni;
        document.getElementById("statPipeline").textContent = formatRupiah(pipeline);
    }

    function formatRupiah(n) {
        return "Rp" + Number(n).toLocaleString("id-ID");
    }

    function renderTrendChart() {
        var days = [];
        var counts = [];
        for (var i = 29; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var key = d.toISOString().slice(0, 10);
            days.push(key.slice(5)); // MM-DD
            counts.push(allLeads.filter(function (l) {
                return l.created_at && l.created_at.slice(0, 10) === key;
            }).length);
        }

        var ctx = document.getElementById("trendChart").getContext("2d");
        if (trendChartInstance) trendChartInstance.destroy();
        trendChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: days,
                datasets: [{
                    data: counts,
                    borderColor: "#FF7A33",
                    backgroundColor: "rgba(255,122,51,0.15)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: "#8B98A3" }, grid: { color: "#2A323A" } },
                    y: { ticks: { color: "#8B98A3", precision: 0 }, grid: { color: "#2A323A" } }
                }
            }
        });
    }

    function renderCampaignBars() {
        var counts = {};
        allLeads.forEach(function (l) {
            var key = l.utm_campaign || "(tanpa campaign / organik)";
            counts[key] = (counts[key] || 0) + 1;
        });

        var entries = Object.keys(counts).map(function (k) { return [k, counts[k]]; });
        entries.sort(function (a, b) { return b[1] - a[1]; });

        var max = entries.length ? entries[0][1] : 1;
        var container = document.getElementById("campaignBars");
        container.innerHTML = "";

        entries.forEach(function (entry) {
            var row = document.createElement("div");
            row.className = "ad-bar-row";
            row.innerHTML =
                '<span>' + escapeHtml(entry[0]) + '</span>' +
                '<span class="ad-bar-track"><span class="ad-bar-fill" style="width:' +
                Math.round((entry[1] / max) * 100) + '%"></span></span>' +
                '<span class="ad-bar-count">' + entry[1] + '</span>';
            container.appendChild(row);
        });
    }

    // ---------- Table ----------
    function applyFilters(leads) {
        var search = document.getElementById("searchInput").value.toLowerCase();
        var status = document.getElementById("statusFilter").value;
        var region = document.getElementById("regionFilter").value;

        return leads.filter(function (l) {
            var matchesSearch = !search ||
                (l.name && l.name.toLowerCase().indexOf(search) !== -1) ||
                (l.phone && l.phone.toLowerCase().indexOf(search) !== -1);
            var matchesStatus = !status || l.status === status;
            var matchesRegion = !region || l.region === region;
            return matchesSearch && matchesStatus && matchesRegion;
        });
    }

    function renderTable(leads) {
        var tbody = document.getElementById("leadsTableBody");
        tbody.innerHTML = "";

        leads.forEach(function (lead) {
            var tr = document.createElement("tr");

            var dateStr = lead.created_at
                ? new Date(lead.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                : "-";
            var campaign = lead.utm_campaign || (lead.utm_source ? lead.utm_source : "organik/langsung");

            var picLabel = lead.assigned_pic_name
                ? lead.assigned_pic_name + " (" + (lead.assigned_pic_phone || "-") + ")"
                : "-";

            tr.innerHTML =
                "<td>" + dateStr + "</td>" +
                "<td>" + escapeHtml(lead.name) + "</td>" +
                "<td>" + escapeHtml(lead.phone) + "</td>" +
                "<td>" + escapeHtml(lead.company || "-") + "</td>" +
                "<td>" + escapeHtml(lead.need || "-") + "</td>" +
                "<td>" + escapeHtml(campaign) + "</td>" +
                "<td>" + escapeHtml(lead.region || "-") + "</td>" +
                "<td>" + escapeHtml(picLabel) + "</td>" +
                "<td></td>" +
                "<td></td>" +
                "<td></td>";

            // Status dropdown
            var statusTd = tr.children[8];
            var select = document.createElement("select");
            select.className = "ad-status-select ad-status-" + lead.status;
            ["baru", "dihubungi", "ditawar", "deal", "gagal"].forEach(function (s) {
                var opt = document.createElement("option");
                opt.value = s;
                opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
                if (s === lead.status) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener("change", function () {
                select.className = "ad-status-select ad-status-" + select.value;
                updateLead(lead.id, { status: select.value });
            });
            statusTd.appendChild(select);

            // Deal value input
            var valueTd = tr.children[9];
            var valueInput = document.createElement("input");
            valueInput.type = "number";
            valueInput.className = "ad-value-input";
            valueInput.placeholder = "0";
            valueInput.value = lead.deal_value || "";
            valueInput.addEventListener("change", function () {
                updateLead(lead.id, { deal_value: valueInput.value ? Number(valueInput.value) : null });
            });
            valueTd.appendChild(valueInput);

            // Notes input
            var notesTd = tr.children[10];
            var notesInput = document.createElement("input");
            notesInput.type = "text";
            notesInput.className = "ad-notes-input";
            notesInput.placeholder = "Catatan sales...";
            notesInput.value = lead.notes || "";
            notesInput.addEventListener("change", function () {
                updateLead(lead.id, { notes: notesInput.value });
            });
            notesTd.appendChild(notesInput);

            tbody.appendChild(tr);
        });
    }

    function updateLead(id, updates) {
        var body = Object.assign({ id: id }, updates);
        fetch("/api/update-lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
            .then(function (res) {
                if (!res.ok) throw new Error("update gagal");
                return res.json();
            })
            .then(function (json) {
                // Update salinan lokal biar statistik ikut ke-refresh tanpa reload
                var idx = allLeads.findIndex(function (l) { return l.id === id; });
                if (idx !== -1) allLeads[idx] = json.lead;
                renderStats();
                renderCampaignBars();
            })
            .catch(function (err) {
                console.error(err);
                alert("Gagal menyimpan perubahan. Coba lagi.");
            });
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ---------- Filters events ----------
    document.getElementById("searchInput").addEventListener("input", function () {
        renderTable(applyFilters(allLeads));
    });
    document.getElementById("statusFilter").addEventListener("change", function () {
        renderTable(applyFilters(allLeads));
    });
    document.getElementById("regionFilter").addEventListener("change", function () {
        renderTable(applyFilters(allLeads));
    });

    // ---------- CSV export ----------
    document.getElementById("exportBtn").addEventListener("click", function () {
        var leads = applyFilters(allLeads);
        var headers = ["Tanggal", "Nama", "WhatsApp", "Perusahaan", "Kebutuhan", "Campaign", "Wilayah", "PIC", "Status", "Nilai Deal", "Catatan"];
        var rows = leads.map(function (l) {
            return [
                l.created_at || "",
                l.name || "",
                l.phone || "",
                l.company || "",
                l.need || "",
                l.utm_campaign || l.utm_source || "",
                l.region || "",
                l.assigned_pic_name || "",
                l.status || "",
                l.deal_value || "",
                l.notes || ""
            ].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
        });
        var csv = [headers.join(","), ...rows].join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "falcom-leads-" + new Date().toISOString().slice(0, 10) + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    });
})();
