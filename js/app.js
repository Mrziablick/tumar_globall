(() => {
  "use strict";

  const keys = {
    profile: "tumar-profile",
    applications: "tumar-applications",
    chats: "tumar-chats"
  };

  const events = [
    { id: "masquerade-demo", name: "Masquerade Ball", kind: "КУЛЬТУРА · ДЕМО-СОБЫТИЕ", day: "28", month: "ноя", date: "2026-11-28", time: "16:00–22:00", place: "Астана · площадка уточняется", outfit: "Чёрная база, удобная закрытая обувь", description: "Команда встречи гостей и навигации. Подойдёт новичкам.", minAge: 16, experience: "none", girls: 8, boys: 5 },
    { id: "tynda-demo", name: "Tyndá Music", kind: "МУЗЫКА · ДЕМО-СОБЫТИЕ", day: "05", month: "дек", date: "2026-12-05", time: "14:00–21:00", place: "Астана · детали после подтверждения", outfit: "Тёмная одежда без крупных логотипов", description: "Помощь команде площадки и гостям. Опыт не обязателен.", minAge: 16, experience: "none", girls: 10, boys: 8 },
    { id: "city-demo", name: "City Volunteer Day", kind: "СООБЩЕСТВО · ДЕМО-СОБЫТИЕ", day: "12", month: "дек", date: "2026-12-12", time: "10:00–15:00", place: "Астана · место уточняется", outfit: "Удобная одежда по погоде", description: "Практическая помощь городской инициативе. Нужны внимательные участники.", minAge: 14, experience: "some", girls: 6, boys: 6 }
  ];

  function read(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error(`Не удалось прочитать данные ${key}.`, error);
      return fallback;
    }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function profile() { return read(keys.profile, null); }
  function applications() { return read(keys.applications, []); }
  function chats() { return read(keys.chats, {}); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function eventById(id) { return events.find(event => event.id === id); }
  function humanGender(value) { return value === "girl" ? "Девушка" : value === "boy" ? "Мальчик" : "Не указано"; }
  function experienceLabel(value) { return ({ none: "Без опыта", some: "Есть небольшой опыт", experienced: "Есть опыт" })[value] || "Не указано"; }
  function genderCounts(event) {
    const people = applications().filter(item => item.eventId === event.id && item.status === "approved");
    const girls = people.filter(item => item.gender === "girl").length;
    const boys = people.filter(item => item.gender === "boy").length;
    return { girls, boys, leftGirls: Math.max(0, event.girls - girls), leftBoys: Math.max(0, event.boys - boys) };
  }
  function nav() {
    const active = location.pathname.split("/").pop() || "index.html";
    const links = [["index.html", "Главная"], ["FAQ.html", "О нас"], ["team.html", "Команда"], ["dashboard.html", "События"], ["chat.html", "Чат"]];
    const header = document.querySelector("[data-site-header]");
    if (header) {
      header.innerHTML = `<header class="site-header"><div class="wrap nav-bar"><a class="brand" href="index.html"><img src="assets/tumar-mark.svg" alt=""><span class="brand-name">TUMAR GLOBAL<small>JOIN &amp; VOLUNTEER</small></span></a><button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false">☰</button><nav class="nav-links" aria-label="Основная навигация">${links.map(([href, label]) => `<a href="${href}" ${active === href ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav><a class="nav-join" href="dashboard.html">Присоединиться <span>↗</span></a></div></header>`;
      const toggle = header.querySelector(".menu-toggle");
      const menu = header.querySelector(".nav-links");
      function closeMenu() {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Открыть меню");
      }
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      });
      menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
      });
    }
    const footer = document.querySelector("[data-site-footer]");
    if (footer) footer.innerHTML = `<footer class="site-footer"><div class="wrap footer-inner"><a class="footer-brand" href="index.html"><img src="assets/tumar-mark.svg" alt=""><span><strong>TUMAR GLOBAL</strong><small>JOIN &amp; VOLUNTEER · ASTANA</small></span></a><nav class="footer-links" aria-label="Навигация в подвале"><a href="FAQ.html">О нас</a><a href="team.html">Команда</a><a href="dashboard.html">События</a><a href="admin.html">Координатор</a><a href="https://www.instagram.com/tumar.global/" target="_blank" rel="noreferrer">Instagram ↗</a></nav><div class="footer-bottom"><span>© Tumar Global · демонстрационный сайт</span><span>Создано с теплом <a href="index.html" aria-label="Наверх">✳</a></span></div></div></footer>`;
  }
  function initDashboard() {
    const form = document.querySelector("#profileForm");
    if (!form) return;
    const currentProfile = profile();
    const message = document.querySelector("#profileMessage");
    if (currentProfile) {
      form.elements.name.value = currentProfile.name;
      form.elements.age.value = currentProfile.age;
      form.elements.gender.value = currentProfile.gender || "";
      form.elements.experience.value = currentProfile.experience || "none";
      form.elements.consent.checked = true;
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const previous = profile();
      const saved = {
        id: previous?.id || `TG-${Math.floor(100000 + Math.random() * 900000)}`,
        name: form.elements.name.value.trim(),
        age: Number(form.elements.age.value),
        gender: form.elements.gender.value,
        experience: form.elements.experience.value
      };
      if (!saved.name || saved.age < 14 || saved.age > 99) {
        message.textContent = "Проверь имя и возраст (14–99 лет).";
        return;
      }
      write(keys.profile, saved);
      message.textContent = "Профиль сохранён в этом браузере.";
      renderDashboard();
    });
    renderDashboard();
  }
  function renderDashboard() {
    const user = profile();
    const heading = document.querySelector("#profileHeading");
    const state = document.querySelector("#profileState");
    const qr = document.querySelector("#qrCode");
    const volunteerId = document.querySelector("#volunteerId");
    const eventList = document.querySelector("#eventList");
    if (!eventList) return;
    if (heading) heading.textContent = user ? `Привет, ${user.name}!` : "Знакомимся?";
    if (state) state.textContent = user ? "ПРОФИЛЬ СОЗДАН" : "НЕТ ПРОФИЛЯ";
    if (volunteerId) volunteerId.textContent = user ? user.id : "Появится после регистрации";
    if (qr) {
      qr.replaceChildren();
      if (user && window.QRCode) {
        new QRCode(qr, { text: JSON.stringify({ volunteerId: user.id }), width: 145, height: 145, colorDark: "#171815", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
      } else {
        const label = document.createElement("span");
        label.textContent = user ? "QR-КОД НЕДОСТУПЕН" : "СОЗДАЙ ПРОФИЛЬ";
        qr.append(label);
        if (user) label.title = "Не удалось загрузить библиотеку QR-кодов. Проверь подключение к интернету.";
      }
    }
    const applicationRows = applications().filter(item => item.userId === user?.id);
    eventList.innerHTML = events.map(event => {
      const counts = genderCounts(event);
      const existing = applicationRows.find(item => item.eventId === event.id);
      const ageFits = !user || user.age >= event.minAge;
      const experienceFits = !user || event.experience === "none" || user.experience !== "none";
      const fitText = !user ? `от ${event.minAge} лет · ${event.experience === "none" ? "опыт не нужен" : "желателен опыт"}` : !ageFits ? `Возраст от ${event.minAge} лет` : !experienceFits ? "Нужно немного опыта" : "Подходит по анкете";
      let buttonText = "Подать заявку";
      if (!user) buttonText = "Создай профиль";
      else if (existing) buttonText = existing.status === "pending" ? "Заявка отправлена" : existing.status === "approved" ? "Участие подтверждено" : "Заявка отклонена";
      else if (!ageFits || !experienceFits) buttonText = "Пока не подходит";
      const disabled = !user || Boolean(existing) || !ageFits || !experienceFits;
      return `<article class="event-card"><div class="event-date"><strong>${event.day}</strong><span>${event.month}</span></div><div class="event-details"><span class="eyebrow">${event.kind}</span><h3>${event.name}</h3><p>${event.description}</p><div class="event-slots"><span>Девушки: <b>${counts.leftGirls}/${event.girls}</b></span><span>Мальчики: <b>${counts.leftBoys}/${event.boys}</b></span></div></div><div class="event-action"><button class="button ${existing?.status === "approved" ? "button-outline" : "button-dark"}" type="button" data-apply="${event.id}" ${disabled ? "disabled" : ""}>${buttonText}</button><small>${fitText}</small></div></article>`;
    }).join("");
    eventList.querySelectorAll("[data-apply]").forEach(button => button.addEventListener("click", () => {
      const userNow = profile();
      const eventInfo = eventById(button.dataset.apply);
      if (!userNow || !eventInfo) return;
      const current = applications();
      if (current.some(item => item.eventId === eventInfo.id && item.userId === userNow.id)) return;
      current.push({ id: `APP-${Date.now()}`, userId: userNow.id, eventId: eventInfo.id, name: userNow.name, age: userNow.age, gender: userNow.gender, experience: userNow.experience, status: "pending", appliedAt: new Date().toISOString(), checkedIn: false });
      write(keys.applications, current);
      renderDashboard();
    }));
    const myEvents = document.querySelector("#myEvents");
    if (myEvents) {
      const mine = applications().filter(item => item.userId === user?.id);
      if (!user || !mine.length) myEvents.innerHTML = `<div class="empty-state">${user ? "Заявок пока нет. Выбери событие, которое тебе подходит." : "Создай профиль и подай заявку — тогда здесь появятся твои события."}</div>`;
      else myEvents.innerHTML = mine.map(item => {
        const eventInfo = eventById(item.eventId);
        if (!eventInfo) return "";
        const statuses = { pending: ["На рассмотрении", "status-pending"], approved: ["Участие подтверждено", "status-approved"], rejected: ["Не одобрено", "status-rejected"] };
        const [label, klass] = statuses[item.status] || statuses.pending;
        const details = item.status === "approved" ? `<p class="event-expanded"><span><b>Где:</b> ${escapeHTML(eventInfo.place)}</span><span><b>Когда:</b> ${eventInfo.date} · ${eventInfo.time}</span><span><b>Одежда:</b> ${escapeHTML(eventInfo.outfit)}</span><a class="text-link" href="chat.html?event=${encodeURIComponent(eventInfo.id)}">Чат команды ↗</a></p>` : "";
        return `<article class="event-card"><div class="event-date"><strong>${eventInfo.day}</strong><span>${eventInfo.month}</span></div><div class="event-details"><span class="status-badge ${klass}">${label}</span><h3>${eventInfo.name}</h3><p>${eventInfo.description}</p>${details}</div><div></div></article>`;
      }).join("");
    }
    const chatCount = document.querySelector(".chat-side-card p");
    if (chatCount) chatCount.textContent = applications().some(item => item.userId === user?.id && item.status === "approved") ? "Есть подтверждённое участие — переходи в чат своей команды." : "Появится после того, как организаторы подтвердят участие.";
  }
  function initChat() {
    const roomContainer = document.querySelector("#chatRooms");
    const form = document.querySelector("#chatForm");
    if (!roomContainer || !form) return;
    const user = profile();
    const approved = applications().filter(item => item.userId === user?.id && item.status === "approved").map(item => eventById(item.eventId)).filter(Boolean);
    const selected = new URLSearchParams(location.search).get("event");
    let activeId = approved.some(event => event.id === selected) ? selected : approved[0]?.id;
    roomContainer.innerHTML = approved.map(event => `<button class="room-button ${event.id === activeId ? "active" : ""}" type="button" data-room="${event.id}"><span class="room-icon">✳</span><span><b>${event.name}</b><small>Основная команда · участники</small></span></button>`).join("") || `<div class="empty-state">Здесь появятся чаты событий, в которых подтвердили твоё участие.</div>`;
    const input = form.elements.message;
    const send = form.querySelector("button");
    function renderMessages() {
      const eventInfo = eventById(activeId);
      const head = document.querySelector("#chatHead");
      const messages = document.querySelector("#chatMessages");
      if (!eventInfo) {
        head.querySelector("h2").textContent = "Чат команды";
        head.querySelector("div:nth-child(2) span").textContent = "Выбери подтверждённое событие";
        input.disabled = true;
        send.disabled = true;
        return;
      }
      head.querySelector("h2").textContent = eventInfo.name;
      head.querySelector("div:nth-child(2) span").textContent = "Основная команда и подтверждённые участники";
      input.disabled = false;
      input.placeholder = "Напиши команде…";
      send.disabled = false;
      const saved = chats()[activeId] || [];
      messages.innerHTML = saved.length ? saved.map(message => `<article class="message ${message.userId === user.id ? "mine" : ""}"><b>${escapeHTML(message.name)}</b><p>${escapeHTML(message.text)}</p><time>${new Date(message.sentAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</time></article>`).join("") : `<div class="chat-empty"><span>✳</span><h3>${eventInfo.name}</h3><p>Команда события будет здесь. Основной состав Tumar Global всегда с вами.</p></div>`;
      messages.scrollTop = messages.scrollHeight;
    }
    roomContainer.querySelectorAll("[data-room]").forEach(button => button.addEventListener("click", () => {
      activeId = button.dataset.room;
      roomContainer.querySelectorAll("[data-room]").forEach(room => room.classList.toggle("active", room === button));
      renderMessages();
    }));
    form.addEventListener("submit", event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!activeId || !text || !user) return;
      const allChats = chats();
      allChats[activeId] = [...(allChats[activeId] || []), { userId: user.id, name: user.name, text, sentAt: new Date().toISOString() }];
      write(keys.chats, allChats);
      input.value = "";
      renderMessages();
    });
    renderMessages();
  }
  function initMotion() {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const revealTargets = document.querySelectorAll("main > section:not(.hero), .inner-page > .page-hero, .inner-page > .about-grid, .inner-page > .faq-section, .inner-page > .team-section, .dashboard-grid, .chat-layout, .admin-stats, .admin-grid, .project-card, .team-card, .event-card");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    revealTargets.forEach((element, index) => {
      element.classList.add("reveal");
      if (element.matches(".project-card, .team-card, .event-card")) element.style.transitionDelay = `${(index % 4) * 70}ms`;
      observer.observe(element);
    });
  }

  window.Tumar = { events, readProfile: profile, readApplications: applications, writeApplications: value => write(keys.applications, value), eventById, genderCounts, escapeHTML };
  nav();
  initDashboard();
  initChat();
  initMotion();
})();
