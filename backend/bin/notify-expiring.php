<?php
declare(strict_types=1);

// Weekly/daily cron: push a "food expiring soon" notification to subscribed users.
// Optional-dependency gated — no-ops (exit 0) when minishlink/web-push isn't installed
// or VAPID isn't configured, so the cron never alarms on an un-provisioned host.
//
//   php bin/notify-expiring.php

use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\PushSubscriptionRepository;

/** @var \DI\Container $container */
$container = require __DIR__ . '/bootstrap.php';

$push = $container->get('settings')['push'];
$pantry = $container->get(PantryRepository::class);
$subs = $container->get(PushSubscriptionRepository::class);

$configured = $push['public_key'] !== '' && $push['private_key'] !== '' && $push['subject'] !== '';
$haveLib = class_exists(\Minishlink\WebPush\WebPush::class);

$now = time();
$expiringByUser = $pantry->expiringSoonByUser($now, 3);

$subsByUser = [];
foreach ($subs->all() as $s) {
    $subsByUser[$s['user_id']][] = $s;
}
$targets = array_intersect_key($expiringByUser, $subsByUser);

if (!$configured || !$haveLib) {
    fwrite(STDOUT, json_encode([
        'msg' => 'push_skipped', 'lib_installed' => $haveLib, 'vapid_configured' => $configured,
        'users_with_expiring_and_subs' => count($targets),
    ]) . "\n");
    exit(0);
}

$webPush = new \Minishlink\WebPush\WebPush(['VAPID' => [
    'subject' => $push['subject'],
    'publicKey' => $push['public_key'],
    'privateKey' => $push['private_key'],
]]);

$queued = 0;
foreach ($targets as $userId => $items) {
    $n = count($items);
    $payload = json_encode([
        'title' => $n === 1 ? '1 item expiring soon' : "$n items expiring soon",
        'body' => 'Open your pantry to use them up before they go to waste.',
        'tag' => 'pantry-expiry',
        'url' => '/pantry',
    ]);
    foreach ($subsByUser[$userId] as $s) {
        $sub = \Minishlink\WebPush\Subscription::create([
            'endpoint' => $s['endpoint'],
            'publicKey' => $s['p256dh'],
            'authToken' => $s['auth'],
        ]);
        $webPush->queueNotification($sub, $payload);
        $queued++;
    }
}

$expired = 0;
foreach ($webPush->flush() as $report) {
    if (!$report->isSuccess() && $report->isSubscriptionExpired()) {
        $subs->deleteByEndpoint($report->getEndpoint());
        $expired++;
    }
}

fwrite(STDOUT, json_encode(['msg' => 'push_sent', 'queued' => $queued, 'pruned_expired' => $expired]) . "\n");
exit(0);
