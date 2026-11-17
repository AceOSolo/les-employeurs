<?php
/* ==========================================================================
   Les Employeurs · API des comptes et des diagnostics
   --------------------------------------------------------------------------
   PHP 8.1+ et MySQL 8 / MariaDB 10.5+, sans dépendance.
   À déposer sur l'hébergement OVH (ex. https://api.les-employeurs.fr/).
   Configuration : config.php (copie de config.exemple.php, hors dépôt Git).

   Toutes les routes : index.php?r=<route>, réponses en JSON.
   Authentification : en-tête « Authorization: Bearer <jeton> ».
   ========================================================================== */
declare(strict_types=1);

/* Les erreurs vont dans le journal du serveur, jamais dans les réponses */
ini_set('display_errors', '0');
ini_set('log_errors', '1');

$config = require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';

LE\init($config);

$route = (string)($_GET['r'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ("$method $route") {
        /* ---------- Comptes ---------- */
        case 'POST signup':
            $in = LE\input();
            $name = LE\clean_text($in['name'] ?? '', 80);
            $email = LE\clean_email($in['email'] ?? '');
            $password = (string)($in['password'] ?? '');
            if ($name === '') LE\fail('NAME_REQUIRED', 400);
            if (!$email) LE\fail('INVALID_EMAIL', 400);
            if (mb_strlen($password) < 8) LE\fail('PASSWORD_TOO_SHORT', 400);
            if (mb_strlen($password) > 128) LE\fail('PASSWORD_TOO_LONG', 400);
            if (($in['consent'] ?? false) !== true) LE\fail('CONSENT_REQUIRED', 400);
            LE\throttle('signup', LE\client_ip(), 10, 3600);
            if (LE\find_user_by_email($email)) LE\fail('USER_ALREADY_EXISTS', 409);
            $user = LE\create_user($name, $email, $password);
            LE\ok(['user' => LE\public_user($user), 'token' => LE\create_session((int)$user['id'])]);

        case 'POST signin':
            $in = LE\input();
            $email = LE\clean_email($in['email'] ?? '');
            $password = (string)($in['password'] ?? '');
            LE\throttle('signin', LE\client_ip() . '|' . $email, 10, 900);
            $user = $email ? LE\find_user_by_email($email) : null;
            if (!$user || !password_verify($password, $user['password_hash'])) {
                LE\fail('INVALID_EMAIL_OR_PASSWORD', 401);
            }
            LE\rehash_if_needed($user, $password);
            LE\touch_login((int)$user['id']);
            LE\ok(['user' => LE\public_user($user), 'token' => LE\create_session((int)$user['id'])]);

        case 'POST signout':
            LE\delete_current_session();
            LE\ok([]);

        case 'GET me':
            $user = LE\require_user();
            LE\ok(['user' => LE\public_user($user)]);

        case 'POST password-forgot':
            $in = LE\input();
            $email = LE\clean_email($in['email'] ?? '');
            LE\throttle('forgot', LE\client_ip(), 5, 3600);
            /* Même réponse que le compte existe ou non (pas d'énumération d'adresses) */
            if ($email && ($user = LE\find_user_by_email($email))) {
                LE\send_reset_email($user);
            }
            LE\ok([]);

        case 'POST password-reset':
            $in = LE\input();
            $password = (string)($in['password'] ?? '');
            if (mb_strlen($password) < 8) LE\fail('PASSWORD_TOO_SHORT', 400);
            if (mb_strlen($password) > 128) LE\fail('PASSWORD_TOO_LONG', 400);
            LE\throttle('reset', LE\client_ip(), 10, 3600);
            LE\reset_password((string)($in['token'] ?? ''), $password);
            LE\ok([]);

        case 'POST delete-account':
            $user = LE\require_user();
            $in = LE\input();
            LE\throttle('delete', LE\client_ip() . '|' . $user['id'], 5, 900);
            if (!password_verify((string)($in['password'] ?? ''), $user['password_hash'])) {
                LE\fail('INVALID_PASSWORD', 401);
            }
            LE\delete_user((int)$user['id']);
            LE\ok([]);

        /* ---------- Diagnostics ---------- */
        case 'GET diagnostics':
            $user = LE\require_user();
            if (isset($_GET['id'])) {
                $d = LE\get_diagnostic((int)$user['id'], (string)$_GET['id']);
                if (!$d) LE\fail('NOT_FOUND', 404);
                LE\ok(['diagnostic' => $d]);
            }
            LE\ok(['diagnostics' => LE\list_diagnostics((int)$user['id'])]);

        case 'POST diagnostics':
            $user = LE\require_user();
            LE\throttle('save', (string)$user['id'], 60, 3600);
            $d = LE\save_diagnostic((int)$user['id'], LE\input());
            LE\ok(['diagnostic' => $d], 201);

        case 'DELETE diagnostics':
            $user = LE\require_user();
            LE\delete_diagnostics((int)$user['id']);
            LE\ok([]);

        case 'OPTIONS ' . $route:
            http_response_code(204);
            exit;

        default:
            LE\fail('NOT_FOUND', 404);
    }
} catch (Throwable $e) {
    error_log('[les-employeurs api] ' . $e->getMessage());
    LE\fail('SERVER_ERROR', 500);
}
