/* ============================================================
   js/report.js — 화면 6. 없는 정보 채우기 (제보)
   주인: 제보 담당. 이 파일만 고친다.

   ★ 이 화면이 이 앱의 정체성이다.
     "모르는 것을 지어내지 않는다. 대신 아는 사람이 채울 수 있게 한다."

   ★ 오늘 만드는 것: 폼 → 사진 첨부 안내 → mailto: 로 메일 열기 → 🟠제보됨 배지
     오늘 만들지 않는 것: 검수자 화면, 서버, 로그인.
     → 발표에서는 "검수 화면은 아직 없습니다. 지금은 메일로 받습니다"라고 그대로 말한다.
       만들었다고 거짓말하지 않는다. 그게 이 앱의 주장과 맞다.
   ============================================================ */

(function () {
  var 앱 = window.하모길;

  var 받는메일 = "dohun0513@gmail.com";   // TODO 발표 전에 팀 공용 주소로 바꿔도 된다

  앱.화면.제보 = {
    제목: "아는 정보 알려주기",
    그리기: function (칸) {
      var 빈칸 = 앱.데이터.빈칸 || [];

      칸.innerHTML =
        '<div class="카드">' +
          '<p class="크게" style="font-size:19px">지금 이 앱이 모르는 것</p>' +
          '<p class="작게">지어내지 않고 비워 뒀습니다. 아시는 게 있으면 하나만 알려주셔도 됩니다.</p>' +
          빈칸.map(function (q, i) {
            return '<div style="margin:10px 0">' + 앱.배지("모름", "모름") +
              " " + 앱.esc(q.질문) +
              '<br><span class="작게">확인처: ' + 앱.esc(q.담당) + "</span>" +
              ' <button class="칩" data-질문="' + i + '" style="min-height:36px;font-size:14px">이거 알아요</button></div>';
          }).join("") +
        "</div>" +

        '<div class="카드">' +
          '<label class="이름표">무엇에 대한 정보인가요?</label>' +
          '<input class="줄입력" id="대상" placeholder="예: 진주성 정류장 / 150번 버스">' +

          '<label class="이름표">어떤 내용인가요?</label>' +
          '<textarea class="줄입력" id="내용" placeholder="예: 진주성 정류장에는 계단이 3개 있고 경사로는 없습니다."></textarea>' +

          '<label class="이름표">언제 확인하셨나요?</label>' +
          '<input class="줄입력" id="언제" type="date" value="' + 오늘() + '">' +

          '<label class="이름표">증빙 사진 <span class="작게">(꼭 필요합니다)</span></label>' +
          '<input class="줄입력" id="사진" type="file" accept="image/*" style="padding:12px">' +
          '<p class="작게">사진은 메일 창이 열린 뒤 <b>직접 첨부</b>해 주세요. ' +
            "브라우저가 자동으로 붙일 수 없습니다.</p>" +

          '<button class="큰단추" id="보내기">메일로 보내기</button>' +
        "</div>" +

        '<div class="카드">' +
          '<p class="크게" style="font-size:19px">보내주시면 어떻게 되나요</p>' +
          "<p>" + 앱.배지("제보됨", "제보됨") + " 로 먼저 표시됩니다. 검수 전이라는 뜻입니다.<br>" +
          "사진과 함께 확인되면 " + 앱.배지("확인됨", "확인됨") + " 으로 바뀝니다.</p>" +
          '<p class="작게"><b>제보만으로는 절대 ✅이 되지 않습니다. 🟠에 머뭅니다.</b></p>' +
          "<p>진주시가 함께한다면, 채택된 제보에 " +
          "<b>진주 광역환승 마일리지</b>로 보답하는 방식을 <b>제안합니다</b>. " +
          '<span class="작게">(아직 협의한 바 없습니다)</span></p>' +
        "</div>";

      칸.querySelectorAll("[data-질문]").forEach(function (b) {
        b.onclick = function () {
          var q = 빈칸[+b.getAttribute("data-질문")];
          칸.querySelector("#대상").value = q.질문;
          칸.querySelector("#내용").focus();
        };
      });

      칸.querySelector("#보내기").onclick = function () {
        var 대상 = 칸.querySelector("#대상").value.trim();
        var 내용 = 칸.querySelector("#내용").value.trim();
        var 언제 = 칸.querySelector("#언제").value;
        var 사진 = 칸.querySelector("#사진").files[0];

        if (!대상 || !내용) { alert("무엇에 대한 정보인지와 내용을 적어주세요."); return; }

        var 제목 = "[하모길 제보] " + 대상;
        var 본문 =
          "■ 대상: " + 대상 + "\n" +
          "■ 내용: " + 내용 + "\n" +
          "■ 확인일: " + (언제 || "-") + "\n" +
          "■ 첨부 사진: " + (사진 ? 사진.name + " (직접 첨부해 주세요)" : "없음") + "\n\n" +
          "— 하모길 v" + 앱.버전 + " / 언어 " + 앱.상태.언어 + "\n" +
          "※ 이 제보는 검수 전까지 🟠제보됨 으로만 표시됩니다.";

        location.href = "mailto:" + 받는메일 +
          "?subject=" + encodeURIComponent(제목) +
          "&body=" + encodeURIComponent(본문);
      };
    }
  };

  function 오늘() {
    var d = new Date();
    return d.getFullYear() + "-" +
      ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
})();
