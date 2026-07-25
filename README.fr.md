# MarkPad

Éditeur de bureau **Markdown** léger pour Windows, construit avec **Tauri v2** (Rust + WebView2) et un front-end **TypeScript** minimaliste (Vite, sans React/Vue).

🌐 **Languages:** [中文](./README.md) | [English](./README.en.md) | [Deutsch](./README.de.md) | Français | [Italiano](./README.it.md) | [Español](./README.es.md)

**Pour les utilisateurs chinois :** un guide d'utilisation concis est disponible dans **[使用手册.md](./使用手册.md)**. Pour le développement et le dépannage, référez-vous à **[docs/启动与使用手册.md](./docs/启动与使用手册.md)** et **[RUN.md](./RUN.md)**.

---

## Fonctionnalités

- **Édition sur une seule surface** — source Markdown avec une superposition de prévisualisation en lecture seule (style Typora), sans panneau de prévisualisation scindé.
- **Document Rust `ropey`** — source unique de vérité ; synchronisation depuis l'éditeur via IPC avec anti-rebond.
- **Sauvegarde automatique façon Obsidian** — une fois le chemin du fichier défini, les modifications sont écrites sur disque après ~1,2 s d'inactivité, plus une sécurité toutes les 30 s.
- **Rechercher dans le document** — `Ctrl+F`, recherche reposant sur le backend Rust.
- **Paramètres** — thème clair/sombre, interface en chinois/anglais, zoom de la police dans l'éditeur avec **Ctrl + molette de la souris**.
- **Menu contextuel** — insertion d'extraits (note de bas de page, tableau, callout, séparateur horizontal, bloc de code clôturé, bloc mathématique) et formatage en ligne.

---

## Prérequis

- **Windows** 10/11 avec **WebView2** (livré avec Win11 ; Win10 nécessite éventuellement une installation manuelle du [runtime WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)).
- **Node.js** ≥ 18
- **Rust** stable (installé via `rustup`)

---

## Démarrage rapide

Clonez ce dépôt puis exécutez dans PowerShell :

```powershell
cd markpad
npm install
npm run tauri dev
```

La première compilation Rust peut prendre plusieurs minutes.

---

## Scripts NPM

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer uniquement le serveur de développement Vite (prévisualisation navigateur, sans fenêtre Tauri) |
| `npm run tauri dev` | Démarrer l'application Tauri complète |
| `npm run build` | Exécuter `tsc` + la build de production Vite |
| `npm run check` | Vérification des types TypeScript (`--noEmit`) |
| `npm run test` | Lancer les tests unitaires Vitest |
| `npm run test:all` | Enchaîner `check` → Vitest → `cargo test` dans `src-tauri` |
| `npm run tauri build` | Générer les paquets de distribution (voir `tauri.conf.json`) |
| `npm run icons` | Régénérer `src-tauri/icons` à partir de `./logo.png` |

Packaging Windows (installateurs + EXE portable, `CARGO_TARGET_DIR`, nettoyage post-build) : voir [`docs/打包说明.md`](./docs/打包说明.md).

---

## Structure du dépôt

| Chemin | Rôle |
|--------|------|
| `src/` | TypeScript côté front-end (éditeur, i18n, paramètres, rendu) |
| `src-tauri/` | Crate Rust + `tauri.conf.json` |
| `docs/` | Spécification produit (`开发方案讨论稿.md`), journal de développement, manuel détaillé |
| `使用手册.md` | Manuel utilisateur concis (chinois) |
| `public/` | Ressources statiques servies par Vite (par exemple `logo.png` pour la barre de titre) |

---

## Index de la documentation

| Document | Public |
|----------|--------|
| [使用手册.md](./使用手册.md) | Utilisateurs finaux (chinois, concis) |
| [docs/启动与使用手册.md](./docs/启动与使用手册.md) | Utilisateurs + contributeurs (détaillé) |
| [RUN.md](./RUN.md) | Astuces de démarrage rapide et configuration de miroir Cargo |
| [docs/打包说明.md](./docs/打包说明.md) | Mainteneurs packaging Windows (scripts batch, nettoyage, chemins) |
| [docs/开发方案讨论稿.md](./docs/开发方案讨论稿.md) | Architecture & feuille de route |
| [docs/开发日志.md](./docs/开发日志.md) | Journal des changements / décisions |

---

## Contribuer

Exécutez `npm run test:all` avant de soumettre des modifications. Respectez le style du code existant ; gardez les diffs ciblés sur la tâche en cours.
