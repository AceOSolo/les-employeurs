<?php
/* Les Employeurs · fonctions de l'API (voir index.php) */
declare(strict_types=1);

namespace LE;

use PDO;

const PIECES = ['strategie', 'rh', 'finance', 'commerce', 'digital', 'achats', 'qvct', 'sante', 'board'];
const SESSION_DAYS = 90;
const RESET_MINUTES = 60;
const INACTIVE_YEARS = 3;

/** @var array<string,mixed> */
$GLOBALS['LE_CONFIG'] = [];

function cfg(string $key, $default = null) {
    return $GLOBALS['LE_CONFIG'][$key] ?? $default;
}

function init(array $config): void {
    $GLOBALS['LE_CONFIG'] = $config;
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');

    /* CORS : seules les origines autorisées peuvent appeler l'API */
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, cfg('allowed_origins', []), true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-LE-Token');
        header('Access-Control-Max-Age: 86400');
    }

    /* Purge RGPD paresseuse, environ une requête sur 200 */
    if (random_int(1, 200) === 1) {
        try { purge_inactive(); } catch (\Throwable $e) { error_log('[les-employeurs api] purge: ' . $e->getMessage()); }
    }
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(cfg('db_dsn'), cfg('db_user'), cfg('db_password'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function q(string $sql, array $params = []): \PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function now(): string { return gmdate('Y-m-d H:i:s'); }

/* ---------- Réponses ---------- */
function ok(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $code, int $status): never {
    http_response_code($status);
    echo json_encode(['code' => $code]);
    exit;
}

function input(): array {
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 200000) fail('PAYLOAD_TOO_LARGE', 413);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/* ---------- Validation ---------- */
function clean_text($v, int $max): string {
    $v = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$v) ?? '');
    return mb_substr($v, 0, $max);
}

function clean_email($v): ?string {
    $v = mb_strtolower(trim((string)$v));
    if (mb_strlen($v) > 120 || !filter_var($v, FILTER_VALIDATE_EMAIL)) return null;
    return $v;
}

function client_ip(): string {
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/* Limite le nombre de tentatives par clé sur une fenêtre glissante */
function throttle(string $action, string $key, int $max, int $seconds): void {
    $hash = hash('sha256', $action . '|' . $key);
    $since = gmdate('Y-m-d H:i:s', time() - $seconds);
    q('DELETE FROM le_attempts WHERE created_at < ?', [gmdate('Y-m-d H:i:s', time() - 86400)]);
    $n = (int)q('SELECT COUNT(*) FROM le_attempts WHERE key_hash = ? AND created_at >= ?', [$hash, $since])->fetchColumn();
    if ($n >= $max) fail('TOO_MANY_REQUESTS', 429);
    q('INSERT INTO le_attempts (key_hash, created_at) VALUES (?, ?)', [$hash, now()]);
}

/* ---------- Utilisateurs ---------- */
function public_user(array $u): array {
    return ['id' => (string)$u['id'], 'name' => $u['name'], 'email' => $u['email']];
}

function find_user_by_email(string $email): ?array {
    $u = q('SELECT * FROM le_users WHERE email = ?', [$email])->fetch();
    return $u ?: null;
}

function create_user(string $name, string $email, string $password): array {
    q('INSERT INTO le_users (name, email, password_hash, consent_at, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
        [$name, $email, password_hash($password, PASSWORD_DEFAULT), now(), now(), now()]);
    return find_user_by_email($email);
}

function rehash_if_needed(array $user, string $password): void {
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        q('UPDATE le_users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }
}

function touch_login(int $userId): void {
    q('UPDATE le_users SET last_login_at = ? WHERE id = ?', [now(), $userId]);
}

function delete_user(int $userId): void {
    $pdo = db();
    $pdo->beginTransaction();
    q('DELETE FROM le_diagnostics WHERE user_id = ?', [$userId]);
    q('DELETE FROM le_sessions WHERE user_id = ?', [$userId]);
    q('DELETE FROM le_password_resets WHERE user_id = ?', [$userId]);
    q('DELETE FROM le_users WHERE id = ?', [$userId]);
    $pdo->commit();
}

/* ---------- Sessions (jeton aléatoire, seule son empreinte est stockée) ---------- */
function create_session(int $userId): string {
    $token = bin2hex(random_bytes(32));
    q('INSERT INTO le_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
        [hash('sha256', $token), $userId, now(), gmdate('Y-m-d H:i:s', time() + SESSION_DAYS * 86400)]);
    return $token;
}

function bearer(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strcasecmp($k, 'Authorization') === 0) $h = $v;
    }
    if (preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $h, $m)) return strtolower($m[1]);
    /* Secours : certains hébergements mutualisés ne transmettent pas l'en-tête Authorization à PHP */
    $alt = (string)($_SERVER['HTTP_X_LE_TOKEN'] ?? '');
    return preg_match('/^[a-f0-9]{64}$/i', $alt) ? strtolower($alt) : null;
}

