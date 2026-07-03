<?php
/**
 * 7 Day Kitchen — installer.
 *
 * Works two ways:
 *
 *   CLI:
 *     php install.php                  guided interactive install
 *     php install.php --driver=mysql   non-interactive
 *     php install.php --driver=sqlite
 *     php install.php --check          just run the environment check
 *     php install.php --reset          drop & recreate DB (confirmation)
 *     php install.php --no-frontend    skip npm install
 *
 *   Web (browser installer):
 *     php -S 127.0.0.1:8080 install.php
 *     → open http://127.0.0.1:8080/
 *
 *   Or drop the repo on any PHP web host and visit install.php.
 *
 * CLI flags also accepted:
 *   --db-host=127.0.0.1  --db-port=3306  --db-name=sevenkc
 *   --db-user=root       --db-pass=      --frontend-url=http://localhost:5173
 *   --jwt-secret=...     --yes           --verbose
 */

declare(strict_types=1);

const ROOT = __DIR__;
const BACKEND = __DIR__ . '/backend';
const FRONTEND = __DIR__ . '/frontend';
const SENTINEL = __DIR__ . '/backend/var/.installed';

// dispatch
if (PHP_SAPI === 'cli') {
    runCli($argv);
    exit(0);
}
runWeb();

// ===========================================================================
// CLI flow
// ===========================================================================

function runCli(array $argv): void
{
    $opts = parseCliArgs($argv);
    $GLOBALS['__assume_yes'] = !empty($opts['yes']);
    $verbose = !empty($opts['verbose']);

    cliBanner();

    cliStep('Environment check');
    $report = envReport();
    foreach ($report['items'] as $i) {
        cliCheck($i['label'], $i['detail'], $i['status']);
    }

    if ($report['fatal']) {
        cliOut("\nPlease resolve the above before continuing:\n");
        foreach ($report['fatal'] as $f) cliOut("  - $f\n");
        exit(1);
    }

    if (!empty($opts['check'])) {
        cliOut("\nEnvironment looks good. Exiting (--check).\n");
        return;
    }

    // Composer
    cliStep('Composer dependencies');
    $composer = findComposer();
    if (!is_dir(BACKEND . '/vendor')) {
        if (!$composer) cliFatal('composer not found on PATH — install composer first.');
        cliOut("Installing backend dependencies (this takes 30–60s)…\n");
        cliRun($composer . ' install --no-interaction --no-progress --prefer-dist', BACKEND, $verbose);
        cliOk('composer install complete');
    } else {
        cliOk('vendor/ already present — skipping composer install');
    }

    require BACKEND . '/vendor/autoload.php';

    cliStep('Database configuration');
    $envPath = BACKEND . '/.env';
    $existingEnv = file_exists($envPath) ? parseEnvFile($envPath) : [];

    $driver = $opts['driver'] ?? ($existingEnv['DB_DRIVER'] ?? null);
    if (!$driver) {
        $driver = cliAsk('Which driver? [1] SQLite (zero-config)  [2] MySQL 8+', '1');
        $driver = ($driver === '2' || strtolower($driver) === 'mysql') ? 'mysql' : 'sqlite';
    }
    $driver = strtolower($driver);
    if (!in_array($driver, ['mysql', 'sqlite'], true)) {
        cliFatal("Unknown driver '$driver' — expected 'mysql' or 'sqlite'.");
    }
    cliOk("Driver: $driver");

    $env = defaultEnv($existingEnv);
    $env['DB_DRIVER'] = $driver;
    foreach (['db-host' => 'DB_HOST', 'db-port' => 'DB_PORT', 'db-name' => 'DB_NAME', 'db-user' => 'DB_USER', 'db-pass' => 'DB_PASS', 'frontend-url' => 'CORS_ALLOW_ORIGIN', 'jwt-secret' => 'JWT_SECRET'] as $cli => $key) {
        if (isset($opts[$cli])) $env[$key] = (string)$opts[$cli];
    }

    if ($driver === 'mysql') {
        if (!extension_loaded('pdo_mysql')) cliFatal('pdo_mysql is not loaded — enable it or use --driver=sqlite.');
        $env['DB_HOST'] = cliAsk('MySQL host', $env['DB_HOST']);
        $env['DB_PORT'] = cliAsk('MySQL port', $env['DB_PORT']);
        $env['DB_USER'] = cliAsk('MySQL user', $env['DB_USER']);
        $env['DB_PASS'] = cliAskSecret('MySQL password (blank if none)', $env['DB_PASS']);
        $env['DB_NAME'] = cliAsk('Database name', $env['DB_NAME']);
        if (!preg_match('/^[A-Za-z0-9_]+$/', $env['DB_NAME'])) {
            cliFatal('Database name may only contain letters, numbers and underscores.');
        }

        cliOut("\nTesting MySQL connection…\n");
        $test = testMysql($env);
        if (!$test['ok']) cliFatal('Could not connect to MySQL: ' . $test['message']);
        cliOk("Connected — MySQL {$test['version']}");

        if (!$test['database_exists']) {
            if ($GLOBALS['__assume_yes'] || strtolower(cliAsk("Database '{$env['DB_NAME']}' does not exist. Create it?", 'y')) === 'y') {
                $created = createMysqlDatabase($env);
                if (!$created['ok']) cliFatal($created['message']);
                cliOk("Created database {$env['DB_NAME']}.");
            } else {
                cliFatal('Cannot continue without a database.');
            }
        } else {
            cliOk("Database {$env['DB_NAME']} exists.");
        }
        if (!empty($opts['reset'])) {
            if ($GLOBALS['__assume_yes'] || strtolower(cliAsk('Reset will DROP the database and recreate it. Continue?', 'n')) === 'y') {
                resetMysqlDatabase($env);
                cliWarn('Database reset.');
            }
        }
    } else {
        if (!extension_loaded('pdo_sqlite')) cliFatal('pdo_sqlite is not loaded. Enable it or use --driver=mysql.');
        $sqlitePath = BACKEND . '/' . $env['DB_SQLITE_PATH'];
        if (!is_dir(dirname($sqlitePath))) @mkdir(dirname($sqlitePath), 0775, true);
        if (!empty($opts['reset']) && file_exists($sqlitePath)) {
            if ($GLOBALS['__assume_yes'] || strtolower(cliAsk("Reset will delete $sqlitePath. Continue?", 'n')) === 'y') {
                deleteSqliteDatabase($sqlitePath);
                cliWarn('Deleted existing SQLite database.');
            }
        }
        cliOk('Using SQLite at ' . str_replace('\\', '/', $env['DB_SQLITE_PATH']));
    }

    writeEnvFile($envPath, $env);
    cliOk('Wrote backend/.env');

    cliStep('Database schema + seed data');
    $result = runMigrationsAndSeed();
    if (!$result['ok']) {
        if (!empty($result['output'])) cliOut("\n" . $result['output'] . "\n");
        cliFatal('migration failed: ' . $result['message']);
    }
    if ($verbose && !empty($result['output'])) cliOut($result['output'] . "\n");
    cliOk('Migrations applied');
    cliOk('Seed data loaded');

    markInstalled($env['DB_DRIVER']);

    if (empty($opts['no-frontend'])) {
        $npm = findBinary('npm');
        if ($npm) {
            cliStep('Frontend (npm install)');
            $frontendEnvPath = FRONTEND . '/.env';
            if (!file_exists($frontendEnvPath)) {
                file_put_contents($frontendEnvPath, "VITE_API_URL=http://localhost:8000/api/v1\nVITE_API_PROXY=http://localhost:8000\n");
                cliOk('Wrote frontend/.env');
            }
            if (!is_dir(FRONTEND . '/node_modules')) {
                cliRun(escapeshellarg($npm) . ' install --no-audit --no-fund', FRONTEND, $verbose);
                cliOk('Frontend dependencies installed');
            } else {
                cliOk('node_modules/ already present — skipping npm install');
            }
        } else {
            cliWarn('npm not found — skipping frontend install. Install Node.js, then run `cd frontend && npm install`.');
        }
    }

    cliStep('All set');
    cliOut(cliColor("\nStart the backend:\n", 'dim') . "  cd backend && composer serve\n");
    cliOut(cliColor("\nStart the frontend (new terminal):\n", 'dim') . "  cd frontend && npm run dev\n");
    cliOut(cliColor("\nOpen:\n", 'dim') . "  http://localhost:5173\n\n");
    if ($env['DB_DRIVER'] === 'mysql') {
        cliOut(cliColor('MySQL: ', 'dim') . "{$env['DB_USER']}@{$env['DB_HOST']}:{$env['DB_PORT']}/{$env['DB_NAME']}\n");
    } else {
        cliOut(cliColor('SQLite file: ', 'dim') . BACKEND . '/' . $env['DB_SQLITE_PATH'] . "\n");
    }
    cliOut(cliColor('JWT secret: ', 'dim') . substr($env['JWT_SECRET'], 0, 12) . "… (saved in backend/.env)\n");
}

