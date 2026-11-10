// Couleurs du joueur 2 quand les deux joueurs prennent le même perso.
// Chaque perso peut avoir sa table de remplacement (« couleurs2 » dans anims.json, réglée dans l'éditeur d'animations :
// bouton « 🎨 Couleurs J2 ») : { 'rrggbb' d'origine : 'rrggbb' à la place }. Sans table : proposition automatique
// (la couleur principale des vêtements change de teinte ; peau, cheveux clairs, noir, blanc et gris ne bougent pas).
// Utilisé par le jeu (game.js) et par l'éditeur (outils/editeur.html).
window.COULEURS = (() => {
  const hex = c => c.toString(16).padStart(6, '0');
  function hsl(c) {
    const r = (c >> 16 & 255) / 255, g = (c >> 8 & 255) / 255, b = (c & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (d === 0) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  }
  function rgb(h, s, l) {
    const C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = l - C / 2;
    const [a, b, c] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
    return Math.round((a + m) * 255) << 16 | Math.round((b + m) * 255) << 8 | Math.round((c + m) * 255);
  }
  // nombre de pixels de chaque couleur (pixels visibles seulement) ; zones = [{ x, y, w, h }] : seulement là (ex. la garde du perso)
  function palette(data, zones) {
    const p = data.data, n = new Map(), W = data.width;
    const compter = i => { if (p[i + 3] > 0) { const c = p[i] << 16 | p[i + 1] << 8 | p[i + 2]; n.set(c, (n.get(c) || 0) + 1); } };
    if (zones && zones.length) { for (const z of zones) for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) compter((y * W + x) * 4); }
    else for (let i = 0; i < p.length; i += 4) compter(i);
    return n;
  }
  const garder = ([h, s, l]) => s < 0.2 || l < 0.12 || l > 0.92 || (h >= 5 && h <= 55 && l > 0.6);    // gris, noir, blanc, peau / blond
  // proposition : le groupe de teintes le plus présent (hors peau et gris) tourne de 180°
  function proposer(compte) {
    const bacs = new Array(12).fill(0), info = [];
    for (const [c, n] of compte) { const t = hsl(c); if (garder(t)) continue; info.push([c, t]); bacs[Math.floor(t[0] / 30) % 12] += n; }
    const max = Math.max(...bacs); if (!max) return {};
    const centre = bacs.indexOf(max) * 30 + 15, table = {};
    for (const [c, [h, s, l]] of info) {
      let d = Math.abs(h - centre); d = Math.min(d, 360 - d);
      if (d <= 30) table[hex(c)] = hex(rgb((h + 180) % 360, s, l));
    }
    return table;
  }
  // copie d'une image (ou d'un canvas) avec les couleurs remplacées ; pas de table : proposition automatique,
  // faite sur les couleurs des zones données (la garde du perso : l'atlas contient aussi des effets et des fonds)
  function appliquer(im, table, zones) {
    const c = document.createElement('canvas'); c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    const t = table || proposer(palette(d, zones));     // table vide = couleurs d'origine
    const m = new Map(Object.entries(t).map(([a, b]) => [parseInt(a, 16), parseInt(b, 16)]));
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const v = m.get(p[i] << 16 | p[i + 1] << 8 | p[i + 2]); if (v === undefined) continue;
      p[i] = v >> 16 & 255; p[i + 1] = v >> 8 & 255; p[i + 2] = v & 255;
    }
    x.putImageData(d, 0, 0); return c;
  }
  return { hex, hsl, rgb, palette, proposer, appliquer };
})();
