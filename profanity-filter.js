const BLOCKED_WORDS = [
  "puto", "puta", "pelotudo", "boludo", "forro", "concha", "pija", "chota",
  "verga", "culo", "mierda", "cagar", "garca", "sorete", "trolo", "trola",
  "mogolico", "idiota", "imbecil", "estupido", "nazis", "nazi", "hitler",
  "porno", "sexo", "pene", "vagina", "tetas", "ortiva", "gil", "chupapija"
];

function normalizeText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/4/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .replace(/[^a-z0-9]/g, "");
}

function validateAlias(rawAlias) {
  const clean = rawAlias.trim().replace(/\s+/g, " ");
  if (clean.length < 2) {
    return { valid: false, reason: "El alias debe tener al menos 2 caracteres." };
  }
  if (clean.length > 15) {
    return { valid: false, reason: "Máximo 15 caracteres." };
  }
  const normalized = normalizeText(clean);
  const hasBadWord = BLOCKED_WORDS.some((word) => normalized.includes(word));
  if (hasBadWord) {
    return {
      valid: false,
      reason: "Elegí un alias apto para mostrar en el proyector del aula 😅"
    };
  }
  return { valid: true, cleanAlias: clean };
}