// ===========================================================================
// Web flow
// ===========================================================================

function runWeb(): void
{
    webGuardRemote();

    $action = $_POST['action'] ?? $_GET['action'] ?? null;
    $wantsJson = $action !== null;

    try {
        if ($wantsJson) {
            if ($_SERVER['REQUEST_METHOD'] === 'POST') webGuardOrigin();
            header('Content-Type: application/json');
            switch ($action) {
                case 'check':
                    webJson(webCheck());
                    break;
                case 'test-db':
                    webJson(webTestDb());
                    break;
                case 'install':
                    webJson(webInstall());
                    break;
                case 'status':
                    webJson(webStatus());
                    break;
                default:
                    http_response_code(400);
                    webJson(['error' => 'unknown_action']);
            }
            return;
        }
        webRenderPage();
    } catch (Throwable $e) {
        if ($wantsJson) {
            http_response_code(500);
            webJson(['error' => 'exception', 'message' => $e->getMessage()]);
        } else {
            echo '<pre>' . htmlspecialchars($e->getMessage() . "\n" . $e->getTraceAsString()) . '</pre>';
        }
    }
}

function webGuardRemote(): void
{
    if (!empty($_ENV['INSTALL_ALLOW_REMOTE']) || getenv('INSTALL_ALLOW_REMOTE')) return;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (str_starts_with($ip, '::ffff:')) $ip = substr($ip, 7); // IPv4-mapped IPv6
    $allow = ['127.0.0.1', '::1', '0.0.0.0'];
    $isPrivate = str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')
        || (preg_match('/^172\.(\d{1,3})\./', $ip, $m) && (int)$m[1] >= 16 && (int)$m[1] <= 31);
    if ($ip !== '' && !in_array($ip, $allow, true) && !$isPrivate) {
        http_response_code(403);
        echo 'The web installer is restricted to local network addresses. Set INSTALL_ALLOW_REMOTE=1 in the environment to override.';
        exit;
    }
}

/**
 * Reject cross-origin POSTs. A drive-by page can fire form-encoded POSTs at a
 * localhost installer (webPayload() accepts $_POST), so any browser-sent
 * Origin/Referer must match the Host we're being served on. Requests without
 * either header (curl, same-origin fetches in older browsers) pass.
 */
function webGuardOrigin(): void
{
    $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($source === '') return;
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    $parts = parse_url($source);
    $srcHost = strtolower((string)($parts['host'] ?? ''));
    $srcPort = $parts['port'] ?? (($parts['scheme'] ?? 'http') === 'https' ? 443 : 80);
    $expected = $srcHost . (in_array($srcPort, [80, 443], true) && !str_contains($host, ':') ? '' : ":$srcPort");
    if ($host !== '' && $srcHost !== '' && $expected !== $host) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'cross_origin_rejected', 'message' => 'Cross-origin requests to the installer are not allowed.']);
        exit;
    }
}

