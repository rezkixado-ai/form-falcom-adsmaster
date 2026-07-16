(function () {
    "use strict";

    /* =========== KONFIGURASI — ganti sesuai punya lo ==================== */
    var SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co"; // TODO ganti
    var SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";            // TODO ganti
    var WA_PHONE_NUMBER = "6281300000000";                     // TODO ganti (format 62xxxxxxxxxx)
    /* ====================================================================== */

    document.getElementById("year").textContent = new Date().getFullYear();

    /* =========================================================================
       HERO SLIDER — edit array di bawah ini untuk ganti isi slide.
       Tambah objek baru = nambah slide. Hapus objek = kurangin slide.
       Urutan array = urutan slide yang muncul.
       ========================================================================= */
    var HERO_SLIDES = [
        {
            eyebrow: "Distributor Resmi &middot; Sejak 2003 &middot; Surabaya &amp; Jakarta",
            title: "Infrastruktur Fiber<br>yang Bisnis Anda<br>Bisa Andalkan.",
            sub: "Kabel fiber optik, OLT, ONU, dan perangkat FTTH untuk ISP dan kontraktor jaringan &mdash; stok ready, harga bertingkat untuk pembelian volume, dan tim konsultasi yang paham lapangan.",
            specs: ["2 &ndash; 288 CORE", "G.652D / G.657A", "STOK READY"],
            ctaPrimaryText: "Konsultasi Kebutuhan Saya",
            ctaPrimaryHref: "#form",
            ctaSecondaryText: "Lihat Program Kemitraan",
            ctaSecondaryHref: "#program-mitra"
        },
        {
            eyebrow: "Program Mitra &middot; Harga Bertingkat &middot; Stok Prioritas",
            title: "Jadi Mitra Resmi,<br>Bukan Sekadar<br>Reseller Biasa.",
            sub: "Harga khusus mitra, dukungan materi marketing, dan prioritas stok untuk agen serta reseller yang serius mengembangkan bisnis jaringan.",
            specs: ["DISKON BERTINGKAT", "MATERI PROMOSI", "PRIORITAS STOK"],
            ctaPrimaryText: "Daftar Jadi Mitra",
            ctaPrimaryHref: "#program-mitra",
            ctaSecondaryText: "Lihat Harga Volume",
            ctaSecondaryHref: "#harga"
        },
        {
            eyebrow: "20+ Tahun Beroperasi &middot; Ribuan ISP Terlayani",
            title: "Stok Ready,<br>Konsultasi Teknis<br>yang Paham Lapangan.",
            sub: "Tim kami bukan sekadar jual barang &mdash; kami bantu hitung kebutuhan, redaman, dan desain jaringan Anda sebelum barang dikirim.",
            specs: ["QUALITY CONTROL", "RESPON CEPAT", "6 KOTA CABANG"],
            ctaPrimaryText: "Konsultasi Gratis Sekarang",
            ctaPrimaryHref: "#form",
            ctaSecondaryText: "Lihat Produk",
            ctaSecondaryHref: "#harga"
        }
    ];
    var HERO_AUTOPLAY_MS = 6500; // kecepatan ganti slide otomatis (ms) — makin besar makin lambat

    (function initHeroSlider() {
        var sliderEl = document.getElementById("heroSlider");
        var dotsEl = document.getElementById("heroDots");
        var prevBtn = document.getElementById("heroPrev");
        var nextBtn = document.getElementById("heroNext");
        if (!sliderEl || HERO_SLIDES.length === 0) return;

        var current = 0;
        var autoplayTimer = null;

        // Render semua slide sekali di awal
        sliderEl.innerHTML = HERO_SLIDES.map(function (slide, i) {
            var specsHtml = (slide.specs || []).map(function (s) {
                return '<span class="fl-chip">' + s + "</span>";
            }).join("");
            return (
                '<div class="fl-hero__slide' + (i === 0 ? " is-active" : "") + '" data-slide-index="' + i + '">' +
                    '<p class="fl-eyebrow">' + slide.eyebrow + "</p>" +
                    '<h1 class="fl-hero__title">' + slide.title + "</h1>" +
                    '<p class="fl-hero__sub">' + slide.sub + "</p>" +
                    '<div class="fl-hero__specs">' + specsHtml + "</div>" +
                    '<div class="fl-hero__ctas">' +
                        '<a href="' + slide.ctaPrimaryHref + '" class="fl-btn fl-btn--primary">' + slide.ctaPrimaryText + "</a>" +
                        '<a href="' + slide.ctaSecondaryHref + '" class="fl-btn fl-btn--outline">' + slide.ctaSecondaryText + "</a>" +
                    "</div>" +
                "</div>"
            );
        }).join("");

        // Render dots
        if (dotsEl) {
            dotsEl.innerHTML = HERO_SLIDES.map(function (_, i) {
                return '<button type="button" class="fl-hero__dot' + (i === 0 ? " is-active" : "") + '" data-dot-index="' + i + '" aria-label="Ke slide ' + (i + 1) + '"></button>';
            }).join("");
        }

        var slideEls = sliderEl.querySelectorAll(".fl-hero__slide");
        var dotEls = dotsEl ? dotsEl.querySelectorAll(".fl-hero__dot") : [];

        function goTo(index) {
            if (index === current) return;
            slideEls[current].classList.remove("is-active");
            dotEls[current] && dotEls[current].classList.remove("is-active");
            current = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
            slideEls[current].classList.add("is-active");
            dotEls[current] && dotEls[current].classList.add("is-active");
        }

        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

        function startAutoplay() {
            stopAutoplay();
            if (HERO_SLIDES.length > 1) {
                autoplayTimer = setInterval(next, HERO_AUTOPLAY_MS);
            }
        }
        function stopAutoplay() {
            if (autoplayTimer) clearInterval(autoplayTimer);
        }

        if (nextBtn) nextBtn.addEventListener("click", function () { next(); startAutoplay(); });
        if (prevBtn) prevBtn.addEventListener("click", function () { prev(); startAutoplay(); });
        if (dotsEl) {
            dotsEl.addEventListener("click", function (e) {
                var btn = e.target.closest(".fl-hero__dot");
                if (!btn) return;
                goTo(parseInt(btn.getAttribute("data-dot-index"), 10));
                startAutoplay();
            });
        }

        // Pause autoplay saat hover, biar user bisa baca tenang
        sliderEl.addEventListener("mouseenter", stopAutoplay);
        sliderEl.addEventListener("mouseleave", startAutoplay);

        startAutoplay();
    })();

    /* =========================================================================
       HIT COUNTER — animasi angka naik pelan-pelan saat elemen kelihatan di layar.
       Elemen butuh atribut data-count-target (angka tujuan) dan opsional
       data-count-suffix (misal "+"). Berjalan sekali per elemen.
       ========================================================================= */
    (function initHitCounters() {
        var counters = document.querySelectorAll("[data-count-target]");
        if (counters.length === 0) return;

        var DURATION_MS = 2800; // kecepatan hitung — makin besar makin lambat

        function easeOutQuad(t) { return t * (2 - t); }

        function animateCounter(el) {
            var target = parseFloat(el.getAttribute("data-count-target")) || 0;
            var suffix = el.getAttribute("data-count-suffix") || "";
            var startTime = null;

            function step(timestamp) {
                if (startTime === null) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / DURATION_MS, 1);
                var eased = easeOutQuad(progress);
                var current = Math.floor(eased * target);
                el.textContent = current + suffix;
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    el.textContent = target + suffix; // pastikan angka akhir presisi
                }
            }
            window.requestAnimationFrame(step);
        }

        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.4 });
            counters.forEach(function (el) { observer.observe(el); });
        } else {
            // Fallback browser lama: langsung jalanin semua
            counters.forEach(animateCounter);
        }
    })();

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
