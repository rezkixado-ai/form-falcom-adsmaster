(function () {
    "use strict";

    /* =========== KONFIGURASI — ganti sesuai punya lo ==================== */
    var SUPABASE_URL = "https://kydmsidtztaqcrkvrkrk.supabase.co"; // TODO ganti
    var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZG1zaWR0enRhcWNya3Zya3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTU3MjQsImV4cCI6MjA5OTY3MTcyNH0.Rpt-o9BYsJeUUzF0EVa8w6z19EU8kf1GZjBSVCSIaB4";            // TODO ganti
    var WA_PHONE_NUMBER = "6288271839200";                     // TODO ganti (format 62xxxxxxxxxx)
    /* ====================================================================== */

    document.getElementById("year").textContent = new Date().getFullYear();

    // ---------- 1) Render 12 tube warna fiber di hero ----------
    var TUBE_COLORS = [
        "#2E5AAC", "#FF7A33", "#2F9E4F", "#7A4B32", "#7C8A93", "#E7ECEF",
        "#D0342C", "#1A1D1F", "#E8C547", "#7B4FA0", "#E58AA0", "#21C7B8"
    ];
    (function renderFiberTubes() {
        var group = document.getElementById("fiberTubes");
        if (!group) return;
        var cx = 180, cy = 180, r = 96, dotR = 11;
        var ns = "http://www.w3.org/2000/svg";
        TUBE_COLORS.forEach(function (color, i) {
            var angle = (Math.PI * 2 * i) / TUBE_COLORS.length - Math.PI / 2;
            var x = cx + r * Math.cos(angle);
            var y = cy + r * Math.sin(angle);
            var dot = document.createElementNS(ns, "circle");
            dot.setAttribute("cx", x.toFixed(1));
            dot.setAttribute("cy", y.toFixed(1));
            dot.setAttribute("r", dotR);
            dot.setAttribute("fill", color);
            dot.setAttribute("stroke", "rgba(0,0,0,0.25)");
            group.appendChild(dot);
        });
    })();

    // ---------- 2) Tangkap UTM dari URL (dari klik Google Ads) ----------
    function getUtmParams() {
        var params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get("utm_source") || null,
            utm_medium: params.get("utm_medium") || null,
            utm_campaign: params.get("utm_campaign") || null
        };
    }

    // ---------- 3) Submit form -> Supabase -> dataLayer -> redirect WA ----------
    var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    var form = document.getElementById("leadForm");
    var submitBtn = document.getElementById("submitBtn");
    var errorEl = document.getElementById("formError");

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }

    function buildWaLink(fields) {
        var text =
            "Halo Falcom, saya " + fields.name +
            (fields.company ? " dari " + fields.company : "") +
            ". Saya tertarik dengan " + fields.need + ".";
        return "https://api.whatsapp.com/send?phone=" + WA_PHONE_NUMBER +
            "&text=" + encodeURIComponent(text);
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        errorEl.hidden = true;

        var fields = {
            name: document.getElementById("f-name").value.trim(),
            phone: document.getElementById("f-phone").value.trim(),
            company: document.getElementById("f-company").value.trim(),
            need: document.getElementById("f-need").value
        };

        if (!fields.name || !fields.phone || !fields.need) {
            showError("Nama, nomor WhatsApp, dan kebutuhan wajib diisi.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Mengirim...";

        var utm = getUtmParams();

        supabaseClient
            .from("leads")
            .insert([{
                name: fields.name,
                phone: fields.phone,
                company: fields.company || null,
                need: fields.need,
                utm_source: utm.utm_source,
                utm_medium: utm.utm_medium,
                utm_campaign: utm.utm_campaign,
                page_url: window.location.href
            }])
            .then(function (result) {
                if (result.error) {
                    console.error("Supabase insert error:", result.error);
                    showError("Gagal mengirim, coba lagi sebentar lagi.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Kirim & Lanjut ke WhatsApp";
                    return;
                }

                // Kirim event ke GTM/GA4 — bisa dijadikan Conversion terpisah nanti
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    event: "generate_lead",
                    lead_campaign: utm.utm_campaign || "(direct)"
                });

                submitBtn.textContent = "Mengalihkan ke WhatsApp...";
                window.location.href = buildWaLink(fields);
            })
            .catch(function (err) {
                console.error("Unexpected error:", err);
                showError("Terjadi kesalahan jaringan, coba lagi.");
                submitBtn.disabled = false;
                submitBtn.textContent = "Kirim & Lanjut ke WhatsApp";
            });
    });
})();