function webJson(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function webCheck(): array
{
    $report = envReport();
    return [
        'ok' => empty($report['fatal']),
        'items' => $report['items'],
        'fatal' => $report['fatal'],
        'vendor_installed' => is_dir(BACKEND . '/vendor'),
        'already_installed' => isAlreadyInstalled(),
        'installed_at' => installedAt(),
    ];
}

function webTestDb(): array
{
    $payload = webPayload();
    $driver = $payload['driver'] ?? 'sqlite';

    if ($driver === 'sqlite') {
        if (!extension_loaded('pdo_sqlite')) {
            return ['ok' => false, 'message' => 'pdo_sqlite is not loaded on this PHP install.'];
        }
        $rel = (string)($payload['sqlite_path'] ?? 'var/sevenkc.sqlite');
        if (!isSafeSqlitePath($rel)) {
            return ['ok' => false, 'message' => 'SQLite path must be a simple relative path inside backend/ (no .., no absolute paths).'];
        }
        $path = BACKEND . '/' . $rel;
        $dir = dirname($path);
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        if (!is_writable($dir)) {
            return ['ok' => false, 'message' => "Directory $dir is not writable."];
        }
        return ['ok' => true, 'message' => 'SQLite path is writable.', 'path' => str_replace('\\', '/', $path)];
    }

    if (!extension_loaded('pdo_mysql')) {
        return ['ok' => false, 'message' => 'pdo_mysql is not loaded on this PHP install.'];
    }

    $env = [
        'DB_HOST' => $payload['host'] ?? '127.0.0.1',
        'DB_PORT' => (string)($payload['port'] ?? '3306'),
        'DB_USER' => $payload['user'] ?? 'root',
        'DB_PASS' => (string)($payload['pass'] ?? ''),
        'DB_NAME' => $payload['name'] ?? 'sevenkc',
    ];
    return testMysql($env);
}

function webInstall(): array
{
    // Two phinx children (migrate + full-catalogue seed) run inside this
    // request; on Windows web servers max_execution_time counts the wall-clock
    // time spent blocked on them, and a killed request would leave the DB
    // half-installed with no sentinel.
    @set_time_limit(0);
    ignore_user_abort(true);

    $payload = webPayload();
    $driver = strtolower((string)($payload['driver'] ?? 'sqlite'));
    if (!in_array($driver, ['sqlite', 'mysql'], true)) {
        return ['ok' => false, 'message' => 'Invalid driver'];
    }

    // The "Allow reinstall" checkbox must be enforced HERE, not just in the
    // page's JS — a direct POST would otherwise clobber .env and the DB.
    if (isAlreadyInstalled() && empty($payload['force'])) {
        return [
            'ok' => false,
            'step' => 'guard',
            'message' => 'Already installed — tick "Allow reinstall" to overwrite backend/.env and re-run migrations.',
        ];
    }

    if (!is_dir(BACKEND . '/vendor')) {
        return [
            'ok' => false,
            'message' => 'Composer dependencies are missing. Run `cd backend && composer install` on the server first.',
        ];
    }

    require_once BACKEND . '/vendor/autoload.php';

    // compose .env
    $envPath = BACKEND . '/.env';
    $existing = file_exists($envPath) ? parseEnvFile($envPath) : [];
    $env = defaultEnv($existing);
    $env['DB_DRIVER'] = $driver;
    if (!empty($payload['frontend_url'])) $env['CORS_ALLOW_ORIGIN'] = $payload['frontend_url'];

    if ($driver === 'mysql') {
        $env['DB_HOST'] = $payload['host'] ?? $env['DB_HOST'];
        $env['DB_PORT'] = (string)($payload['port'] ?? $env['DB_PORT']);
        $env['DB_USER'] = $payload['user'] ?? $env['DB_USER'];
        $env['DB_PASS'] = (string)($payload['pass'] ?? $env['DB_PASS']);
        $env['DB_NAME'] = $payload['name'] ?? $env['DB_NAME'];
        if (!preg_match('/^[A-Za-z0-9_]+$/', $env['DB_NAME'])) {
            return ['ok' => false, 'step' => 'validate', 'message' => 'Database name may only contain letters, numbers and underscores.'];
        }

        $test = testMysql($env);
        if (!$test['ok']) return ['ok' => false, 'step' => 'connect', 'message' => $test['message']];

        if (!$test['database_exists']) {
            $created = createMysqlDatabase($env);
            if (!$created['ok']) return ['ok' => false, 'step' => 'create_db', 'message' => $created['message']];
        }

        if (!empty($payload['reset']) && $test['database_exists']) {
            resetMysqlDatabase($env);
        }
    } else {
        $env['DB_SQLITE_PATH'] = $payload['sqlite_path'] ?? $env['DB_SQLITE_PATH'];
        if (!isSafeSqlitePath((string)$env['DB_SQLITE_PATH'])) {
            return ['ok' => false, 'step' => 'validate', 'message' => 'SQLite path must be a simple relative path inside backend/ (no .., no absolute paths).'];
        }
        $path = BACKEND . '/' . $env['DB_SQLITE_PATH'];
        if (!is_dir(dirname($path))) @mkdir(dirname($path), 0775, true);
        if (!empty($payload['reset']) && file_exists($path)) deleteSqliteDatabase($path);
    }

    writeEnvFile($envPath, $env);

    $result = runMigrationsAndSeed();
    if (!$result['ok']) {
        return ['ok' => false, 'step' => 'migrate', 'message' => $result['message'], 'output' => $result['output'] ?? ''];
    }

    markInstalled($driver);

    return [
        'ok' => true,
        'driver' => $driver,
        'env_path' => $envPath,
        'migrate_output' => $result['output'] ?? '',
        'next' => [
            'backend' => 'cd backend && composer serve    # http://localhost:8000',
            'frontend' => 'cd frontend && npm run dev      # http://localhost:5173',
            'app_url' => $env['CORS_ALLOW_ORIGIN'],
        ],
    ];
}

function webStatus(): array
{
    return [
        'already_installed' => isAlreadyInstalled(),
        'sentinel_exists' => file_exists(SENTINEL),
        'env_exists' => file_exists(BACKEND . '/.env'),
        'vendor_exists' => is_dir(BACKEND . '/vendor'),
    ];
}

function webPayload(): array
{
    $raw = file_get_contents('php://input');
    if ($raw) {
        $data = json_decode($raw, true);
        if (is_array($data)) return $data;
    }
    return $_POST;
}

function webRenderPage(): void
{
    $check = webCheck();
    $already = isAlreadyInstalled();
    $vendorPresent = $check['vendor_installed'];

    $envReport = json_encode($check, JSON_HEX_TAG | JSON_HEX_AMP);
    $title = '7KC installer';
    $recipes = json_decode((string)@file_get_contents(ROOT . '/shared/recipes.json'), true);
    $recipeCount = is_array($recipes) ? count($recipes) : 0;
    $recipeCopy = $recipeCount > 0 ? "the ingredient dictionary + $recipeCount recipes" : 'the ingredient dictionary + recipe catalogue';

    ?><!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($title) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --cream: oklch(0.975 0.012 85);
  --cream-2: oklch(0.955 0.018 82);
  --paper: oklch(0.99 0.008 85);
  --ink: oklch(0.22 0.015 60);
  --ink-2: oklch(0.38 0.018 60);
  --muted: oklch(0.58 0.015 60);
  --line: oklch(0.88 0.015 75);
  --line-2: oklch(0.93 0.012 75);
  --accent: oklch(0.62 0.14 40);
  --accent-2: oklch(0.92 0.045 45);
  --accent-ink: oklch(0.35 0.12 40);
  --sage: oklch(0.52 0.07 145);
  --sage-2: oklch(0.92 0.035 145);
  --amber: oklch(0.75 0.13 75);
  --amber-2: oklch(0.94 0.055 85);
  --amber-ink: oklch(0.46 0.13 65);
  --danger: oklch(0.58 0.17 25);
  --danger-2: oklch(0.93 0.055 25);
  --serif: 'Instrument Serif', Georgia, serif;
  --sans: 'IBM Plex Sans', -apple-system, system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: var(--cream); color: var(--ink); font-family: var(--sans); font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; min-height: 100vh; }
h1, h2, h3 { font-family: var(--serif); font-weight: 400; margin: 0; letter-spacing: -0.01em; }
h1 { font-size: 38px; line-height: 1.05; }
h2 { font-size: 22px; }
h3 { font-size: 16px; color: var(--ink-2); }
p { margin: 0; }
.mono { font-family: var(--mono); font-size: 0.85em; }
.small { font-size: 12px; }
.muted { color: var(--muted); }
button, input, select { font: inherit; color: inherit; }
a { color: var(--accent-ink); }

.shell { max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.brand-mark svg { display: block; }
.brand-name { font-family: var(--serif); font-size: 24px; line-height: 1; }
.brand-tag { color: var(--muted); margin-top: 3px; font-family: var(--mono); font-size: 12px; }

.intro { margin-bottom: 24px; }
.intro h1 { margin-bottom: 8px; }
.intro p { color: var(--ink-2); }

.card { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 22px 24px; margin-bottom: 18px; }
.card h2 { margin-bottom: 4px; }
.card .step-num { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }

.checklist { list-style: none; margin: 16px 0 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 6px; }
.checklist li { display: grid; grid-template-columns: 24px 1fr auto; gap: 10px; padding: 8px 10px; border-radius: 8px; background: var(--cream); align-items: baseline; }
.checklist li .mark { font-family: var(--mono); font-weight: 600; font-size: 14px; }
.checklist li.ok { background: color-mix(in oklch, var(--sage-2) 70%, var(--paper)); }
.checklist li.ok .mark { color: var(--sage); }
.checklist li.warn { background: var(--amber-2); }
.checklist li.warn .mark { color: var(--amber-ink); }
.checklist li.err { background: var(--danger-2); }
.checklist li.err .mark { color: var(--danger); }
.checklist li .detail { color: var(--muted); font-family: var(--mono); font-size: 12px; }

.segmented { display: inline-flex; background: var(--cream-2); border-radius: 999px; padding: 3px; border: 1px solid var(--line); }
.segmented button { padding: 6px 14px; font-size: 13px; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--ink-2); }
.segmented button.active { background: var(--paper); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.04); font-weight: 500; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 18px; margin-top: 14px; }
.form-grid .full { grid-column: 1 / -1; }
.field label { font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); display: block; margin-bottom: 4px; }
.field input { width: 100%; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; outline: 0; font-family: var(--mono); font-size: 13.5px; }
.field input:focus { border-color: var(--accent); }