function current_user(): ?array {
    static $user = false;
    if ($user !== false) return $user;
    $token = bearer();
    if (!$token) return $user = null;
    $row = q('SELECT u.*, s.expires_at AS s_expires FROM le_sessions s JOIN le_users u ON u.id = s.user_id WHERE s.token_hash = ?',
        [hash('sha256', $token)])->fetch();
    if (!$row || $row['s_expires'] < now()) return $user = null;
    /* Session glissante : prolongée à l'usage, au plus une fois par jour */
    if ($row['last_login_at'] < gmdate('Y-m-d H:i:s', time() - 86400)) {
        touch_login((int)$row['id']);
        q('UPDATE le_sessions SET expires_at = ? WHERE token_hash = ?',
            [gmdate('Y-m-d H:i:s', time() + SESSION_DAYS * 86400), hash('sha256', $token)]);
    }
    return $user = $row;
}

function require_user(): array {
    $u = current_user();
    if (!$u) fail('UNAUTHORIZED', 401);
    return $u;
}

function delete_current_session(): void {
    $token = bearer();
    if ($token) q('DELETE FROM le_sessions WHERE token_hash = ?', [hash('sha256', $token)]);
}

/* ---------- Mot de passe oublié ---------- */
function send_reset_email(array $user): void {
    $token = bin2hex(random_bytes(32));
    q('DELETE FROM le_password_resets WHERE user_id = ?', [$user['id']]);
    q('INSERT INTO le_password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [hash('sha256', $token), $user['id'], gmdate('Y-m-d H:i:s', time() + RESET_MINUTES * 60)]);

    $link = rtrim((string)cfg('site_url'), '/') . '/espace.html?mdp=nouveau&token=' . $token;
    $subject = 'Les Employeurs : choisir un nouveau mot de passe';
    $body = "Bonjour {$user['name']},\r\n\r\n"
        . "Vous avez demandé à changer le mot de passe de votre espace Les Employeurs.\r\n"
        . "Pour en choisir un nouveau, ouvrez ce lien (valable " . RESET_MINUTES . " minutes) :\r\n\r\n"
        . $link . "\r\n\r\n"
        . "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.\r\n\r\n"
        . "Les Employeurs · " . rtrim((string)cfg('site_url'), '/') . "\r\n";
    $from = (string)cfg('mail_from');
    $headers = [
        'From' => 'Les Employeurs <' . $from . '>',
        'Reply-To' => (string)cfg('mail_reply_to', $from),
        'Content-Type' => 'text/plain; charset=utf-8',
        'Content-Transfer-Encoding' => '8bit',
    ];
    $sent = mail($user['email'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $from);
    if (!$sent) error_log('[les-employeurs api] échec envoi email de réinitialisation');
}

function reset_password(string $token, string $password): void {
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) fail('INVALID_TOKEN', 400);
    $row = q('SELECT * FROM le_password_resets WHERE token_hash = ?', [hash('sha256', $token)])->fetch();
    if (!$row || $row['expires_at'] < now()) fail('INVALID_TOKEN', 400);
    q('UPDATE le_users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $row['user_id']]);
    q('DELETE FROM le_password_resets WHERE user_id = ?', [$row['user_id']]);
    q('DELETE FROM le_sessions WHERE user_id = ?', [$row['user_id']]); // déconnecte les autres appareils
}

/* ---------- Diagnostics ---------- */
function uuid4(): string {
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function format_diagnostic(array $r, bool $full = true): array {
    $d = [
        'id' => $r['id'],
        'piece' => $r['piece'],
        'version' => (int)$r['version'],
        'score_global' => (int)$r['score_global'],
        'scores' => json_decode($r['scores'], true),
        'created_at' => str_replace(' ', 'T', $r['created_at']) . 'Z',
    ];
    if ($full) $d['answers'] = json_decode($r['answers'], true);
    return $d;
}

function list_diagnostics(int $userId): array {
    $rows = q('SELECT id, piece, version, score_global, scores, created_at FROM le_diagnostics WHERE user_id = ? ORDER BY created_at DESC, seq DESC', [$userId])->fetchAll();
    return array_map(fn($r) => format_diagnostic($r, false), $rows);
}

function get_diagnostic(int $userId, string $id): ?array {
    $r = q('SELECT * FROM le_diagnostics WHERE id = ? AND user_id = ?', [$id, $userId])->fetch();
    return $r ? format_diagnostic($r) : null;
}

function save_diagnostic(int $userId, array $in): array {
    $piece = (string)($in['piece'] ?? '');
    if (!in_array($piece, PIECES, true)) fail('INVALID_PIECE', 400);

    /* Réponses : { "1.2": 0..3 | "nc" } */
    $answers = $in['answers'] ?? null;
    if (!is_array($answers) || count($answers) === 0 || count($answers) > 200) fail('INVALID_ANSWERS', 400);
    foreach ($answers as $k => $v) {
        if (!preg_match('/^\d{1,2}\.\d{1,2}$/', (string)$k)) fail('INVALID_ANSWERS', 400);
        if (!($v === 'nc' || (is_int($v) && $v >= 0 && $v <= 3))) fail('INVALID_ANSWERS', 400);
    }

    /* Scores recalculés côté serveur à partir des réponses (on ne fait pas confiance au navigateur) */
    $byFamily = [];
    foreach ($answers as $k => $v) {
        [$fam] = explode('.', (string)$k);
        $byFamily[$fam] ??= [0, 0];
        if (is_int($v)) { $byFamily[$fam][0] += $v; $byFamily[$fam][1] += 1; }
    }
    ksort($byFamily, SORT_NUMERIC);
    $families = [];
    $sum = 0; $count = 0;
    foreach ($byFamily as $fam => [$s, $c]) {
        if ($c > 0) {
            $score = (int)round($s / ($c * 3) * 100);
            $families[(string)$fam] = $score;
            $sum += $score; $count++;
        } else {
            $families[(string)$fam] = null;
        }
    }
    $global = $count ? (int)round($sum / $count) : 0;

    $id = uuid4();
    q('INSERT INTO le_diagnostics (id, user_id, piece, version, answers, scores, score_global, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        $id, $userId, $piece, max(1, min(100, (int)($in['version'] ?? 1))),
        json_encode($answers), json_encode(['global' => $global, 'families' => (object)$families]), $global, now(),
    ]);
    return get_diagnostic($userId, $id);
}

function delete_diagnostics(int $userId): void {
    q('DELETE FROM le_diagnostics WHERE user_id = ?', [$userId]);
}

/* ---------- Purge RGPD : comptes sans connexion depuis 3 ans ---------- */
function purge_inactive(): int {
    $limit = gmdate('Y-m-d H:i:s', strtotime('-' . INACTIVE_YEARS . ' years'));
    $ids = q('SELECT id FROM le_users WHERE last_login_at < ?', [$limit])->fetchAll(PDO::FETCH_COLUMN);
    foreach ($ids as $id) delete_user((int)$id);
    q('DELETE FROM le_sessions WHERE expires_at < ?', [now()]);
    q('DELETE FROM le_password_resets WHERE expires_at < ?', [now()]);
    return count($ids);
}
