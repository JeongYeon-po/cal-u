document.addEventListener("DOMContentLoaded", () => {
  // 요소 캐시
  const calThis   = document.getElementById("calendar");
  const calNext   = document.getElementById("calendarNext");
  const yM        = document.getElementById("yearMonth");
  const yMNext    = document.getElementById("yearMonthNext");
  const prevBtn   = document.getElementById("prevMonth");
  const nextBtn   = document.getElementById("nextMonth");
  const toggleBtn = document.getElementById("toggleNextMonthBtn");
  const resetBtn  = document.getElementById("resetBtn");
  const submitBtn = document.getElementById("submitBtn");
  const tbl       = document.getElementById("resultTable");
  const noChk     = document.getElementById("noPreference");

  // 오늘 날짜 초기화
  const today = new Date(); today.setHours(0,0,0,0);
  let current = new Date(today.getFullYear(), today.getMonth(), 1);

  // 2025년 공휴일
  const holidays = new Set([
    "2025-01-01","2025-03-01","2025-05-05","2025-05-06",
    "2025-06-06","2025-08-15","2025-10-03","2025-10-05",
    "2025-10-06","2025-10-07","2025-10-08","2025-10-09",
    "2025-12-25"
  ]);

  // 달력 렌더링
  function renderCal(date, container, labelEl) {
    container.innerHTML = "";
    const Y = date.getFullYear(), M = date.getMonth();
    labelEl.textContent = `${Y}년 ${M+1}월`;

    const firstDay = new Date(Y, M, 1).getDay();
    const lastDate = new Date(Y, M+1, 0).getDate();
    const prevLast = new Date(Y, M, 0).getDate();

    // 전월 말일 채우기
    for (let i = firstDay; i > 0; i--) {
      const d = document.createElement("div");
      d.className = "date past";
      d.textContent = prevLast - i + 1;
      container.appendChild(d);
    }

    // 이번 달
    for (let d = 1; d <= lastDate; d++) {
      const cell = document.createElement("div");
      cell.className = "date";
      cell.textContent = d;
      const dt = new Date(Y, M, d); dt.setHours(0,0,0,0);
      const ds = `${Y}-${String(M+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cell.dataset.date = ds;

      if (dt.getTime() === today.getTime()) cell.classList.add("today");
      if (dt < today) cell.classList.add("past");

      const wd = dt.getDay();
      if (wd === 0 || holidays.has(ds)) cell.style.color = "red";
      else if (wd === 6) cell.style.color = "blue";

      if (!cell.classList.contains("past")) {
        cell.addEventListener("click", () => {
          if (cell.classList.contains("preferred")) {
            cell.classList.replace("preferred","unavailable");
          } else if (cell.classList.contains("unavailable")) {
            cell.classList.remove("unavailable");
          } else {
            cell.classList.add("preferred");
          }
        });
      }
      container.appendChild(cell);
    }

    // 다음달 빈칸 채우기
    const total = container.children.length;
    const slots = (total > 35 ? 42 : 35) - total;
    for (let i = 1; i <= slots; i++) {
      const d = document.createElement("div");
      d.className = "date past";
      d.textContent = i;
      container.appendChild(d);
    }
  }

  function renderAll() {
    renderCal(current, calThis, yM);
    const nxt = new Date(current.getFullYear(), current.getMonth()+1, 1);
    renderCal(nxt, calNext, yMNext);
  }

  // 네비게이션 버튼
  prevBtn.onclick   = () => { current.setMonth(current.getMonth()-1); renderAll(); };
  nextBtn.onclick   = () => { current.setMonth(current.getMonth()+1); renderAll(); };
  toggleBtn.onclick = () => {
    const nc = document.getElementById("nextMonthContainer");
    const show = nc.style.display === "none";
    nc.style.display = show ? "block" : "none";
    toggleBtn.textContent = show ? "다음달 접기" : "다음달 보기";
  };
  resetBtn.onclick  = () => {
    if (!confirm("달력, 제출결과가 리셋됩니다")) return;
    document.querySelectorAll(".date.preferred, .date.unavailable")
      .forEach(el => el.classList.remove("preferred","unavailable"));
    const tb = tbl.tBodies[0];
    if (tb) tb.innerHTML = "";
    noChk.checked = false;
  };

  // 월명 볼드+줄바꿈 포맷 함수
  function fmt(mon, arr) {
    return arr.length 
      ? `<strong>${mon}월</strong> ${arr.join(",")}일`
      : "";
  }

  // 결과 제출
  submitBtn.onclick = () => {
    const name = document.getElementById("userName").value.trim();
    if (!name) { alert("이름을 입력해주세요."); return; }
    const noP = noChk.checked;
    const old = tbl.querySelector(`tr[data-user="${name}"]`);
    if (old) old.remove();

    const hasNext = !!calNext.querySelector(".preferred, .unavailable");
    const wantCur = [], canCur = [], wantNext = [], canNext = [];

    // 7월
    document.querySelectorAll("#calendar .date:not(.past)").forEach(c => {
      const day = String(+c.dataset.date.slice(8));
      if (c.classList.contains("preferred")) wantCur.push(day);
      else if (!c.classList.contains("unavailable")) canCur.push(day);
    });
    // 8월
    if (hasNext) {
      document.querySelectorAll("#calendarNext .date:not(.past)").forEach(c => {
        const day = String(+c.dataset.date.slice(8));
        if (c.classList.contains("preferred")) wantNext.push(day);
        else if (!c.classList.contains("unavailable")) canNext.push(day);
      });
    }

    const curM = current.getMonth()+1;
    const nxtM = current.getMonth()+2;

    // 줄바꿈 처리
    const wantParts = noP
      ? ["모든 날짜 가능"]
      : [fmt(curM, wantCur), fmt(nxtM, wantNext)].filter(Boolean);
    const canParts  = noP
      ? ["-"]
      : [fmt(curM, canCur),  fmt(nxtM, canNext) ].filter(Boolean);

    const row = tbl.tBodies[0].insertRow();
    row.dataset.user = name;
    const c1 = row.insertCell(), c2 = row.insertCell(), c3 = row.insertCell();
    c1.textContent = name;
    c1.style.color = document.getElementById("userColor").value;
    c2.innerHTML = wantParts.join("<br>");
    c3.innerHTML = canParts.join("<br>");
    noChk.checked = false;
  };

  // 초기 렌더 & 헤더
  renderAll();
  if (!tbl.tHead || tbl.tHead.rows.length === 0) {
    const thead = tbl.createTHead();
    const hr = thead.insertRow();
    ["이름","원하는 날 ✅","가능한 날 👍"].forEach(txt => {
      const th = document.createElement("th");
      th.textContent = txt;
      hr.appendChild(th);
    });
  }
  if (!tbl.tBodies.length) tbl.createTBody();
});