.actions { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; align-items: center; }
.btn { border: 0; cursor: pointer; padding: 9px 16px; border-radius: 999px; font-weight: 500; font-size: 13.5px; display: inline-flex; gap: 6px; align-items: center; transition: all 0.15s; }
.btn-primary { background: var(--accent); color: var(--paper); }
.btn-primary:hover { filter: brightness(0.94); }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid var(--line); color: var(--ink-2); }
.btn-ghost:hover { background: var(--cream-2); color: var(--ink); }

.status { padding: 10px 14px; border-radius: 8px; font-size: 13.5px; margin-top: 12px; font-family: var(--mono); }
.status.ok { background: var(--sage-2); color: var(--sage); }
.status.err { background: var(--danger-2); color: var(--danger); }
.status.warn { background: var(--amber-2); color: var(--amber-ink); }
.status.running { background: var(--cream-2); color: var(--ink-2); display: flex; align-items: center; gap: 10px; }
.spinner { width: 14px; height: 14px; border: 2px solid var(--line); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.done-card { background: linear-gradient(135deg, var(--sage-2) 0%, var(--amber-2) 100%); border-radius: 14px; padding: 28px; text-align: center; margin-top: 24px; }
.done-card h2 { font-size: 32px; margin-bottom: 8px; }
.done-card .principle { margin-top: 16px; font-family: var(--mono); font-size: 12px; color: var(--ink-2); }
.done-card code { background: var(--paper); padding: 3px 8px; border-radius: 6px; font-size: 12.5px; }

.already { background: var(--amber-2); color: var(--amber-ink); padding: 14px 18px; border-radius: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13.5px; flex-wrap: wrap; }

.hidden { display: none !important; }
pre.log { background: var(--ink); color: var(--cream); padding: 14px 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; max-height: 260px; }

@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } h1 { font-size: 30px; } }
</style>
</head>
<body>
<div class="shell">
  <div class="brand">
    <div class="brand-mark">
      <svg viewBox="0 0 28 28" width="32" height="32" aria-hidden><rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)"/><text x="14" y="19" text-anchor="middle" font-family="var(--serif)" font-size="14" fill="var(--cream)">7</text></svg>
    </div>
    <div><div class="brand-name">7 Day Kitchen</div><div class="brand-tag">installer</div></div>
  </div>

  <div class="intro">
    <h1>Set up your kitchen.</h1>
    <p class="muted">This'll check your environment, configure your database, and seed the recipe library. Three clicks.</p>
  </div>

  <?php if ($already): ?>
  <div class="already">
    <div>
      <b>Already installed</b> — re-running will overwrite <code>backend/.env</code> and can reset your database.
    </div>
    <label class="mono" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="forceReinstall"> Allow reinstall</label>
  </div>
  <?php endif; ?>

  <?php if (!$vendorPresent): ?>
  <div class="already">
    <b>Composer dependencies missing.</b> Run <code>cd backend && composer install</code> on the server first, then refresh.
  </div>
  <?php endif; ?>

  <section class="card">
    <div class="step-num">Step 1</div>
    <h2>Environment check</h2>
    <p class="muted small">All greens means you're good to go.</p>
    <ul class="checklist" id="envList"></ul>
  </section>

  <section class="card">
    <div class="step-num">Step 2</div>
    <h2>Database</h2>
    <p class="muted small">SQLite works out of the box — zero config. Pick MySQL for multi-user deployments.</p>
    <div style="margin-top:14px">
      <div class="segmented" role="tablist">
        <button type="button" id="drvSqlite" class="active">SQLite (zero-config)</button>
        <button type="button" id="drvMysql">MySQL 8+</button>
      </div>
    </div>
    <div id="sqliteForm" class="form-grid">
      <div class="field full">
        <label>SQLite file path</label>
        <input id="sqlitePath" value="var/sevenkc.sqlite">
      </div>
    </div>
    <div id="mysqlForm" class="form-grid hidden">
      <div class="field"><label>Host</label><input id="mysqlHost" value="127.0.0.1"></div>
      <div class="field"><label>Port</label><input id="mysqlPort" value="3306"></div>
      <div class="field"><label>Database name</label><input id="mysqlName" value="sevenkc"></div>
      <div class="field"><label>User</label><input id="mysqlUser" value="root"></div>
      <div class="field full"><label>Password (blank if none)</label><input id="mysqlPass" type="password" value=""></div>
    </div>
    <div class="actions">
      <button class="btn btn-ghost" id="btnTest" type="button">Test connection</button>
      <span id="testStatus" class="muted small"></span>
    </div>
  </section>

  <section class="card">
    <div class="step-num">Step 3</div>
    <h2>Install</h2>
    <p class="muted small">Runs migrations, seeds <?= htmlspecialchars($recipeCopy) ?>, writes <code>backend/.env</code> with a fresh JWT secret.</p>
    <div class="form-grid" style="margin-top:6px">
      <div class="field full">
        <label>Frontend URL (for CORS)</label>
        <input id="frontendUrl" value="http://localhost:5173">
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="btnInstall" type="button">Install now</button>
      <label class="mono small muted" style="display:inline-flex;gap:6px;align-items:center;">
        <input type="checkbox" id="resetOpt"> Reset database if it exists
      </label>
    </div>
    <div id="installStatus"></div>
    <pre id="installLog" class="log hidden"></pre>
  </section>

  <div id="doneCard" class="done-card hidden">
    <h2>You're all set.</h2>
    <p class="muted">Start the servers and open the app.</p>
    <p style="margin-top:14px"><code>cd backend && composer serve</code></p>
    <p><code>cd frontend && npm run dev</code></p>
    <p style="margin-top:14px"><a id="openApp" class="btn btn-primary" href="http://localhost:5173" target="_blank">Open the app →</a></p>
    <div class="principle">Use what you've got. Eat what you love. Waste nothing.</div>
  </div>
