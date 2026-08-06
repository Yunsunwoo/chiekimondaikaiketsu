/* ============================================================
   js/search.js — 화면 1(검색) + 화면 2(내 조건)
   주인: 화면1·2 담당. 이 파일만 고친다.

   지금은 "돌아가는 최소한"만 들어 있다. 여기서부터 살을 붙인다.
   ★ 손대도 되는 곳: 이 파일 전체
   ★ 손대면 안 되는 곳: 다른 js 파일, index.html, css/style.css
   ============================================================ */

(function () {
  var 앱 = window.하모길;

  /* ---------- 화면 1. 검색 ---------- */
  앱.화면.검색 = {
    제목: "하모길",
    그리기: function (칸) {
      var 상 = 앱.상태;
      var 정류장들 = 앱.데이터.정류장.filter(function (s) { return s.도시 === "진주"; });
      if (!정류장들.length) 정류장들 = 앱.데이터.정류장;

      function 목록(선택) {
        return 정류장들.map(function (s) {
          return '<option value="' + 앱.esc(s.id) + '"' + (선택 === s.id ? " selected" : "") + ">" +
            앱.esc(앱.정류장이름(s)) + "</option>";
        }).join("");
      }

      칸.innerHTML =
        '<div class="카드">' +
          '<label class="이름표">' + 앱.esc(앱.말("출발")) + "</label>" +
          '<select class="줄입력" id="출발"><option value="">— 고르세요 —</option>' + 목록(상.출발) + "</select>" +
          '<label class="이름표">' + 앱.esc(앱.말("도착")) + "</label>" +
          '<select class="줄입력" id="도착"><option value="">— 고르세요 —</option>' + 목록(상.도착) + "</select>" +
        "</div>" +

        '<div class="카드">' +
          '<label class="이름표">' + 앱.esc(앱.말("준비하는 데 얼마나 걸리세요?")) + "</label>" +
          '<div class="칩줄" id="여유">' +
            [0, 10, 30, 60].map(function (m) {
              return '<button class="칩' + (+상.여유분 === m ? " 켜짐" : "") + '" data-분="' + m + '">' +
                (m === 0 ? "바로" : m + "분") + "</button>";
            }).join("") +
          "</div>" +
          '<label class="이름표">' + 앱.esc(앱.말("출발할 시각")) + ' <span class="작게">(비우면 지금)</span></label>' +
          '<input class="줄입력" id="시각" type="time" value="' + 앱.esc(상.출발시각) + '">' +
        "</div>" +

        '<div class="카드">' +
          '<label class="이름표">' + 앱.esc(앱.말("내 조건")) + "</label>" +
          '<p class="작게" id="조건요약">' +
            (상.내조건.length ? 앱.esc(상.내조건.map(function (c) { return 앱.말(c); }).join(", "))
                              : "아직 고르지 않았습니다") + "</p>" +
          '<button class="큰단추 보조" data-이동="조건">조건 고르기 →</button>' +
        "</div>" +

        '<button class="큰단추" id="찾기">길찾기</button>' +
        '<p class="작게" style="margin-top:16px">' +
          "모르는 정보는 ❓로 솔직하게 표시합니다. " +
          '<a href="#제보">아는 게 있으면 알려주세요</a>' +
        "</p>";

      칸.querySelector("#출발").onchange = function () { 상.출발 = this.value; 앱.저장(); };
      칸.querySelector("#도착").onchange = function () { 상.도착 = this.value; 앱.저장(); };
      칸.querySelector("#시각").onchange = function () { 상.출발시각 = this.value; 앱.저장(); };
      칸.querySelectorAll("#여유 .칩").forEach(function (b) {
        b.onclick = function () {
          상.여유분 = +b.getAttribute("data-분"); 앱.저장(); 앱.그리기();
        };
      });
      // data-이동 이 붙은 단추는 app.js 가 알아서 잡는다. 따로 달 필요 없다.
      칸.querySelector("#찾기").onclick = function () { 앱.이동("결과"); };
    }
  };

  /* ---------- 화면 2. 내 조건 ---------- */
  var 조건들 = ["휠체어", "유아차", "큰 짐·캐리어", "지팡이·천천히", "한국어가 어려움"];

  앱.화면.조건 = {
    제목: "내 조건",
    그리기: function (칸) {
      var 상 = 앱.상태;
      칸.innerHTML =
        '<p class="흐림">해당하는 것을 모두 골라주세요. 고른 조건에 맞춰 경로를 다르게 보여줍니다.</p>' +
        '<div class="칩줄" id="조건칩" style="flex-direction:column">' +
          조건들.map(function (c) {
            return '<button class="칩' + (상.내조건.indexOf(c) >= 0 ? " 켜짐" : "") +
              '" data-조건="' + 앱.esc(c) + '" style="width:100%;text-align:left">' +
              앱.esc(앱.말(c)) + "</button>";
          }).join("") +
        "</div>" +
        '<button class="큰단추" data-이동="검색">저장하고 돌아가기</button>';

      칸.querySelectorAll("[data-조건]").forEach(function (b) {
        b.onclick = function () {
          var c = b.getAttribute("data-조건");
          var i = 상.내조건.indexOf(c);
          if (i >= 0) 상.내조건.splice(i, 1); else 상.내조건.push(c);
          앱.저장(); 앱.그리기();
        };
      });
    }
  };
})();
