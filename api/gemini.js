// Vercel 서버리스 함수 — Gemini 프록시
// 키(GEMINI_API_KEY)는 Vercel 환경변수에 보관되어 브라우저에 노출되지 않습니다.
const MODEL = "gemini-2.0-flash";

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;

  // 프록시 사용 가능 여부 확인용 (앱 로드 시 1회 호출)
  if (req.method === "GET") {
    res.status(200).json({ ready: !!key });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method Not Allowed" } });
    return;
  }
  if (!key) {
    // 키 미설정 → 프런트가 "키 입력" 화면으로 폴백
    res.status(501).json({ error: { message: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." } });
    return;
  }

  try {
    // req.body는 프런트가 만든 Gemini 요청 본문 그대로 전달됨
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json(data);
      return;
    }
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    res.status(200).json({ text });
  } catch (e) {
    res.status(502).json({ error: { message: "프록시 호출 실패: " + (e?.message || e) } });
  }
}
