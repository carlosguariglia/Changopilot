(() => {
  const ROUND_SECONDS = 40;
  const LETTERS = ["A", "B", "C", "D"];

  // Detectar si es vista Proyector (?host=true)
  const params = new URLSearchParams(window.location.search);
  const isHost = params.get("host") === "true";

  // Estado global de la sesión
  const state = {
    sbUrl: localStorage.getItem("sb_url") || "https://hehaakhdmpdktsywywbb.supabase.co",
    sbKey: localStorage.getItem("sb_key") || "sb_publishable_c0MtbIOA-3s_ky2L8AEPcQ_Gsfd2iv2",
    supabase: null,
    channel: null,
    offlineMode: false,
    phase: "LOBBY", // LOBBY | QUESTION | REVEAL | PODIUM
    roundIndex: 0,
    timeLeft: ROUND_SECONDS,
    timerId: null,
    players: {}, // { [id]: { id, alias, year, score } }
    votes: {},   // { [playerId]: { optionIndex, timeLeft } }
    kickedIds: new Set(),
    me: null     // { id, alias, year, score, votedOption, lastDelta }
  };

  const $ = (id) => document.getElementById(id);

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
      state.channel = state.supabase.channel("isft151-code-review", {
        config: { broadcast: { self: true } }
      });

      state.channel
        .on("broadcast", { event: "player_join" }, ({ payload }) => {
          if (!isHost || state.kickedIds.has(payload.id)) return;
          if (!state.players[payload.id]) {
            state.players[payload.id] = { ...payload, score: 0 };
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
            state.me = null;
            showView("student-join");
          }
        })
        .on("broadcast", { event: "room_state" }, ({ payload }) => {
          if (isHost) return;
          syncStudentWithHost(payload);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            state.offlineMode = false;
            updateConnBadge("online", "● En Vivo (Supabase)");
            if (isHost) {
              $("btn-offline-toggle").classList.remove("hidden");
              $("btn-offline-toggle").textContent = "🟢 Online";
            } else if (state.me) {
              sendBroadcast("player_join", state.me);
            }
          }
        });
    } catch (err) {
      console.error(err);
      state.offlineMode = true;
      updateConnBadge("offline", "● Error red (Modo Offline)");
    }
  }

  function sendBroadcast(event, payload) {
    if (state.channel && !state.offlineMode) {
      state.channel.send({ type: "broadcast", event, payload });
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

    $("btn-start-game").addEventListener("click", () => startRound(0));
    $("btn-reveal").addEventListener("click", revealRound);
    $("btn-next-round").addEventListener("click", () => {
      if (state.roundIndex + 1 < QUESTIONS.length) {
        startRound(state.roundIndex + 1);
      } else {
        showFinalPodium();
      }
    });
    $("btn-restart").classList.remove("hidden");
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
    clearInterval(state.timerId);
    state.phase = "REVEAL";
    const q = QUESTIONS[state.roundIndex];

    // Calcular puntajes
    const counts = [0, 0, 0, 0];
    const deltas = {};

    Object.entries(state.votes).forEach(([playerId, vote]) => {
      if (vote.optionIndex >= 0 && vote.optionIndex < 4) {
        counts[vote.optionIndex]++;
      }
      if (vote.optionIndex === q.correctIndex && state.players[playerId]) {
        const speedBonus = Math.round((vote.timeLeft / ROUND_SECONDS) * 500);
        const earned = 500 + speedBonus;
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
      state.roundIndex + 1 < QUESTIONS.length ? "Siguiente Ronda ▶" : "Ver Podio Final 🏆";

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

  function broadcastRoomState(deltas = {}) {
    sendBroadcast("room_state", {
      phase: state.phase,
      roundIndex: state.roundIndex,
      timeLeft: state.timeLeft,
      players: state.players,
      deltas
    });
  }

  // ==================== LÓGICA DEL ALUMNO (MOBILE) ====================
  function initStudent() {
    showView("student-join");
    let selectedYear = "1er año";

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
        id: "p_" + Math.random().toString(36).slice(2, 10),
        alias: check.cleanAlias,
        year: selectedYear,
        score: 0,
        votedOption: null
      };

      $("student-badge").textContent = `${state.me.alias} • ${state.me.year}`;
      sendBroadcast("player_join", state.me);
      showView("student-wait");
    });
  }

  function syncStudentWithHost(payload) {
    if (!state.me) return;

    if (payload.players && payload.players[state.me.id]) {
      state.me.score = payload.players[state.me.id].score;
    }

    if (payload.phase === "LOBBY") {
      $("student-score").textContent = `${state.me.score} pts`;
      showView("student-wait");
    } else if (payload.phase === "QUESTION") {
      const isNewRound = state.roundIndex !== payload.roundIndex || state.phase !== "QUESTION";
      state.roundIndex = payload.roundIndex;
      state.phase = "QUESTION";

      if (isNewRound) {
        state.me.votedOption = null;
        renderMobileQuestion(payload.roundIndex, payload.timeLeft);
      }
      showView("student-vote");
    } else if (payload.phase === "REVEAL") {
      state.phase = "REVEAL";
      const q = QUESTIONS[payload.roundIndex];
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
      showView("student-wait");
    }
  }

  function renderMobileQuestion(index, initialTime) {
    const q = QUESTIONS[index];
    $("mobile-round-tag").textContent = `Ronda ${index + 1}/${QUESTIONS.length}`;
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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ==================== INICIO ====================
  if (isHost) {
    initHost();
  } else {
    initStudent();
  }
  initSupabase();
})();
