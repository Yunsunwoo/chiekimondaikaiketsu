/* ============================================================
   js/app.js — 뼈대. 화면 전환 + 저장 + 공용 도구.
   주인: 선우(팀장). 다른 사람은 이 파일을 고치지 않는다.
   규칙은 ../약속.md
   ============================================================ */

window.하모길 = {
  버전: "0.1",

  /* ---- 데이터 (js/data.js 가 채운다) ---- */
  데이터: { 정류장: [], 노선: [], 경로: [] },

  /* ---- 지금 상태 (자동 저장된다) ---- */
  상태: {
    언어: "ko",            // ko | ja | en
    내조건: [],            // "휠체어" "유아차" "짐" "천천히" "한국어어려움"
    출발: "", 도착: "",
    출발시각: "",          // "14:30" 빈 값이면 지금
    여유분: 10,            // 준비하는 데 걸리는 분
    정렬: "빠른순",        // 빠른순 | 확실한순
    고른경로: null,        // 화면4·5가 쓴다 (경로 객체)
    화면: "검색"
  },

  /* ---- 화면 (각자 자기 파일에서 채운다) ----
     하모길.화면.결과 = { 제목:"경로", 그리기(칸){ 칸.innerHTML = "..." } };
     칸 = <main id="칸"> DOM 요소. innerHTML 을 통째로 덮어써도 된다.        */
  화면: {},

  /* ---- 확신도 4단계 ---- */
  확신도표: {
    확인됨: { 아이콘: "✅", 등급: 0, 설명: "직접 보거나 공식 자료로 확인했다" },
    추정:   { 아이콘: "⚠️", 등급: 1, 설명: "비슷한 사례로 미루어 짐작했다" },
    제보됨: { 아이콘: "🟠", 등급: 2, 설명: "사용자가 알려줬다. 아직 검수 전" },
    모름:   { 아이콘: "❓", 등급: 3, 설명: "아직 아무도 모른다" }
  }
};

