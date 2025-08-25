(() => {
  function whenUtilsReady(cb, tries = 50) {
    if (window.pwUtils) return cb();
    if (tries <= 0) return;
    setTimeout(() => whenUtilsReady(cb, tries - 1), 20);
  }

  whenUtilsReady(() => {
    const { sha1Hex, debounce, scorePassword, suggestImprovements, generateStrongerVariant, createRandomPass } = window.pwUtils;
    const widgetMap = new WeakMap();
    const PANEL_WIDTH = 340, GAP = 8;
    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    function createWidget(input) {
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.zIndex = "2147483646";
      host.style.top = "-9999px";
      host.style.left = "-9999px";
      host.style.opacity = "0";
      host.style.transform = "translateY(8px)";
      host.style.transition = "opacity .2s ease, transform .2s ease";

      const shadow = host.attachShadow({ mode: "open" });
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = chrome.runtime.getURL("ui.css");
      shadow.appendChild(link);

      const wrap = document.createElement("div");
      wrap.className = "pw-helper";
      wrap.innerHTML = `
        <div class="status">Start typing your password…</div>
        <div class="breach-count"></div>
        <div class="meter"><span></span></div>
        <div class="tips"></div>
        <div class="suggest-list"></div>
        <div class="regen-area hidden"><button class="regen-btn" type="button">Regenerate Suggestions</button></div>
        <div class="footer">Privacy: only the first 5 chars of SHA-1 are sent.</div>
      `;
      shadow.appendChild(wrap);
      document.documentElement.appendChild(host);

      return {
        host, shadow, wrap, input,
        locked: false,
        regenVisible: false,
        internalUpdate: false,
        initialSuggestionsShown: false,
        statusEl: wrap.querySelector(".status"),
        breachEl: wrap.querySelector(".breach-count"),
        meterInner: wrap.querySelector(".meter > span"),
        tipsEl: wrap.querySelector(".tips"),
        listEl: wrap.querySelector(".suggest-list"),
        regenArea: wrap.querySelector(".regen-area"),
        regenBtn: wrap.querySelector(".regen-btn")
      };
    }

    function show(host){ host.style.opacity="1"; host.style.transform="translateY(0)"; }
    function hide(host){ host.style.opacity="0"; host.style.transform="translateY(8px)"; }
    function positionWidget(state){
      const rect = state.input.getBoundingClientRect();
      const left = clamp(rect.left, 8, window.innerWidth - PANEL_WIDTH - 8);
      const top = clamp(rect.bottom + GAP, 8, window.innerHeight - 8);
      state.host.style.left = `${Math.round(left)}px`;
      state.host.style.top = `${Math.round(top + window.scrollY)}px`;
    }

    function makeSuggestions(basePw) {
      const set = new Set();
      let safety = 0;
      while (set.size < 3 && safety++ < 50) {
        const candidate = generateStrongerVariant(basePw);
        if (scorePassword(candidate) >= 3) {
          set.add(candidate);
        }
      }
      // fallback: ensure always 3 strong ones
      while (set.size < 3 && safety++ < 100) {
        const candidate = createRandomPass();
        if (scorePassword(candidate) >= 3) {
          set.add(candidate);
        }
      }
      return [...set];
    }

    function renderSuggestions(state, basePw) {
      const list = state.listEl;
      list.innerHTML = "";

      if (state.locked) {
        if (state.regenVisible) {
          state.regenArea.classList.remove("hidden");
        }
        return;
      }
      state.regenArea.classList.add("hidden");

      makeSuggestions(basePw).forEach((sugg) => {
        const row = document.createElement("div");
        row.className = "suggest";
        row.innerHTML = `
          <span class="suggest-text" title="${sugg}">${sugg}</span>
          <button class="swap-btn" type="button">Swap</button>
        `;
        row.querySelector(".swap-btn").addEventListener("click", () => {
          state.internalUpdate = true;
          state.input.value = sugg;
          state.input.dispatchEvent(new Event("input", { bubbles: true }));
          state.input.dispatchEvent(new Event("change", { bubbles: true }));

          state.locked = true;
          state.regenVisible = true;
          list.innerHTML = "";
          state.regenArea.classList.remove("hidden");

          setTimeout(() => (state.internalUpdate = false), 0);
        });
        list.appendChild(row);
      });
    }

    function updatePanel(state, pw, breachedCount) {
      const score = scorePassword(pw);
      state.meterInner.style.width = (score / 4) * 100 + "%";
      if (breachedCount > 0) {
        state.statusEl.textContent = "Breached password detected!";
        state.statusEl.className = "status bad";
        state.breachEl.textContent = `Seen ${breachedCount.toLocaleString()} times in breaches.`;
      } else if (pw.length === 0) {
        state.statusEl.textContent = "Start typing your password…";
        state.statusEl.className = "status";
        state.breachEl.textContent = "";
        state.initialSuggestionsShown = false;
      } else if (score <= 1) {
        state.statusEl.textContent = "Weak password";
        state.statusEl.className = "status warn";
        state.breachEl.textContent = "";
      } else {
        state.statusEl.textContent = "Looks good";
        state.statusEl.className = "status ok";
        state.breachEl.textContent = "";
      }
      const improvements = suggestImprovements(pw);
      state.tipsEl.textContent = improvements.length ? "Suggestions: " + improvements.join(" ") : "No major issues.";
    }

    async function checkBreached(pw){
      try {
        if (!pw || pw.length < 8) return 0;
        const sha1 = await sha1Hex(pw);
        const prefix = sha1.slice(0,5), suffix = sha1.slice(5);
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {headers:{"Add-Padding":"true"}});
        if (!res.ok) return 0;
        const lines = (await res.text()).split("\n");
        for (const line of lines){
          const [suf,count] = line.trim().split(":");
          if (suf && count && suf.toUpperCase()===suffix) return parseInt(count,10)||0;
        }
      } catch {}
      return 0;
    }

    const handleInput = debounce(async (input) => {
      let state = widgetMap.get(input);
      if (!state){ state = createWidget(input); widgetMap.set(input,state); }
      const pw = input.value || "";

      if (!state.internalUpdate) {
        state.locked = false;
        state.regenVisible = false;
      }

      positionWidget(state); show(state.host);
      const count = await checkBreached(pw);
      updatePanel(state,pw,count);

      if (pw.length > 0 && !state.initialSuggestionsShown) {
        renderSuggestions(state, pw);
        state.initialSuggestionsShown = true;
      } else {
        state.regenArea.classList.remove("hidden");
      }

      state.regenBtn.onclick = () => {
        state.locked = false;
        state.regenVisible = false;
        renderSuggestions(state, pw);
      };
    },120);

    function bindToInput(input){
      if (widgetMap.has(input)) return;
      const state = createWidget(input);
      widgetMap.set(input,state);
      input.addEventListener("input",()=>handleInput(input),true);
      input.addEventListener("focus",()=>handleInput(input),true);
      input.addEventListener("blur",()=>hide(state.host),true);
      // Hide when clicking outside popup + input
      document.addEventListener("click",(e)=>{
        const clickedInsidePopup = state.host.contains(e.target) || state.shadow.contains(e.target);
        if (!clickedInsidePopup && e.target !== input) {
          hide(state.host);
        }
      },true);
      window.addEventListener("scroll",()=>positionWidget(state),true);
      window.addEventListener("resize",()=>positionWidget(state),true);
    }
    function scanAndBind(){ document.querySelectorAll('input[type="password"]').forEach(bindToInput); }
    new MutationObserver(scanAndBind).observe(document.documentElement,{childList:true,subtree:true});
    scanAndBind();
  });
})();