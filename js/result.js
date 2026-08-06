/* ============================================================
   js/result.js — 화면 3. 경로 결과.  ★ 이 앱의 심장. 발표의 30초.
   주인: 화면3 담당. 이 파일만 고친다.

   여기서 보여줘야 하는 것 세 가지:
     1) 막힐 수 있는 곳 배지  — "계단 3개" "저상버스 아님" "호출 필요" "도보 250m"
     2) 확신도 배지          — ✅확인됨 ⚠️추정 🟠제보됨 ❓모름
     3) 정렬 토글            — [빠른 순] ↔ [확실한 순]   ← 다른 앱에 없는 것

   ★ 발표 대사: "빠른 순으로 보면 1001번입니다. 확실한 순으로 바꾸면 181번입니다.
                 2분 차이인데, 한 대는 계단이 있고 한 대는 없습니다."
   ============================================================ */

(function () {
  var 앱 = window.하모길;

  앱.화면.결과 = {
    제목: "경로",
    그리기: function (칸) {
      var 상 = 앱.상태;

      /* --- 어떤 경로를 보여줄지 고른다 --- */
      var 후보 = 앱.데이터.경로.filter(function (r) {
        if (!상.출발 && !상.도착) return r.시나리오 === "부산재현";   // 아무것도 안 고르면 부산 재현
        return r.출발_id === 상.출발 && r.도착_id === 상.도착;
      });
      if (!후보.length) 후보 = 앱.데이터.경로.filter(function (r) { return r.시나리오 === "부산재현"; });

      /* --- 정렬 --- */
      후보 = 후보.slice().sort(function (a, b) {
        if (상.정렬 === "확실한순") {
          var 차 = 등급(a) - 등급(b);
          if (차 !== 0) return 차;
          var 막 = (a.막힘 || []).length - (b.막힘 || []).length;
          if (막 !== 0) return 막;
        }
        return (a.총분 === null ? 9999 : a.총분) - (b.총분 === null ? 9999 : b.총분);
      });

      function 등급(r) {
        var c = 앱.경로확신도(r);
        var 벌점 = 막힘벌점(r);
        return 앱.확신도표[c].등급 * 10 + 벌점;
      }
      // 내 조건에 걸리는 막힘은 더 무겁게 센다
      function 막힘벌점(r) {
        var 점 = 0;
        (r.막힘 || []).forEach(function (m) {
          점 += 1;
          if (상.내조건.indexOf("휠체어") >= 0 && /저상|계단/.test(m)) 점 += 5;
          if (상.내조건.indexOf("유아차") >= 0 && /저상|계단/.test(m)) 점 += 4;
          if (상.내조건.indexOf("큰 짐·캐리어") >= 0 && /계단/.test(m)) 점 += 3;
          if (상.내조건.indexOf("지팡이·천천히") >= 0 && /계단|도보/.test(m)) 점 += 3;
          if (상.내조건.indexOf("한국어가 어려움") >= 0 && /이름 다름|호출/.test(m)) 점 += 3;
        });
        return 점;
      }

      /* --- 그린다 --- */
      var html =
        '<div class="칩줄" id="정렬" style="margin-bottom:14px">' +
          ["빠른순", "확실한순"].map(function (k) {
            return '<button class="칩' + (상.정렬 === k ? " 켜짐" : "") + '" data-정렬="' + k + '">' +
              앱.esc(앱.말(k === "빠른순" ? "빠른 순" : "확실한 순")) + "</button>";
          }).join("") +
        "</div>";

      if (상.내조건.length) {
        html += '<p class="작게">내 조건: ' +
          앱.esc(상.내조건.map(function (c) { return 앱.말(c); }).join(", ")) + "</p>";
      }

      if (!후보.length) {
        html += '<div class="아직"><h2>경로를 찾지 못했습니다</h2>' +
          "<p>아직 이 구간 데이터가 없습니다. " +
          '<a href="#제보">알고 계시면 알려주세요</a></p></div>';
      }

      후보.forEach(function (r) {
        var 확 = 앱.경로확신도(r);
        html += '<div class="카드" data-경로="' + 앱.esc(r.id) + '">' +
          '<div class="크게">' + 앱.esc(r.이름 || r.id) + "</div>" +
          '<div style="margin:6px 0">' +
            (r.총분 === null
              ? '<span class="배지 배지-모름">❓ 소요시간 모름</span>'
              : '<span class="크게">' + r.총분 +앱.esc(앱.말("분")) + "</span>") +
            (대기분(r) !== null ? ' <span class="흐림">· ' + 대기분(r) + 앱.esc(앱.말("분 뒤")) + " 출발</span>" : "") +
          "</div>" +
          '<div>' + (r.막힘 || []).map(function (m) {
            return '<span class="막힘">' + 앱.esc(앱.말(m)) + "</span>";
          }).join("") + "</div>" +
          '<div>' + 앱.배지(확, 앱.말(확)) + "</div>" +
          (r.비고 ? '<p class="작게">' + 앱.esc(r.비고) + "</p>" : "") +
          '<button class="큰단추 보조" data-고름="' + 앱.esc(r.id) + '">이 경로로 →</button>' +
        "</div>";
      });

      html += '<p class="작게" style="margin-top:18px">' +
        "❓는 아직 아무도 모르는 정보입니다. 지어내지 않습니다. " +
        '<a href="#제보">아는 게 있으면 알려주세요</a></p>';

      칸.innerHTML = html;

      칸.querySelectorAll("[data-정렬]").forEach(function (b) {
        b.onclick = function () { 상.정렬 = b.getAttribute("data-정렬"); 앱.저장(); 앱.그리기(); };
      });
      칸.querySelectorAll("[data-고름]").forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute("data-고름");
          상.고른경로 = 앱.데이터.경로.filter(function (r) { return r.id === id; })[0] || null;
          앱.저장(); 앱.이동("안내");
        };
      });

      function 대기분(r) {
        var s = (r.단계 || []).filter(function (x) { return x.종류 === "버스"; })[0];
        return s && typeof s.대기분 === "number" ? s.대기분 : null;
      }
    }
  };
})();
