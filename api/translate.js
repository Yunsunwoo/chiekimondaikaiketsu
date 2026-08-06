/* ============================================================
   api/translate.js — 구글(비공식) 번역 서버측 프록시  [Vercel 판]

   왜 필요한가: 브라우저에서 translate.googleapis.com 을 직접 부르면 CORS 로 막힌다.
   같은 도메인의 이 함수가 서버에서 대신 부른다.

   🚨 API 키가 필요 없다. .env 도 없다. 그래서 브라우저에 노출될 키 자체가 없다.

   원본: netlify/functions/translate.js (토익앱에서 2회 검증됨).
   넷리파이 → Vercel 로 옮기면서 바뀐 것:
     1) 함수 껍데기
        넷리파이:  exports.handler = async (event) => ({ statusCode, headers, body })
        Vercel  :  module.exports = async (req, res) => { res.status(...).json(...) }
     2) 부르는 주소
        /.netlify/functions/translate   →   /api/translate
     3) 🔴 응답 모양 — 여기가 중요하다.
        구글 원본은 [[["Hello","안녕",...]],null,"ko"] 같은 **중첩 배열**이라
        js/i18n.js 가 기대하는 j.text 가 없어서 늘 원문이 그대로 나왔다.
        이제 서버가 풀어서 { text:"..." } 로 돌려준다. i18n.js 는 그대로 두면 된다.

   호출: /api/translate?sl=ko&tl=ja&q=<문장>
   로컬(file:// 더블클릭)에서는 동작하지 않는다 — 실패하면 i18n.js 가 원문을 그대로 돌려준다.
   ============================================================ */

/* 구글 응답 [[["번역","원문",...],["번역2","원문2",...]], ...] 에서 번역문만 이어붙인다 */
function 번역문뽑기(원본) {
  try {
    var j = JSON.parse(원본);
    if (!j || !Array.isArray(j) || !Array.isArray(j[0])) return null;
    var 조각 = "";
    for (var i = 0; i < j[0].length; i++) {
      var s = j[0][i];
      if (s && typeof s[0] === "string") 조각 += s[0];
    }
    return 조각 || null;
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  var qp = (req && req.query) || {};
  var q = qp.q || "";
  var sl = qp.sl || "ko";
  var tl = qp.tl || "en";

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!q) {
    res.status(400).json({ error: "missing q" });
    return;
  }
  // 한 문단보다 큰 것은 받지 않는다 — 통째로 보내는 길을 서버에서도 막는다
  if (q.length > 2000) {
    res.status(413).json({ error: "too long" });
    return;
  }
  // 번역할 것이 없으면 그대로 돌려준다 (구글을 부르지 않는다)
  if (sl === tl) {
    res.status(200).json({ text: q });
    return;
  }

  var url = "https://translate.googleapis.com/translate_a/single?client=gtx" +
    "&sl=" + encodeURIComponent(sl) +
    "&tl=" + encodeURIComponent(tl) +
    "&dt=t&q=" + encodeURIComponent(q);

  var ctrl = new AbortController();
  var to = setTimeout(function () { ctrl.abort(); }, 8000);

  try {
    var r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; hamogil/1.0)" }
    });
    clearTimeout(to);
    var 원본 = await r.text();

    if (!r.ok) {
      res.status(502).json({ error: "google " + r.status, text: q });
      return;
    }

    var 번역 = 번역문뽑기(원본);
    res.setHeader("Cache-Control", "public, max-age=86400"); // 같은 문장 24시간 캐시
    // 못 풀었으면 원문을 돌려준다 — 화면이 비는 것보다 낫다
    res.status(200).json({ text: 번역 || q, 확인: 번역 ? "ok" : "parse-fail" });
  } catch (e) {
    clearTimeout(to);
    res.status(502).json({ error: String((e && e.message) || e), text: q });
  }
};
