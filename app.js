(() => {
  const APP_VERSION = "3.16";
  const ROUND_SECONDS = 40;
  const LETTERS = ["A", "B", "C", "D"];
  const HOST_ACCESS_KEY = "Chango2026";
  const FONOTIPIA_URL = "https://carlosguariglia.github.io/fonotipia/";

  // Detectar si es vista Proyector (?host=true)
  const params = new URLSearchParams(window.location.search);
  const isHostRequest = params.get("host") === "true";
  const savedHostAccess = sessionStorage.getItem("changopilot_host_access");
  let isHost = isHostRequest && savedHostAccess === HOST_ACCESS_KEY;

  if (isHost) {
    sessionStorage.setItem("changopilot_host_access", HOST_ACCESS_KEY);
  }

  // Estado global de la sesión
  const state = {
    sbUrl: localStorage.getItem("sb_url") || "https://hehaakhdmpdktsywywbb.supabase.co",
    sbKey: localStorage.getItem("sb_key") || "sb_publishable_c0MtbIOA-3s_ky2L8AEPcQ_Gsfd2iv2",
    supabase: null,
    channel: null,
    offlineMode: false,
    phase: "LOBBY", // LOBBY | QUESTION | REVEAL | PODIUM
    roundIndex: 0,
    isPractice: false,
    timeLeft: ROUND_SECONDS,
    timerId: null,
    players: {}, // { [id]: { id, alias, year, score } }
    votes: {},   // { [playerId]: { optionIndex, timeLeft } }
    kickedIds: new Set(),
    me: null     // { id, alias, year, score, votedOption, confirmedByHost }
  };

  const $ = (id) => document.getElementById(id);
  $("app-version").textContent = `Version: ${APP_VERSION}`;

  // ==================== TEMA LIGHT / DARK ====================
  const btnTheme = $("btn-theme");
  const prismLink = $("prism-theme");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);
    if (theme === "dark") {
      btnTheme.textContent = "☀️ Claro";
      prismLink.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
    } else {
      btnTheme.textContent = "🌙 Oscuro";
      prismLink.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css";
    }
  }

  setTheme(localStorage.getItem("app_theme") || "light");
  btnTheme.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "dark" : "light");
  });

  // ==================== NAVEGACIÓN DE VISTAS ====================
  function showView(viewId) {
    document.querySelectorAll(".view").forEach((el) => el.classList.add("hidden"));
    $(viewId).classList.remove("hidden");
  }

  function updateConnBadge(status, text) {
    const badge = $("conn-badge");
    badge.className = `badge-live ${status}`;
    badge.textContent = text;
  }

  // ==================== CONEXIÓN SUPABASE REALTIME ====================
  function initSupabase() {
    if (!state.sbUrl || !state.sbKey || !window.supabase) {
      state.offlineMode = true;
      updateConnBadge("offline", "● Modo Offline (Local)");
      if (isHost) {
        $("btn-offline-toggle").classList.remove("hidden");
        $("btn-offline-toggle").textContent = "📡 Modo Offline";
      }
      return;
    }

    try {
      state.supabase = window.supabase.createClient(state.sbUrl, state.sbKey);
      state.channel = state.supabase.channel("changopilot-room", {
        config: { broadcast: { self: true, ack: true } }
      });

      state.channel
        .on("broadcast", { event: "player_join" }, ({ payload }) => {
          console.log("[Changopilot] player_join recibido:", payload);
          if (!isHost || !payload || state.kickedIds.has(payload.id)) return;
          const duplicateAlias = Object.values(state.players).some(
            (player) =>
              player.id !== payload.id &&
              aliasKey(player.alias) === aliasKey(payload.alias)
          );
          if (duplicateAlias) {
            sendBroadcast("join_rejected", {
              playerId: payload.id,
              reason: "Ese alias ya está siendo utilizado en la sala."
            });
            return;
          }
          if (!state.players[payload.id]) {
            state.players[payload.id] = {
              id: payload.id,
              alias: payload.alias,
              year: payload.year,
              score: 0
            };
          } else {
            state.players[payload.id].alias = payload.alias;
            state.players[payload.id].year = payload.year;
          }
          renderLobbyPlayers();
          broadcastRoomState();
        })
        .on("broadcast", { event: "player_vote" }, ({ payload }) => {
          if (!isHost || state.phase !== "QUESTION") return;
          if (state.votes[payload.playerId]) return;
          state.votes[payload.playerId] = {
            optionIndex: payload.optionIndex,
            timeLeft: payload.timeLeft
          };
          updateHostVoteCounter();
        })
        .on("broadcast", { event: "kick_player" }, ({ payload }) => {
          if (!isHost && state.me && state.me.id === payload.playerId) {
            alert("Tu alias fue moderado por el presentador. Ingresá con otro nombre.");
            sessionStorage.removeItem("changopilot_me");
            state.me = null;
            showView("student-join");
          }
        })
        .on("broadcast", { event: "join_rejected" }, ({ payload }) => {
          if (isHost || !state.me || payload?.playerId !== state.me.id) return;
          sessionStorage.removeItem("changopilot_me");
          state.me = null;
          $("alias-error").textContent = payload.reason || "No se pudo ingresar a la sala.";
          $("alias-error").classList.remove("hidden");
          showView("student-join");
        })
        .on("broadcast", { event: "room_state" }, ({ payload }) => {
          if (isHost) return;
          syncStudentWithHost(payload);
        })
        .subscribe((status) => {
          console.log("[Changopilot] Estado canal:", status);
          if (status === "SUBSCRIBED") {
            state.offlineMode = false;
            updateConnBadge("online", "● En Vivo (Supabase)");
            if (isHost) {
              $("btn-offline-toggle").classList.remove("hidden");
              $("btn-offline-toggle").textContent = "🟢 Online";
              broadcastRoomState();
            } else if (state.me) {
              sendBroadcast("player_join", state.me);
            }
          }
        });
    } catch (err) {
      console.error("[Changopilot] Error Supabase:", err);
      state.offlineMode = true;
      updateConnBadge("offline", "● Error red (Modo Offline)");
    }
  }

  async function sendBroadcast(event, payload) {
    if (state.channel && !state.offlineMode) {
      const res = await state.channel.send({ type: "broadcast", event, payload });
      console.log(`[Changopilot] Enviado ${event}:`, res);
    }
  }

  // ==================== LÓGICA DEL PROYECTOR (HOST) ====================
  function initHost() {
    showView("host-lobby");

    // Generar URL limpia para alumnos (sin ?host=true)
    const studentUrl = `${window.location.origin}${window.location.pathname}`;
    $("join-url-text").textContent = studentUrl;
    new QRCode($("qrcode"), {
      text: studentUrl,
      width: 210,
      height: 210
    });

    // Modal Supabase
    const modal = $("supabase-modal");
    $("btn-config-supabase").addEventListener("click", () => {
      $("sb-url-input").value = state.sbUrl;
      $("sb-key-input").value = state.sbKey;
      modal.showModal();
    });
    $("btn-close-modal").addEventListener("click", () => modal.close());
    $("btn-save-supabase").addEventListener("click", () => {
      state.sbUrl = $("sb-url-input").value.trim();
      state.sbKey = $("sb-key-input").value.trim();
      localStorage.setItem("sb_url", state.sbUrl);
      localStorage.setItem("sb_key", state.sbKey);
      modal.close();
      window.location.reload();
    });

    $("btn-offline-toggle").addEventListener("click", () => {
      state.offlineMode = !state.offlineMode;
      $("btn-offline-toggle").textContent = state.offlineMode ? "📡 Modo Offline" : "🟢 Online";
      updateConnBadge(
        state.offlineMode ? "offline" : "online",
        state.offlineMode ? "● Modo Offline (Manual)" : "● En Vivo (Supabase)"
      );
    });

    $("btn-start-game").addEventListener("click", startPractice);
    $("btn-reveal").addEventListener("click", revealRound);
    $("btn-next-round").addEventListener("click", () => {
      if (state.isPractice) {
        startRound(0);
      } else if (state.roundIndex + 1 < QUESTIONS.length) {
        startRound(state.roundIndex + 1);
      } else {
        showFinalPodium();
      }
    });
    $("btn-finalize").classList.remove("hidden");
    $("btn-finalize").addEventListener("click", showClosingView);
    $("btn-restart").addEventListener("click", () => window.location.reload());
  }

  function renderLobbyPlayers() {
    const list = $("lobby-players-list");
    const playersArr = Object.values(state.players);
    $("player-count").textContent = playersArr.length;
    list.innerHTML = "";

    playersArr.forEach((p) => {
      const chip = document.createElement("div");
      chip.className = "player-chip";
      chip.innerHTML = `
        <span>${escapeHtml(p.alias)}</span>
        <small>${escapeHtml(p.year)}</small>
        <button class="kick-btn" title="Expulsar alias">✕</button>
      `;
      chip.querySelector(".kick-btn").addEventListener("click", () => {
        state.kickedIds.add(p.id);
        delete state.players[p.id];
        sendBroadcast("kick_player", { playerId: p.id });
        renderLobbyPlayers();
      });
      list.appendChild(chip);
    });
  }

  function startRound(index) {
    state.roundIndex = index;
    state.isPractice = false;
    state.phase = "QUESTION";
    state.votes = {};
    state.timeLeft = ROUND_SECONDS;

    const q = QUESTIONS[index];
    showView("host-question");

    $("host-category").textContent = q.category;
    $("host-round-num").textContent = `Ronda ${index + 1} de ${QUESTIONS.length}`;
    $("host-prompt").textContent = `"${q.prompt}"`;

    const codeEl = $("host-code");
    codeEl.className = `language-${q.language}`;
    codeEl.textContent = q.code;
    if (window.Prism) Prism.highlightElement(codeEl);

    $("host-question-text").textContent = q.question;
    const optsContainer = $("host-options-list");
    optsContainer.innerHTML = "";
    q.options.forEach((opt, i) => {
      const div = document.createElement("div");
      div.className = "host-option-item";
      div.innerHTML = `<span class="opt-letter">${LETTERS[i]}</span><span>${escapeHtml(opt)}</span>`;
      optsContainer.appendChild(div);
    });

    updateHostVoteCounter();
    broadcastRoomState();

    clearInterval(state.timerId);
    updateTimerUI();
    state.timerId = setInterval(() => {
      state.timeLeft--;
      updateTimerUI();
      if (state.timeLeft <= 0) {
        revealRound();
      }
    }, 1000);
  }

  function startPractice() {
    state.roundIndex = 0;
    state.isPractice = true;
    state.phase = "QUESTION";
    state.votes = {};
    state.timeLeft = ROUND_SECONDS;

    const q = PRACTICE_QUESTION;
    showView("host-question");
    $("host-category").textContent = q.category;
    $("host-round-num").textContent = "Práctica";
    $("host-prompt").textContent = `"${q.prompt}"`;

    const codeEl = $("host-code");
    codeEl.className = `language-${q.language}`;
    codeEl.textContent = q.code;
    if (window.Prism) Prism.highlightElement(codeEl);

    $("host-question-text").textContent = q.question;
    const optsContainer = $("host-options-list");
    optsContainer.innerHTML = "";
    q.options.forEach((opt, i) => {
      const div = document.createElement("div");
      div.className = "host-option-item";
      div.innerHTML = `<span class="opt-letter">${LETTERS[i]}</span><span>${escapeHtml(opt)}</span>`;
      optsContainer.appendChild(div);
    });

    updateHostVoteCounter();
    broadcastRoomState();
    clearInterval(state.timerId);
    updateTimerUI();
    state.timerId = setInterval(() => {
      state.timeLeft--;
      updateTimerUI();
      if (state.timeLeft <= 0) {
        revealRound();
      }
    }, 1000);
  }

  function updateTimerUI() {
    const el = $("host-timer");
    el.textContent = state.timeLeft;
    el.classList.toggle("urgent", state.timeLeft <= 10);
  }

  function updateHostVoteCounter() {
    const totalPlayers = Object.keys(state.players).length;
    const totalVotes = Object.keys(state.votes).length;
    $("votes-count").textContent = `${totalVotes} / ${totalPlayers}`;
    if (totalPlayers > 0 && totalVotes >= totalPlayers) {
      revealRound();
    }
  }

  function revealRound() {
    if (state.phase !== "QUESTION") return;
    clearInterval(state.timerId);
    state.phase = "REVEAL";
    const q = state.isPractice ? PRACTICE_QUESTION : QUESTIONS[state.roundIndex];

    // Calcular puntajes
    const counts = [0, 0, 0, 0];
    const deltas = {};

    Object.entries(state.votes).forEach(([playerId, vote]) => {
      if (vote.optionIndex >= 0 && vote.optionIndex < 4) {
        counts[vote.optionIndex]++;
      }
      if (vote.optionIndex === q.correctIndex && state.players[playerId]) {
        const earned = state.isPractice
          ? 0
          : 500 + Math.round((vote.timeLeft / ROUND_SECONDS) * 500);
        state.players[playerId].score += earned;
        deltas[playerId] = earned;
      } else {
        deltas[playerId] = 0;
      }
    });

    showView("host-reveal");
    $("reveal-question-text").textContent = q.question;
    $("host-moraleja").textContent = q.moraleja;
    $("btn-next-round").textContent =
      state.isPractice || state.roundIndex + 1 < QUESTIONS.length
        ? "Siguiente Ronda ▶"
        : "Ver Podio Final 🏆";

    const totalVotes = Object.keys(state.votes).length || 1;
    const barsEl = $("reveal-bars");
    barsEl.innerHTML = "";
    q.options.forEach((opt, i) => {
      const pct = Math.round((counts[i] / totalVotes) * 100);
      const isCorrect = i === q.correctIndex;
      const row = document.createElement("div");
      row.className = `bar-row ${isCorrect ? "correct" : ""}`;
      row.innerHTML = `
        <div class="bar-top">
          <span>${isCorrect ? "✅ " : ""}${LETTERS[i]}) ${escapeHtml(opt)}</span>
          <span>${counts[i]} votos (${pct}%)</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      `;
      barsEl.appendChild(row);
    });

    renderLeaderboard("leaderboard-list", "year-ranking-list");
    broadcastRoomState(deltas);
  }

  function renderLeaderboard(listId, yearListId) {
    const sorted = Object.values(state.players).sort((a, b) => b.score - a.score);
    const ul = $(listId);
    if (ul) {
      ul.innerHTML = "";
      sorted.slice(0, 5).forEach((p, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>#${idx + 1} ${escapeHtml(p.alias)} (${escapeHtml(p.year)})</span><strong>${p.score} pts</strong>`;
        ul.appendChild(li);
      });
    }

    // Promedio por año
    const byYear = {};
    sorted.forEach((p) => {
      if (!byYear[p.year]) byYear[p.year] = { total: 0, count: 0 };
      byYear[p.year].total += p.score;
      byYear[p.year].count++;
    });

    const yearAvg = Object.entries(byYear)
      .map(([year, data]) => ({ year, avg: Math.round(data.total / data.count) }))
      .sort((a, b) => b.avg - a.avg);

    const yearEl = $(yearListId);
    if (yearEl) {
      yearEl.innerHTML = "";
      yearAvg.forEach((item) => {
        const div = document.createElement("div");
        div.className = "year-bar-item";
        div.innerHTML = `<span>${escapeHtml(item.year)}</span><strong>${item.avg} pts prom.</strong>`;
        yearEl.appendChild(div);
      });
    }
  }

  function showFinalPodium() {
    state.phase = "PODIUM";
    showView("podium-view");
    const sorted = Object.values(state.players).sort((a, b) => b.score - a.score);
    const medals = ["🥇 1º Puesto", "🥈 2º Puesto", "🥉 3º Puesto"];
    const container = $("podium-container");
    container.innerHTML = "";

    [0, 1, 2].forEach((pos) => {
      const p = sorted[pos];
      const box = document.createElement("div");
      box.className = `podium-spot ${pos === 0 ? "first" : ""}`;
      box.innerHTML = p
        ? `<div class="tag">${medals[pos]}</div><h3>${escapeHtml(p.alias)}</h3><p>${escapeHtml(p.year)}</p><strong>${p.score} pts</strong>`
        : `<div class="tag">${medals[pos]}</div><h3>—</h3>`;
      container.appendChild(box);
    });

    renderLeaderboard(null, "final-year-ranking");
    broadcastRoomState();
  }

  function showClosingView() {
    state.phase = "CLOSING";
    showView("host-closing");
    renderFonotipiaQr("host-fonotipia-qr");
    broadcastRoomState();
  }

  function broadcastRoomState(deltas = {}) {
    sendBroadcast("room_state", {
      phase: state.phase,
      roundIndex: state.roundIndex,
      isPractice: state.isPractice,
      timeLeft: state.timeLeft,
      players: state.players,
      deltas
    });
  }

  // ==================== LÓGICA DEL ALUMNO (MOBILE) ====================
  function initStudent() {
    showView("student-join");
    let selectedYear = "1er año";
    let joinInterval = null;
    $("btn-download-summary").addEventListener("click", () => {
      renderPrintSummary();
      window.print();
      showStudentFonotipiaInvite();
    });
    $("btn-skip-summary").addEventListener("click", showStudentFonotipiaInvite);

    document.querySelectorAll(".year-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".year-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedYear = btn.dataset.year;
      });
    });

    $("join-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = $("alias-input").value;
      const check = validateAlias(raw);
      const errEl = $("alias-error");

      if (!check.valid) {
        errEl.textContent = check.reason;
        errEl.classList.remove("hidden");
        return;
      }

      errEl.classList.add("hidden");
      state.me = {
        id: getPersistentPlayerId(),
        alias: check.cleanAlias,
        year: selectedYear,
        score: 0,
        votedOption: null,
        confirmedByHost: false
      };

      sessionStorage.setItem("changopilot_me", JSON.stringify(state.me));
      $("student-badge").textContent = `${state.me.alias} • ${state.me.year}`;
      sendBroadcast("player_join", state.me);
      showView("student-wait");

      clearInterval(joinInterval);
      joinInterval = setInterval(() => {
        if (!state.me || state.me.confirmedByHost || state.phase !== "LOBBY") {
          clearInterval(joinInterval);
          return;
        }
        sendBroadcast("player_join", state.me);
      }, 2500);
    });

    // Recuperar sesión si recargó la pestaña
    const savedMe = sessionStorage.getItem("changopilot_me");
    if (savedMe) {
      try {
        state.me = JSON.parse(savedMe);
        $("student-badge").textContent = `${state.me.alias} • ${state.me.year}`;
        sendBroadcast("player_join", state.me);
        showView("student-wait");
      } catch (_) {
        sessionStorage.removeItem("changopilot_me");
      }
    }

    // Re-sincronizar apenas desbloquea la pantalla o vuelve a la pestaña
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && state.me) {
        sendBroadcast("player_join", state.me);
      }
    });
  }

  function requestHostAccess() {
    if (isHost) {
      initHost();
      return;
    }

    if (!isHostRequest) {
      initStudent();
      return;
    }

    const modal = $("host-access-modal");
    const input = $("host-key-input");
    const error = $("host-key-error");
    modal.showModal();
    $("btn-submit-host-key").addEventListener("click", () => {
      if (input.value !== HOST_ACCESS_KEY) {
        error.textContent = "La clave no es correcta.";
        error.classList.remove("hidden");
        input.select();
        return;
      }

      isHost = true;
      sessionStorage.setItem("changopilot_host_access", HOST_ACCESS_KEY);
      modal.close();
      initHost();
    });
    $("btn-cancel-host-key").addEventListener("click", () => {
      modal.close();
      showView("host-access-denied");
    });
  }

  function syncStudentWithHost(payload) {
    if (!state.me) return;

    if (payload.players && payload.players[state.me.id]) {
      state.me.score = payload.players[state.me.id].score;
      state.me.confirmedByHost = true;
      sessionStorage.setItem("changopilot_me", JSON.stringify(state.me));
    }

    if (payload.phase === "LOBBY") {
      $("student-score").textContent = `${state.me.score} pts`;
      showView("student-wait");
    } else if (payload.phase === "QUESTION") {
      const isPractice = Boolean(payload.isPractice);
      const isNewRound =
        state.roundIndex !== payload.roundIndex ||
        state.isPractice !== isPractice ||
        state.phase !== "QUESTION";
      state.roundIndex = payload.roundIndex;
      state.isPractice = isPractice;
      state.phase = "QUESTION";

      if (isNewRound) {
        state.me.votedOption = null;
        renderMobileQuestion(payload.roundIndex, payload.timeLeft, isPractice);
      }
      showView("student-vote");
    } else if (payload.phase === "REVEAL") {
      clearInterval(state.timerId);
      state.phase = "REVEAL";
      const q = payload.isPractice ? PRACTICE_QUESTION : QUESTIONS[payload.roundIndex];
      const earned = (payload.deltas && payload.deltas[state.me.id]) || 0;
      const acertó = state.me.votedOption === q.correctIndex;

      $("result-status-icon").textContent = acertó ? "🎯" : "💥";
      $("result-status-title").textContent = acertó
        ? "¡Frenaste el bug a tiempo!"
        : "Pasó a producción con bug...";
      $("result-points-earned").textContent = acertó ? `+${earned} pts` : "0 pts";
      $("mobile-moraleja").textContent = q.moraleja;
      $("student-score-after").textContent = `${state.me.score} pts`;
      showView("student-result");
    } else if (payload.phase === "PODIUM") {
      state.phase = "PODIUM";
      $("wait-title").textContent = "¡Auditoria Finalizada!";
      $("wait-subtitle").textContent = "Mirá el podio final en la pantalla del aula.";
      $("student-score").textContent = `${state.me.score} pts`;
      $("btn-download-summary").classList.remove("hidden");
      $("btn-skip-summary").classList.remove("hidden");
      $("student-fonotipia-invite").classList.add("hidden");
      showView("student-wait");
    } else if (payload.phase === "CLOSING") {
      state.phase = "CLOSING";
      $("wait-title").textContent = "¡Gracias por su participación!";
      $("wait-subtitle").textContent = "El criterio técnico se construye revisando, preguntando y haciéndose responsable.";
      $("student-score").textContent = `${state.me.score} pts`;
      $("btn-download-summary").classList.add("hidden");
      $("btn-skip-summary").classList.add("hidden");
      showView("student-wait");
      showStudentFonotipiaInvite();
    }
  }

  function getPersistentPlayerId() {
    const savedId = localStorage.getItem("changopilot_player_id");
    if (savedId) return savedId;
    const newId = "p_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("changopilot_player_id", newId);
    return newId;
  }

  function showStudentFonotipiaInvite() {
    $("btn-download-summary").classList.add("hidden");
    $("btn-skip-summary").classList.add("hidden");
    $("student-fonotipia-invite").classList.remove("hidden");
    renderFonotipiaQr("student-fonotipia-qr");
  }

  function renderFonotipiaQr(elementId) {
    const qrElement = $(elementId);
    qrElement.innerHTML = "";
    if (typeof QRCode === "function") {
      new QRCode(qrElement, {
        text: FONOTIPIA_URL,
        width: 180,
        height: 180
      });
    }
  }

  function renderMobileQuestion(index, initialTime, isPractice) {
    const q = isPractice ? PRACTICE_QUESTION : QUESTIONS[index];
    $("mobile-round-tag").textContent = isPractice
      ? "Práctica"
      : `Ronda ${index + 1}/${QUESTIONS.length}`;
    $("mobile-question-title").textContent = q.question;

    const codeEl = $("mobile-code");
    codeEl.className = `language-${q.language}`;
    codeEl.textContent = q.code;
    if (window.Prism) Prism.highlightElement(codeEl);

    const optsEl = $("mobile-options");
    optsEl.innerHTML = "";
    optsEl.classList.remove("hidden");
    $("mobile-voted-feedback").classList.add("hidden");

    let localLeft = initialTime || ROUND_SECONDS;
    $("mobile-timer").textContent = `${localLeft}s`;
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      localLeft = Math.max(0, localLeft - 1);
      $("mobile-timer").textContent = `${localLeft}s`;
    }, 1000);

    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mobile-opt-btn";
      btn.innerHTML = `<span class="opt-letter">${LETTERS[i]}</span><span>${escapeHtml(opt)}</span>`;
      btn.addEventListener("click", () => {
        if (state.me.votedOption !== null) return;
        state.me.votedOption = i;
        sessionStorage.setItem("changopilot_me", JSON.stringify(state.me));
        optsEl.classList.add("hidden");
        $("mobile-voted-feedback").classList.remove("hidden");
        sendBroadcast("player_vote", {
          playerId: state.me.id,
          optionIndex: i,
          timeLeft: localLeft
        });
      });
      optsEl.appendChild(btn);
    });
  }

  function renderPrintSummary() {
    const summary = $("print-summary");
    const alias = state.me ? escapeHtml(state.me.alias) : "Participante";
    const score = state.me ? state.me.score : 0;
    summary.innerHTML = `
      <h1>Changopilot — Resumen de aprendizaje</h1>
      <p class="summary-meta">${alias} · Puntaje final: ${score} pts</p>
      ${QUESTIONS.map((q, index) => `
        <article class="summary-question">
          <h2>Ronda ${index + 1}: ${escapeHtml(q.category)}</h2>
          <p>${escapeHtml(q.question)}</p>
          <pre>${escapeHtml(q.code)}</pre>
          <p class="summary-answer">Respuesta correcta: ${escapeHtml(q.options[q.correctIndex])}</p>
          <p><strong>Explicación:</strong> ${escapeHtml(q.explanation || q.moraleja)}</p>
          <p><strong>Moraleja:</strong> ${escapeHtml(q.moraleja)}</p>
        </article>
      `).join("")}
    `;
  }

  function aliasKey(alias) {
    return String(alias || "").trim().toLocaleLowerCase();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ==================== INICIO ====================
  requestHostAccess();
  initSupabase();
})();
