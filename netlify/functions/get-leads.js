const { createClient } = require("@supabase/supabase-js");
const { isAuthenticated } = require("./_auth");

exports.handler = async function (event) {
    if (!isAuthenticated(event)) {
        return { statusCode: 401, body: JSON.stringify({ error: "Belum login." }) };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set." })
        };
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ leads: data }) };
};
