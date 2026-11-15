(() => {
  // Palabras legítimas (especial informática / nombres) que podrían contener subcadenas
  const ALLOWLIST = new Set([
    "analisis", "analista", "computadora", "compu", "const", "constructor",
    "estructura", "puntero", "pico", "tito", "pato", "coca", "culo_botella",
    "asincrono", "asincronia", "cumple", "documentacion", "ejecucion",
    "herencia", "instancia", "recursivo", "secuencia", "sistema", "testing"
  ]);

  // Diccionario extendido de raíces prohibidas (español general + modismos AR + inglés común)
  const BANNED_ROOTS = [
    // Anatomía y términos sexuales explícitos
    "pito", "pija", "pijudo", "pijazo", "poronga", "chota", "choto", "verga",
    "vergazo", "pene", "falo", "garcha", "garchar", "teta", "teton", "tetona",
    "tetas", "boobs", "culo", "culiao", "culiado", "culia", "orto", "ojete",
    "ano", "concha", "conchuda", "conchudo", "cajeta", "argolla", "vagina",
    "vulva", "clitoris", "pussy", "dick", "cock", "penis", "tits", "asshole",
    "huevo", "huevon", "boludo", "boluda", "pelotudo", "pelotuda", "forro",
    "forra", "pajero", "pajera", "paja", "masturb", "acab", "leche", "chele",
    "esperma", "semen", "sorete", "caca", "mierda", "mjerda", "cagar", "cagon",
    "pedo", "pis", "meada", "mear",

    // Insultos, agravios y discriminatorios (AR y general)
    "puto", "puta", "putita", "putito", "putazo", "trolo", "trola", "marica",
    "maricon", "marimacho", "trava", "travesti", "joto", "culero",
    "hijo de puta", "hdp", "hp", "lcdtm", "lpm", "lpqtp", "la concha",
    "concha de tu madre", "la puta", "ctm", "ptm",
    "mogolico", "mogolica", "mongolico", "retrasado", "retrasada", "idiota",
    "imbecil", "estupido", "tarado", "tarada", "down", "autista",
    "negro de mierda", "villero", "planero", "facho", "zurdo de mierda",
    "nazi", "hitler", "esvastica", "kkk", "violador", "violar", "abuso",
    "pedofilo", "pedofilia", "suicidio", "matate", "morite",
    "cornudo", "cornuda", "garca", "chanta", "raton", "lacra", "basura",
    "malparido", "gonorrea", "cabron", "pendejo", "pendeja", "chinga",
    "verga", "fuck", "shit", "bitch", "bastard", "slut", "whore", "nigger", "faggot"
  ];

  // Normaliza leetspeak, tildes, repeticiones y separadores
  function normalizeText(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar tildes
      .replace(/0/g, "o")
      .replace(/1/g, "i")
      .replace(/!/g, "i")
      .replace(/3/g, "e")
      .replace(/4/g, "a")
      .replace(/@/g, "a")
      .replace(/5/g, "s")
      .replace(/\$/g, "s")
      .replace(/7/g, "t")
      .replace(/8/g, "b")
      .replace(/v/g, "b")               // unificar v/b (ej. berga -> berga)
      .replace(/z/g, "s")               // unificar z/s
      .replace(/k/g, "c")               // unificar k/c (ej. kulo -> culo)
      .replace(/q/g, "c")
      .replace(/(.)\1{2,}/g, "$1$1")    // colapsar 3+ letras iguales (teeeeta -> teeta)
      .replace(/[^a-z0-9]/g, "");       // quitar espacios, puntos, guiones, emojis
  }

  // Versión colapsada a 1 sola letra repetida (teeta -> teta, piito -> pito)
  function collapseRepeats(normalized) {
    return normalized.replace(/(.)\1+/g, "$1");
  }

  window.validateAlias = function (rawAlias) {
    const cleanAlias = String(rawAlias || "").trim().replace(/\s+/g, " ");

    if (cleanAlias.length < 2) {
      return { valid: false, reason: "El alias debe tener al menos 2 caracteres." };
    }
    if (cleanAlias.length > 20) {
      return { valid: false, reason: "El alias no puede superar los 20 caracteres." };
    }

    const norm = normalizeText(cleanAlias);
    const collapsed = collapseRepeats(norm);

    if (norm.length < 2) {
      return { valid: false, reason: "Usá letras o números válidos para tu alias." };
    }

    // Si es una palabra explícitamente permitida, aprobar directo
    if (ALLOWLIST.has(norm) || ALLOWLIST.has(collapsed)) {
      return { valid: true, cleanAlias };
    }

    for (const root of BANNED_ROOTS) {
      const normRoot = normalizeText(root);
      const collapsedRoot = collapseRepeats(normRoot);

      // Coincidencia exacta o como subcadena si la raíz tiene 4+ caracteres
      if (
        norm === normRoot ||
        collapsed === collapsedRoot ||
        (normRoot.length >= 4 && (norm.includes(normRoot) || collapsed.includes(collapsedRoot)))
      ) {
        return {
          valid: false,
          reason: "Ese alias no está permitido en el aula. Elegí otro nombre."
        };
      }
    }

    return { valid: true, cleanAlias };
  };
})();