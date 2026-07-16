(function () {
    "use strict";

    /* =========== KONFIGURASI — ganti sesuai punya lo ==================== */
    var SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co"; // TODO ganti
    var SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";            // TODO ganti
    var WA_PHONE_NUMBER = "6281300000000";                     // TODO ganti (format 62xxxxxxxxxx)
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

    // ---------- 3) Muat wilayah + PIC dari Supabase, isi dropdown ----------
    var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    var regionsCache = [];
    var regionSelect = document.getElementById("f-region");

    function loadRegions() {
        supabaseClient
            .from("regions")
            .select("*")
            .eq("active", true)
            .order("sort_order", { ascending: true })
            .then(function (result) {
                if (result.error || !result.data || result.data.length === 0) {
                    console.error("Gagal memuat wilayah:", result.error);
                    regionSelect.innerHTML = '<option value="" disabled selected>Wilayah tidak tersedia, hubungi kami langsung</option>';
                    return;
                }
                regionsCache = result.data;
                regionSelect.innerHTML = '<option value="" disabled selected>Pilih wilayah Anda</option>';
                regionsCache.forEach(function (region) {
                    var opt = document.createElement("option");
                    opt.value = region.id;
                    opt.textContent = region.region_name;
                    regionSelect.appendChild(opt);
                });
            });
    }
    loadRegions();

    // ---------- 4) Pilih PIC secara acak (50/50) dari wilayah yang dipilih ----------
    function pickPicForRegion(regionId) {
        var region = regionsCache.find(function (r) { return r.id === regionId; });
        if (!region) return null;

        var useFirst = Math.random() < 0.5;
        return {
            regionName: region.region_name,
            picName: useFirst ? region.pic1_name : region.pic2_name,
            picPhone: useFirst ? region.pic1_phone : region.pic2_phone
        };
    }

    var form = document.getElementById("leadForm");
    var submitBtn = document.getElementById("submitBtn");
    var errorEl = document.getElementById("formError");

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }

    function buildWaLink(fields, assignment) {
        var phone = assignment ? assignment.picPhone : WA_PHONE_NUMBER; // fallback kalau wilayah gagal dimuat
        var text =
            "Halo" + (assignment ? " " + assignment.picName : " Falcom") +
            ", saya " + fields.name +
            (fields.company ? " dari " + fields.company : "") +
            (assignment ? " (wilayah " + assignment.regionName + ")" : "") +
            ". Saya tertarik dengan " + fields.need + ".";
        return "https://api.whatsapp.com/send?phone=" + phone +
            "&text=" + encodeURIComponent(text);
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        errorEl.hidden = true;

        var regionId = document.getElementById("f-region").value;
        var fields = {
            name: document.getElementById("f-name").value.trim(),
            phone: document.getElementById("f-phone").value.trim(),
            company: document.getElementById("f-company").value.trim(),
            need: document.getElementById("f-need").value
        };

        if (!fields.name || !fields.phone || !fields.need || !regionId) {
            showError("Nama, nomor WhatsApp, wilayah, dan kebutuhan wajib diisi.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Mengirim...";

        var utm = getUtmParams();
        var assignment = pickPicForRegion(regionId); // acak PIC 1/2 di wilayah terpilih

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
                page_url: window.location.href,
                region: assignment ? assignment.regionName : null,
                assigned_pic_name: assignment ? assignment.picName : null,
                assigned_pic_phone: assignment ? assignment.picPhone : null
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
                    lead_campaign: utm.utm_campaign || "(direct)",
                    lead_region: assignment ? assignment.regionName : "(tidak diketahui)"
                });

                submitBtn.textContent = "Mengalihkan ke WhatsApp...";
                window.location.href = buildWaLink(fields, assignment);
            })
            .catch(function (err) {
                console.error("Unexpected error:", err);
                showError("Terjadi kesalahan jaringan, coba lagi.");
                submitBtn.disabled = false;
                submitBtn.textContent = "Kirim & Lanjut ke WhatsApp";
            });
    });
})();
