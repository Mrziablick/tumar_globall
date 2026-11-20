(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const data = window.Tumar;
    if (!data) return;
    const applicationsList = document.querySelector("#applicationsList");
    const rosterList = document.querySelector("#rosterList");
    const stats = document.querySelector("#adminStats");
    const scanSelect = document.querySelector("#scanEvent");
    const result = document.querySelector("#scanResult");
    const form = document.querySelector("#scanForm");
    const video = document.querySelector("#scannerVideo");
    const startButton = document.querySelector("#startScan");
    const stopButton = document.querySelector("#stopScan");
    let stream;
    let scannerActive = false;

    scanSelect.innerHTML = data.events.map(event => `<option value="${event.id}">${data.escapeHTML(event.name)}</option>`).join("");
    function render() {
      const applications = data.readApplications();
      const pending = applications.filter(item => item.status === "pending");
      const approved = applications.filter(item => item.status === "approved");
      const checkedIn = approved.filter(item => item.checkedIn);
      stats.innerHTML = `<div class="admin-stat"><strong>${pending.length}</strong><span>ЗАЯВОК НА РАССМОТРЕНИИ</span></div><div class="admin-stat"><strong>${approved.length}</strong><span>ПОДТВЕРЖДЁННЫХ УЧАСТНИКОВ</span></div><div class="admin-stat"><strong>${checkedIn.length}</strong><span>ОТМЕЧЕНО ПО QR</span></div>`;
      applicationsList.innerHTML = pending.length ? pending.map(item => {
        const event = data.eventById(item.eventId);
        return `<article class="application-row"><div><h3>${data.escapeHTML(item.name)} · ${item.age}</h3><p>${event ? data.escapeHTML(event.name) : "Событие"} · ${item.gender === "girl" ? "девушка" : item.gender === "boy" ? "мальчик" : "пол не указан"} · ${item.experience === "none" ? "без опыта" : "есть опыт"}</p></div><div class="application-actions"><button class="button button-dark" type="button" data-action="approve" data-id="${item.id}">Подтвердить</button><button class="button button-outline" type="button" data-action="reject" data-id="${item.id}">Отклонить</button></div></article>`;
      }).join("") : `<div class="empty-state">Новых заявок пока нет. Заявки появятся, когда волонтёры отправят анкету в кабинете на этом устройстве.</div>`;
      rosterList.innerHTML = data.events.map(event => {
        const approvedForEvent = applications.filter(item => item.eventId === event.id && item.status === "approved");
        const girls = approvedForEvent.filter(item => item.gender === "girl").length;
        const boys = approvedForEvent.filter(item => item.gender === "boy").length;
        const names = approvedForEvent.length ? approvedForEvent.map(item => `${data.escapeHTML(item.name)} (${item.gender === "girl" ? "девушка" : item.gender === "boy" ? "мальчик" : "пол не указан"}${item.checkedIn ? ", пришёл(ла)" : ""})`).join(", ") : "Пока нет подтверждённых участников.";
        return `<article class="roster-event"><h3>${data.escapeHTML(event.name)} <span class="status-badge status-approved">${approvedForEvent.length} в команде</span></h3><p>Девушки: ${girls}/${event.girls} · мальчики: ${boys}/${event.boys}<br>Основная команда Tumar Global участвует в каждом событии.<br>${names}</p></article>`;
      }).join("");
      applicationsList.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
        const updated = data.readApplications();
        const item = updated.find(application => application.id === button.dataset.id);
        if (!item || item.status !== "pending") return;
        if (button.dataset.action === "approve") {
          const event = data.eventById(item.eventId);
          const counts = event && data.genderCounts(event);
          if (!event || ((item.gender === "girl" && !counts.leftGirls) || (item.gender === "boy" && !counts.leftBoys))) {
            result.textContent = `В команде ${event?.name || "этого события"} больше нет мест этой категории.`;
            return;
          }
          item.status = "approved";
        } else {
          item.status = "rejected";
        }
        data.writeApplications(updated);
        result.textContent = "";
        render();
      }));
    }

    function participantId(raw) {
      const text = raw.trim();
      try {
        const payload = JSON.parse(text);
        return typeof payload.volunteerId === "string" ? payload.volunteerId : text;
      } catch {
        return text;
      }
    }
    function checkIn(raw) {
      const id = participantId(raw);
      const eventId = scanSelect.value;
      const applications = data.readApplications();
      const match = applications.find(item => item.userId === id && item.eventId === eventId && item.status === "approved");
      if (!match) {
        result.textContent = "Нет подтверждённой заявки с этим ID на выбранное событие.";
        return;
      }
      if (match.checkedIn) {
        result.textContent = `${match.name} уже отмечен(а) на событие.`;
        return;
      }
      match.checkedIn = true;
      data.writeApplications(applications);
      result.textContent = `${match.name} — отметка о присутствии сохранена.`;
      render();
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      checkIn(form.elements.id.value);
    });

    async function stopCamera() {
      scannerActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = undefined;
      }
      video.pause();
      video.srcObject = null;
      video.classList.remove("active");
      startButton.disabled = false;
      stopButton.disabled = true;
    }
    stopButton.addEventListener("click", stopCamera);
    startButton.addEventListener("click", async () => {
      if (!("BarcodeDetector" in window)) {
        result.textContent = "В этом браузере нет встроенного QR-сканера. Используй поле для ручного ввода ID.";
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        result.textContent = "Камера недоступна в этой среде. Используй ручной ввод ID.";
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = stream;
        await video.play();
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        scannerActive = true;
        video.classList.add("active");
        startButton.disabled = true;
        stopButton.disabled = false;
        result.textContent = "Наведи камеру на QR-код участника.";
        const scanFrame = async () => {
          if (!scannerActive) return;
          try {
            const codes = await detector.detect(video);
            if (codes.length) {
              await stopCamera();
              checkIn(codes[0].rawValue);
              return;
            }
          } catch (error) {
            console.error("Ошибка чтения QR-кода.", error);
            result.textContent = "Не удалось прочитать QR-код. Проверь камеру или введи ID вручную.";
            await stopCamera();
            return;
          }
          requestAnimationFrame(scanFrame);
        };
        requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error("Не удалось запустить камеру.", error);
        result.textContent = "Камера не запущена. Проверь разрешение браузера или введи ID вручную.";
        await stopCamera();
      }
    });
    window.addEventListener("pagehide", stopCamera);
    render();
  });
})();