(function () {
  var 앱 = window.하모길;
  var 저장키 = "하모길_v1";

  /* ---------- 공용 도구 ---------- */

  // HTML 안에 문자열을 넣을 때 반드시 통과시킨다 (제보 내용에 <script> 가 올 수 있다)
  앱.esc = function (s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  // 확신도 배지 한 개 -> HTML 문자열
  앱.배지 = function (확신도, 글자) {
    var 표 = 앱.확신도표[확신도] || 앱.확신도표.모름;
    var 이름 = 앱.확신도표[확신도] ? 확신도 : "모름";
    return '<span class="배지 배지-' + 이름 + '" title="' + 앱.esc(표.설명) + '">' +
      표.아이콘 + " " + 앱.esc(글자 === undefined ? 이름 : 글자) + "</span>";
  };

  // 여러 확신도 중 가장 낮은(=나쁜) 것을 돌려준다. 경로 전체의 확신도.
  앱.가장낮은확신도 = function (목록) {
    var 최악 = "확인됨";
    (목록 || []).forEach(function (v) {
      var a = (앱.확신도표[v] || 앱.확신도표.모름).등급;
      var b = 앱.확신도표[최악].등급;
      if (a > b) 최악 = 앱.확신도표[v] ? v : "모름";
    });
    return 최악;
  };

  // 정류장 / 노선 찾기
  앱.정류장 = function (id) {
    return 앱.데이터.정류장.filter(function (s) { return s.id === id; })[0] || null;
  };
  앱.노선 = function (번호) {
    return 앱.데이터.노선.filter(function (r) { return r.번호 === 번호; })[0] || null;
  };

  // 지금 언어에 맞는 정류장 이름
  앱.정류장이름 = function (정류장) {
    if (!정류장) return "";
    var l = 앱.상태.언어;
    return (l === "ja" && 정류장.이름_ja) || (l === "en" && 정류장.이름_en) || 정류장.이름;
  };

  // "14:30" 같은 시각 문자열 -> 분. 없으면 지금 시각.
  앱.기준분 = function () {
    var t = 앱.상태.출발시각;
    if (t && /^\d{1,2}:\d{2}$/.test(t)) {
      var p = t.split(":");
      return (+p[0]) * 60 + (+p[1]);
    }
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes() + (+앱.상태.여유분 || 0);
  };
  앱.분을시각 = function (분) {
    분 = ((분 % 1440) + 1440) % 1440;
    var h = Math.floor(분 / 60), m = 분 % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  };

  /* ---------- 저장 / 불러오기 ---------- */

  앱.저장 = function () {
    try { localStorage.setItem(저장키, JSON.stringify(앱.상태)); } catch (e) { }
  };
  앱.불러오기 = function () {
    try {
      var raw = localStorage.getItem(저장키);
      if (!raw) return;
      var o = JSON.parse(raw);
      Object.keys(o).forEach(function (k) {
        if (k in 앱.상태) 앱.상태[k] = o[k];
      });
    } catch (e) { }
  };
  앱.초기화 = function () {
    try { localStorage.removeItem(저장키); } catch (e) { }
    location.hash = "#검색"; location.reload();
  };

  /* ---------- 화면 전환 ---------- */

  var 순서 = ["검색", "조건", "결과", "안내", "카드", "제보"];

  앱.이동 = function (이름) {
    if (순서.indexOf(이름) < 0) 이름 = "검색";
    앱.상태.화면 = 이름;
    앱.저장();
    // 주소창의 # 을 맞춘다. hashchange 는 늦게 오므로 기다리지 않고 바로 그린다.
    if (location.hash !== "#" + 이름) {
      try { location.hash = "#" + 이름; } catch (e) { }
    }
    앱.그리기();
  };

  앱.그리기 = function () {
    var 칸 = document.getElementById("칸");
    var 이름 = 앱.상태.화면;
    var 화면 = 앱.화면[이름];

    // 헤더
    var 제목칸 = document.getElementById("제목");
    if (제목칸) 제목칸.textContent = (화면 && 화면.제목) || 이름;
    var 뒤로 = document.getElementById("뒤로");
    if (뒤로) 뒤로.style.visibility = (이름 === "검색") ? "hidden" : "visible";

    // 본문
    칸.innerHTML = "";
    if (!화면 || typeof 화면.그리기 !== "function") {
      칸.innerHTML =
        '<div class="아직">' +
        "<h2>" + 앱.esc(이름) + " 화면은 아직 비어 있습니다</h2>" +
        "<p>담당자가 <code>js/" + 앱.esc(파일이름(이름)) + "</code> 안에서<br>" +
        "<code>하모길.화면." + 앱.esc(이름) + " = { 제목:\"…\", 그리기(칸){ … } }</code> 를 채우면 여기에 나옵니다.</p>" +
        "<p class='작게'>약속.md 를 먼저 읽으세요.</p></div>";
      return;
    }
    try {
      화면.그리기(칸);
    } catch (e) {
      칸.innerHTML = '<div class="아직 오류"><h2>이 화면에서 오류가 났습니다</h2><pre>' +
        앱.esc(e && e.message) + "</pre><p class='작게'>담당자에게 이 문장을 그대로 보여주세요.</p></div>";
      console.error(e);
    }
    try { window.scrollTo(0, 0); } catch (e) { }
  };

  function 파일이름(화면) {
    return { 검색: "search.js", 조건: "search.js", 결과: "result.js",
             안내: "detail.js", 카드: "detail.js", 제보: "report.js" }[화면] || "app.js";
  }

  /* ---------- 언어 ---------- */

  앱.언어바꾸기 = function (코드) {
    앱.상태.언어 = 코드; 앱.저장();
    document.querySelectorAll("[data-언어]").forEach(function (b) {
      b.classList.toggle("켜짐", b.getAttribute("data-언어") === 코드);
    });
    앱.그리기();
  };

  /* ---------- 시작 ---------- */

  function 시작() {
    앱.불러오기();

    var 뒤로 = document.getElementById("뒤로");
    if (뒤로) 뒤로.onclick = function () { history.back(); };

    // data-이동 / data-언어 는 문서 전체에서 한 번만 잡는다.
    // → 화면 파일에서 만든 단추도 그냥 동작한다. 각자 onclick 을 달 필요가 없다.
    document.addEventListener("click", function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.getAttribute) {
          var 이동 = t.getAttribute("data-이동");
          if (이동) { e.preventDefault(); 앱.이동(이동); return; }
          var 언어 = t.getAttribute("data-언어");
          if (언어) { e.preventDefault(); 앱.언어바꾸기(언어); return; }
        }
        t = t.parentNode;
      }
    });

    window.addEventListener("hashchange", function () {
      var 이름 = decodeURIComponent(location.hash.replace("#", "")) || "검색";
      if (순서.indexOf(이름) < 0) 이름 = "검색";
      if (이름 === 앱.상태.화면) return;   // 이미 그린 화면이면 다시 그리지 않는다
      앱.상태.화면 = 이름;
      앱.저장(); 앱.그리기();
    });

    var 처음 = decodeURIComponent(location.hash.replace("#", ""));
    앱.이동(처음 || 앱.상태.화면 || "검색");
    앱.언어바꾸기(앱.상태.언어);
  }

  앱.시작 = 시작;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", 시작);
  else 시작();
})();
