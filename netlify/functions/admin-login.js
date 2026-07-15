const { createSessionCookie } = require("./_auth");

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    let body;
    try {
        body = JSON.parse(event.body || "{}");
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ error: "Body tidak valid." }) };
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "ADMIN_PASSWORD belum di-set di Netlify environment variables." })
        };
    }

    if (body.password !== adminPassword) {
        // Sengaja delay dikit biar ga gampang di-brute-force asal-asalan.
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { statusCode: 401, body: JSON.stringify({ error: "Password salah." }) };
    }

    return {
        statusCode: 200,
        headers: { "Set-Cookie": createSessionCookie() },
        body: JSON.stringify({ success: true })
    };
};
