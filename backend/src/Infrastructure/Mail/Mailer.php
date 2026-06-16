<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Mail;

/**
 * Optional, flag-gated SMTP mailer. Sends only when a `from` address + a transport
 * (MAIL_DSN or SMTP_HOST) are configured AND symfony/mailer is installed (it's a
 * `suggest`, not a hard dependency). Otherwise it cleanly no-ops + logs, so the app
 * and CI run fine without it. Symfony classes are referenced only on the configured
 * path, so PHP never autoloads them when the package is absent.
 */
final class Mailer
{
    public function __construct(
        private readonly array $config, // dsn, host, port, user, pass, from
        private readonly string $appUrl,
    ) {}

    public function appUrl(): string
    {
        return $this->appUrl;
    }

    public function isConfigured(): bool
    {
        $from = (string)($this->config['from'] ?? '');
        $hasTransport = (string)($this->config['dsn'] ?? '') !== '' || (string)($this->config['host'] ?? '') !== '';
        // appUrl required too: every digest must be able to carry an unsubscribe link.
        return $from !== '' && $this->appUrl !== '' && $hasTransport
            && class_exists(\Symfony\Component\Mailer\Mailer::class);
    }

    public function send(string $to, string $subject, string $text, ?string $html = null): bool
    {
        if (!$this->isConfigured()) {
            error_log(json_encode(['level' => 'info', 'msg' => 'mail_skipped', 'to' => $to, 'subject' => $subject]));
            return false;
        }
        try {
            $transport = \Symfony\Component\Mailer\Transport::fromDsn($this->dsn());
            $mailer = new \Symfony\Component\Mailer\Mailer($transport);
            $email = (new \Symfony\Component\Mime\Email())
                ->from((string)$this->config['from'])
                ->to($to)
                ->subject($subject)
                ->text($text);
            if ($html !== null) $email->html($html);
            $mailer->send($email);
            return true;
        } catch (\Throwable $e) {
            error_log(json_encode(['level' => 'error', 'msg' => 'mail_failed', 'to' => $to, 'error' => $e->getMessage()]));
            return false;
        }
    }

    private function dsn(): string
    {
        $dsn = (string)($this->config['dsn'] ?? '');
        if ($dsn !== '') return $dsn;
        $host = (string)$this->config['host'];
        $port = (int)($this->config['port'] ?? 587);
        $user = rawurlencode((string)($this->config['user'] ?? ''));
        $pass = rawurlencode((string)($this->config['pass'] ?? ''));
        $auth = $user !== '' ? "$user:$pass@" : '';
        return "smtp://{$auth}{$host}:{$port}";
    }
}
