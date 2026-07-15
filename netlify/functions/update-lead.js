const { createClient } = require("@supabase/supabase-js");
const { isAuthenticated } = require("./_auth");

const ALLOWED_FIELDS = ["status", "deal_value", "notes", "contacted_at"];

exports.handler = async function (event) {
    if (!isAuthenticated(event)) {
        return { statusCode: 401, body: JSON.stringify({ error: "Belum login." }) };
    }
    if (event.httpMethod !== "POST" && event.httpMethod !== "PATCH") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    let body;
    try {
        body = JSON.parse(event.body || "{}");
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ error: "Body tidak valid." }) };
    }

    if (!body.id) {
        return { statusCode: 400, body: JSON.stringify({ error: "id lead wajib diisi." }) };
    }

    const updates = {};
    ALLOWED_FIELDS.forEach((field) => {
        if (body[field] !== undefined) updates[field] = body[field];
    });

    if (Object.keys(updates).length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: "Tidak ada field yang diupdate." }) };
    }

    // Kalau status diubah jadi "dihubungi" dan contacted_at belum diisi manual,
    // catat waktunya otomatis — berguna untuk metrik waktu respons di dashboard.
    if (updates.status === "dihubungi" && !updates.contacted_at) {
        updates.contacted_at = new Date().toISOString();
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", body.id)
        .select()
        .single();

    if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ lead: data }) };
};