</div>

<script>
const bootstrap = <?= $envReport ?>;

const $ = (id) => document.getElementById(id);
let driver = 'sqlite';
let envOk = bootstrap.ok;
let vendorOk = bootstrap.vendor_installed;
let alreadyInstalled = <?= $already ? 'true' : 'false' ?>;

function renderEnv(items) {
  const list = $('envList');
  list.innerHTML = '';
  for (const it of items) {
    const cls = it.status === 'ok' ? 'ok' : it.status === 'warn' ? 'warn' : 'err';
    const mark = it.status === 'ok' ? '✓' : it.status === 'warn' ? '!' : '✗';
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = '<span class="mark">' + mark + '</span><span>' + escapeHtml(it.label) + '</span><span class="detail">' + escapeHtml(it.detail) + '</span>';
    list.appendChild(li);
  }
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

renderEnv(bootstrap.items);

$('drvSqlite').addEventListener('click', () => { driver = 'sqlite'; $('drvSqlite').classList.add('active'); $('drvMysql').classList.remove('active'); $('sqliteForm').classList.remove('hidden'); $('mysqlForm').classList.add('hidden'); $('testStatus').textContent = ''; });
$('drvMysql').addEventListener('click', () => { driver = 'mysql'; $('drvMysql').classList.add('active'); $('drvSqlite').classList.remove('active'); $('mysqlForm').classList.remove('hidden'); $('sqliteForm').classList.add('hidden'); $('testStatus').textContent = ''; });

function collect() {
  const body = { driver };
  if (driver === 'sqlite') body.sqlite_path = $('sqlitePath').value.trim() || 'var/sevenkc.sqlite';
  else {
    body.host = $('mysqlHost').value.trim();
    body.port = $('mysqlPort').value.trim();
    body.name = $('mysqlName').value.trim();
    body.user = $('mysqlUser').value.trim();
    body.pass = $('mysqlPass').value;
  }
  body.frontend_url = $('frontendUrl').value.trim();
  body.reset = $('resetOpt').checked;
  body.force = !!document.getElementById('forceReinstall')?.checked;
  return body;
}

async function post(action, body) {
  const r = await fetch('?action=' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return r.json();
}

$('btnTest').addEventListener('click', async () => {
  const status = $('testStatus');
  status.className = 'muted small';
  status.textContent = 'testing…';
  try {
    const r = await post('test-db', collect());
    if (r.ok) {
      status.className = 'status ok';
      if (driver === 'mysql') {
        let msg = 'Connected to MySQL ' + (r.version || '');
        if (r.database_exists === false) msg += ' — database will be created on install.';
        else msg += ' — database found.';
        status.textContent = msg;
      } else {
        status.textContent = r.message || 'SQLite path is writable.';
      }
    } else {
      status.className = 'status err';
      status.textContent = r.message || 'Connection failed.';
    }
  } catch (e) {
    status.className = 'status err';
    status.textContent = 'Network error: ' + e.message;
  }
});

$('btnInstall').addEventListener('click', async () => {
  if (!envOk) return setStatus('Fix the environment errors first.', 'err');
  if (!vendorOk) return setStatus('Composer dependencies are missing. Run `composer install` in backend/ first.', 'err');
  if (alreadyInstalled && !document.getElementById('forceReinstall')?.checked) {
    return setStatus('Already installed — tick "Allow reinstall" above to continue.', 'warn');
  }
  setStatus('Writing .env, running migrations, seeding recipes…', 'running', true);
  $('btnInstall').disabled = true;
  $('installLog').classList.add('hidden');

  try {
    const r = await post('install', collect());
    if (r.ok) {
      setStatus('Install complete.', 'ok');
      $('doneCard').classList.remove('hidden');
      if (r.next?.app_url) $('openApp').href = r.next.app_url;
      if (r.migrate_output) { $('installLog').textContent = r.migrate_output; $('installLog').classList.remove('hidden'); }
    } else {
      const where = r.step ? ' (' + r.step + ')' : '';
      setStatus('Install failed' + where + ': ' + (r.message || 'unknown error'), 'err');
      if (r.output) { $('installLog').textContent = r.output; $('installLog').classList.remove('hidden'); }
    }
  } catch (e) {
    setStatus('Network error: ' + e.message, 'err');
  } finally {
    $('btnInstall').disabled = false;
  }
});

function setStatus(text, tone, spinner) {
  const el = $('installStatus');
  el.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'status ' + tone;
  if (spinner) { const s = document.createElement('span'); s.className = 'spinner'; box.appendChild(s); }
  box.appendChild(document.createTextNode(text));
  el.appendChild(box);
}
</script>
</body>
</html>
    <?php
}

// ===========================================================================
// Shared logic (used by both CLI and web)
// ===========================================================================

function envReport(): array
{
    $items = [];
    $fatal = [];

    $phpOk = version_compare(PHP_VERSION, '8.2.0', '>=');
    $items[] = ['label' => 'PHP >= 8.2', 'detail' => 'PHP ' . PHP_VERSION, 'status' => $phpOk ? 'ok' : 'err'];
    if (!$phpOk) $fatal[] = 'PHP 8.2 or newer is required.';

    foreach (['pdo', 'json', 'mbstring', 'openssl'] as $e) {
        $has = extension_loaded($e);
        $items[] = ['label' => "ext-$e", 'detail' => $has ? 'loaded' : 'MISSING (required)', 'status' => $has ? 'ok' : 'err'];
        if (!$has) $fatal[] = "Install/enable PHP extension $e.";
    }
    foreach (['pdo_mysql' => 'for MySQL support', 'pdo_sqlite' => 'for SQLite support', 'curl' => 'for affiliate links'] as $e => $why) {
        $has = extension_loaded($e);
        $items[] = ['label' => "ext-$e", 'detail' => $has ? 'loaded' : "not loaded ($why)", 'status' => $has ? 'ok' : 'warn'];
    }

    if (PHP_SAPI === 'cli') {
        $composer = findComposer();
        $items[] = ['label' => 'composer', 'detail' => $composer ?: 'not found (run `composer install` manually)', 'status' => $composer ? 'ok' : 'warn'];
        $node = findBinary('node');
        $npm = findBinary('npm');
        $nodeVersion = $node ? trim((string)@shell_exec(escapeshellarg($node) . ' --version 2>&1')) : '';
        $npmVersion = $npm ? trim((string)@shell_exec(escapeshellarg($npm) . ' --version 2>&1')) : '';
        $items[] = ['label' => 'node', 'detail' => $node ? ($nodeVersion ?: $node) : 'not found', 'status' => $node ? 'ok' : 'warn'];
        $items[] = ['label' => 'npm', 'detail' => $npm ? ($npmVersion ?: $npm) : 'not found', 'status' => $npm ? 'ok' : 'warn'];
    }

    $varDir = BACKEND . '/var';
    if (!is_dir($varDir)) @mkdir($varDir, 0775, true);
    $varOk = is_writable($varDir);
    $items[] = ['label' => 'backend/var writable', 'detail' => $varOk ? 'ok' : 'not writable', 'status' => $varOk ? 'ok' : 'err'];
    if (!$varOk) $fatal[] = 'Make backend/var writable.';

    $sharedOk = file_exists(ROOT . '/shared/ingredients.json');
    $items[] = ['label' => 'shared dictionaries', 'detail' => $sharedOk ? 'present' : 'missing', 'status' => $sharedOk ? 'ok' : 'err'];
    if (!$sharedOk) $fatal[] = 'shared/ingredients.json is missing — run from repo root.';

    return ['items' => $items, 'fatal' => $fatal];
}

function defaultEnv(array $existing): array
{
    $env = [
        'APP_ENV' => $existing['APP_ENV'] ?? 'development',
        'APP_DEBUG' => $existing['APP_DEBUG'] ?? 'true',
        'DB_DRIVER' => $existing['DB_DRIVER'] ?? 'sqlite',
        'DB_SQLITE_PATH' => $existing['DB_SQLITE_PATH'] ?? 'var/sevenkc.sqlite',
        'DB_HOST' => $existing['DB_HOST'] ?? '127.0.0.1',
        'DB_PORT' => $existing['DB_PORT'] ?? '3306',
        'DB_NAME' => $existing['DB_NAME'] ?? 'sevenkc',
        'DB_USER' => $existing['DB_USER'] ?? 'root',
        'DB_PASS' => $existing['DB_PASS'] ?? '',
        'JWT_SECRET' => $existing['JWT_SECRET'] ?? randomSecret(),
        'JWT_TTL_HOURS' => $existing['JWT_TTL_HOURS'] ?? '168',
        'CORS_ALLOW_ORIGIN' => $existing['CORS_ALLOW_ORIGIN'] ?? 'http://localhost:5173',
    ];
    // Carry through any operator-added settings (AI_SCAN_*, mail, analytics…)
    // so a reinstall never silently drops them from .env.
    foreach ($existing as $k => $v) {
        if (!array_key_exists($k, $env)) $env[$k] = $v;
    }
    return $env;
}

function testMysql(array $env): array
{
    try {
        $pdo = new PDO(
            "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};charset=utf8mb4",
            $env['DB_USER'],
            $env['DB_PASS'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
        );
    } catch (Throwable $e) {
        return ['ok' => false, 'message' => $e->getMessage()];
    }
    $version = (string)$pdo->query('SELECT VERSION()')->fetchColumn();
    $dbExists = (bool)$pdo->query('SHOW DATABASES LIKE ' . $pdo->quote($env['DB_NAME']))->fetch();
    return [
        'ok' => true,
        'version' => $version,
        'database_exists' => $dbExists,
        'message' => "Connected to MySQL $version" . ($dbExists ? " · database {$env['DB_NAME']} found" : " · database will be created"),
    ];
}

function createMysqlDatabase(array $env): array
{
    try {
        $pdo = new PDO(
            "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']}",
            $env['DB_USER'],
            $env['DB_PASS'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $name = preg_replace('/[^A-Za-z0-9_]/', '', $env['DB_NAME']);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        return ['ok' => true];
    } catch (Throwable $e) {
        return ['ok' => false, 'message' => $e->getMessage()];
    }
}

function resetMysqlDatabase(array $env): void
{
    $pdo = new PDO(
        "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']}",
        $env['DB_USER'],
        $env['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $name = preg_replace('/[^A-Za-z0-9_]/', '', $env['DB_NAME']);
    $pdo->exec("DROP DATABASE IF EXISTS `$name`");
    $pdo->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

function runMigrationsAndSeed(): array
{
    $phinx = phinxCommand();
    if (!$phinx) return ['ok' => false, 'message' => 'phinx binary missing — run `composer install` first.'];

    $cfg = BACKEND . '/config/phinx.php';

    $migrateCmd = $phinx . ' migrate -c ' . escapeshellarg($cfg);
    [$ok1, $out1] = captureRun($migrateCmd, BACKEND);
    if (!$ok1) return ['ok' => false, 'message' => 'migrate failed', 'output' => $out1];

    $seedCmd = $phinx . ' seed:run -c ' . escapeshellarg($cfg);
    [$ok2, $out2] = captureRun($seedCmd, BACKEND);
    if (!$ok2) return ['ok' => false, 'message' => 'seed failed', 'output' => $out1 . "\n" . $out2];

    return ['ok' => true, 'output' => $out1 . "\n" . $out2];
}

/**
 * Runnable phinx command prefix. Composer's vendor/bin/phinx is a PHP proxy
 * script — cmd.exe cannot execute it directly (only the .bat shim, which in
 * turn needs `php` on PATH, which XAMPP setups often lack). Running it through
 * the PHP binary that's executing this installer works everywhere the
 * installer is supported (CLI and `php -S`); mod_php/FPM hosts fall back to
 * `php` on PATH, then the OS-native launcher.
 */
function phinxCommand(): ?string
{
    $proxy = BACKEND . '/vendor/bin/phinx';
    if (!file_exists($proxy)) return null;

    $php = PHP_BINARY;
    $base = strtolower(basename($php));
    $isCliPhp = str_starts_with($base, 'php') && !str_contains($base, 'fpm') && !str_contains($base, 'cgi');
    if (!$isCliPhp) $php = findBinary('php');
    if ($php) return escapeshellarg($php) . ' ' . escapeshellarg($proxy);

    if (DIRECTORY_SEPARATOR === '\\') {
        $bat = $proxy . '.bat';
        return file_exists($bat) ? escapeshellarg($bat) : null;
    }
    return escapeshellarg($proxy);
}

/**
 * A web-supplied SQLite path must stay inside backend/: relative, no `..`
 * segments, no absolute/drive-letter/UNC forms — otherwise a POST could
 * delete (reset) or create files anywhere the PHP user can write.
 */
function isSafeSqlitePath(string $rel): bool
{
    if ($rel === '' || str_starts_with($rel, '/') || str_starts_with($rel, '\\')) return false;
    if (preg_match('/^[A-Za-z]:/', $rel)) return false;
    if (!preg_match('#^[A-Za-z0-9._/\\\\-]+$#', $rel)) return false;
    foreach (preg_split('#[/\\\\]#', $rel) as $seg) {
        if ($seg === '' || $seg === '.' || $seg === '..') return false;
    }
    return true;
}

/** Remove an SQLite database including its WAL/journal sidecar files. */
function deleteSqliteDatabase(string $path): void
{
    foreach (['', '-wal', '-shm', '-journal'] as $suffix) {
        if (file_exists($path . $suffix)) @unlink($path . $suffix);
    }
}

function captureRun(string $cmd, string $cwd): array
{
    // stderr is merged into stdout at the descriptor level. Draining two pipes
    // sequentially deadlocks: Composer writes nearly everything to stderr, and
    // once the OS pipe buffer fills (4 KB on Windows) the child blocks writing
    // while we block reading the other pipe.
    $desc = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['redirect', 1]];
    $proc = proc_open($cmd, $desc, $pipes, $cwd);
    if (!is_resource($proc)) return [false, "could not start: $cmd"];
    fclose($pipes[0]);
    $output = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $code = proc_close($proc);
    return [$code === 0, stripAnsi((string)$output)];
}

function stripAnsi(string $s): string
{
    return (string)preg_replace('/\033\[[0-9;]*m/', '', $s);
}

function isAlreadyInstalled(): bool
{
    if (!file_exists(BACKEND . '/.env')) return false;
    if (!file_exists(SENTINEL)) return false;
    return true;
}

function installedAt(): ?int
{
    if (!file_exists(SENTINEL)) return null;
    $meta = json_decode((string)@file_get_contents(SENTINEL), true);
    return is_array($meta) && isset($meta['installed_at']) ? (int)$meta['installed_at'] : null;
}

function markInstalled(string $driver): void
{
    $dir = dirname(SENTINEL);
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    @file_put_contents(SENTINEL, json_encode(['installed_at' => time(), 'driver' => $driver]));
}

function randomSecret(int $bytes = 40): string
{
    return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}

function parseCliArgs(array $argv): array
{
    $out = [];
    foreach (array_slice($argv, 1) as $arg) {
        if (!str_starts_with($arg, '--')) continue;
        $eq = strpos($arg, '=');
        if ($eq !== false) {
            $out[substr($arg, 2, $eq - 2)] = substr($arg, $eq + 1);
        } else {
            $out[substr($arg, 2)] = true;
        }
    }
    return $out;
}

function parseEnvFile(string $path): array
{
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $out = [];
    foreach ($lines as $l) {
        if ($l === '' || str_starts_with(ltrim($l), '#')) continue;
        $eq = strpos($l, '=');
        if ($eq === false) continue;
        $v = trim(substr($l, $eq + 1));
        // Undo exactly what writeEnvFile does for quoted values, otherwise
        // every reinstall stacks another layer of backslashes.
        if (strlen($v) >= 2 && $v[0] === '"' && str_ends_with($v, '"')) {
            $v = preg_replace('/\\\\(["\\\\])/', '$1', substr($v, 1, -1));
        }
        $out[trim(substr($l, 0, $eq))] = $v;
    }
    return $out;
}

function writeEnvFile(string $path, array $env): void
{
    $order = [
        'APP_ENV', 'APP_DEBUG', '',
        'DB_DRIVER', 'DB_SQLITE_PATH', '',
        'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', '',
        'JWT_SECRET', 'JWT_TTL_HOURS', '',
        'CORS_ALLOW_ORIGIN',
    ];
    $lines = ['# 7KC backend — generated by install.php on ' . date('c')];
    $fmt = function (string $k, string $v): string {
        // Escape only backslash + double quote — phpdotenv's double-quote
        // semantics. addslashes would also escape single quotes, which
        // phpdotenv keeps literally, corrupting the value.
        if ($v !== '' && preg_match('/[\s"#\\\\]/', $v)) {
            $v = '"' . preg_replace('/(["\\\\])/', '\\\\$1', $v) . '"';
        }
        return "$k=$v";
    };
    foreach ($order as $k) {
        if ($k === '') { $lines[] = ''; continue; }
        if (array_key_exists($k, $env)) $lines[] = $fmt($k, (string)$env[$k]);
    }
    // Anything defaultEnv() carried through from the previous .env
    // (AI_SCAN_*, mail, analytics…) is kept below the managed block.
    $extras = array_diff_key($env, array_flip(array_filter($order)));
    if ($extras) {
        $lines[] = '';
        $lines[] = '# preserved settings';
        foreach ($extras as $k => $v) $lines[] = $fmt((string)$k, (string)$v);
    }
    file_put_contents($path, implode("\n", $lines) . "\n");
}

/**
 * A ready-to-run composer command prefix (already shell-quoted — callers must
 * NOT escapeshell* it again; paths like "C:\Program Files\..." would break).
 */
function findComposer(): ?string
{
    foreach (['composer', 'composer.phar'] as $name) {
        $found = findBinary($name);
        if ($found) return escapeshellarg($found);
    }
    $phar = ROOT . '/composer.phar';
    return file_exists($phar) ? escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($phar) : null;
}

function findBinary(string $name): ?string
{
    $cmd = DIRECTORY_SEPARATOR === '/' ? "which $name 2>/dev/null" : "where $name 2>nul";
    $result = @shell_exec($cmd);
    if (!$result) return null;
    $lines = preg_split('/\r?\n/', trim($result));
    return ($lines && $lines[0] !== '') ? $lines[0] : null;
}

// ---- CLI presentation helpers ----

function cliBanner(): void
{
    cliOut(cliColor("\n  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n", 'accent'));
    cliOut(cliColor("  ┃  7 Day Kitchen — installer                        ┃\n", 'accent'));
    cliOut(cliColor("  ┃  Use what you've got. Eat what you love.          ┃\n", 'dim'));
    cliOut(cliColor("  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n", 'accent'));
}
function cliStep(string $label): void { cliOut("\n" . cliColor("▸ $label", 'accent') . "\n"); }
function cliCheck(string $label, string $detail, string $status): void
{
    $mark = match ($status) {
        'ok' => cliColor('✓', 'green'),
        'warn' => cliColor('!', 'amber'),
        default => cliColor('✗', 'red'),
    };
    cliOut(sprintf("  %s %-28s %s\n", $mark, $label, cliColor($detail, 'dim')));
}
function cliOk(string $m): void { cliOut('  ' . cliColor('✓', 'green') . " $m\n"); }
function cliWarn(string $m): void { cliOut('  ' . cliColor('!', 'amber') . ' ' . cliColor($m, 'amber') . "\n"); }
function cliFatal(string $m): void { cliOut("\n" . cliColor("✗ $m", 'red') . "\n\n"); exit(1); }
function cliOut(string $s): void { echo $s; }
function cliColor(string $s, string $tone): string
{
    $supports = function_exists('stream_isatty') ? @stream_isatty(STDOUT) : false;
    if (!$supports && DIRECTORY_SEPARATOR !== '/') {
        $supports = getenv('WT_SESSION') || getenv('ANSICON') || getenv('TERM') || getenv('TERM_PROGRAM');
    }
    if (!$supports) return $s;
    $c = match ($tone) {
        'green' => "\033[32m", 'amber' => "\033[33m", 'red' => "\033[31m",
        'dim' => "\033[2m", 'accent' => "\033[38;5;208m", default => '',
    };
    return $c . $s . "\033[0m";
}
function cliAsk(string $prompt, string $default = ''): string
{
    if (!empty($GLOBALS['__assume_yes'])) return $default;
    $suffix = $default !== '' ? ' [' . cliColor($default, 'dim') . ']' : '';
    echo "  $prompt$suffix: ";
    $line = fgets(STDIN);
    if ($line === false) return $default;
    $line = trim($line);
    return $line === '' ? $default : $line;
}
function cliAskSecret(string $prompt, string $default = ''): string
{
    if (!empty($GLOBALS['__assume_yes'])) return $default;
    $suffix = $default !== '' ? ' [' . cliColor('••••••', 'dim') . ']' : ' [' . cliColor('blank', 'dim') . ']';
    if (DIRECTORY_SEPARATOR === '/') {
        echo "  $prompt$suffix: ";
        // Restore echo even if the process dies mid-prompt (fatal error, or
        // Ctrl+C when pcntl is available) — otherwise the user's shell is left
        // silently swallowing keystrokes.
        $saved = trim((string)@shell_exec('stty -g 2>/dev/null'));
        $restore = function () use ($saved) {
            @system($saved !== '' ? 'stty ' . escapeshellarg($saved) : 'stty echo');
        };
        register_shutdown_function($restore);
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGINT, function () use ($restore) { $restore(); exit(130); });
        }
        @system('stty -echo');
        $line = fgets(STDIN);
        $restore();
        echo "\n";
    } else {
        // No portable way to mask console input on Windows — be upfront.
        echo '  ' . $prompt . cliColor(' (input will be visible)', 'dim') . "$suffix: ";
        $line = fgets(STDIN);
    }
    if ($line === false) return $default;
    $line = rtrim($line, "\r\n");
    return $line === '' ? $default : $line;
}
function cliRun(string $cmd, string $cwd, bool $verbose): void
{
    // Non-verbose merges stderr into stdout (see captureRun) — reading the two
    // pipes one after the other deadlocks against stderr-chatty children like
    // Composer once the OS pipe buffer fills.
    $desc = $verbose
        ? [0 => STDIN, 1 => STDOUT, 2 => STDERR]
        : [0 => STDIN, 1 => ['pipe', 'w'], 2 => ['redirect', 1]];
    $proc = proc_open($cmd, $desc, $pipes, $cwd);
    if (!is_resource($proc)) cliFatal("Could not run: $cmd");
    $output = '';
    if (!$verbose) {
        $output = (string)stream_get_contents($pipes[1]);
        fclose($pipes[1]);
    }
    $code = proc_close($proc);
    if ($code !== 0) {
        cliOut(cliColor("\n command failed: $cmd\n", 'red'));
        if ($output !== '') cliOut($output . "\n");
        exit($code);
    }
}
