// Helper bersama untuk login admin sederhana (1 password, 1 pengguna).
// Tidak pakai library eksternal — cukup HMAC bawaan Node.js.
// Cocok untuk internal tool skala kecil, BUKAN untuk sistem multi-user
// yang butuh audit trail per akun (kalau nanti perlu itu, upgrade ke
// Supabase Auth).

const crypto = require("crypto");

const COOKIE_NAME = "falcom_admin_session";
const SESSION_HOURS = 12;

function getSecret() {
    const secret = process.env.COOKIE_SECRET;
    if (!secret) {
        throw new Error("COOKIE_SECRET belum di-set di environment variables Netlify.");
    }
    return secret;
}

function sign(payload) {
    const secret = getSecret();
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    return `${data}.${sig}`;
}

function verify(token) {
    try {
        const secret = getSecret();
        const [data, sig] = token.split(".");
        if (!data || !sig) return null;

        const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
        const sigBuffer = Buffer.from(sig);
        const expectedBuffer = Buffer.from(expectedSig);
        if (sigBuffer.length !== expectedBuffer.length) return null;
        if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

        const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
        if (!payload.exp || Date.now() > payload.exp) return null;

        return payload;
    } catch (err) {
        return null;
    }
}

function createSessionCookie() {
    const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
    const token = sign({ exp });
    const maxAge = SESSION_HOURS * 60 * 60;
    return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function isAuthenticated(event) {
    const cookieHeader = event.headers.cookie || event.headers.Cookie || "";
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (!match) return false;
    return verify(match[1]) !== null;
}

module.exports = { createSessionCookie, clearSessionCookie, isAuthenticated };
