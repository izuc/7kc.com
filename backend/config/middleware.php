<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use SevenKC\Infrastructure\Http\ErrorHandler;
use SevenKC\Infrastructure\Http\JsonBodyParserMiddleware;
use Slim\App;

return function (App $app): void {
    $container = $app->getContainer();
    $settings = $container->get('settings');

    $app->add(new JsonBodyParserMiddleware());

    $app->addRoutingMiddleware();

    $errorMiddleware = $app->addErrorMiddleware(
        (bool)$settings['app']['debug'],
        true,
        true
    );
    $errorMiddleware->setDefaultErrorHandler(new ErrorHandler((bool)$settings['app']['debug']));

    // CORS — registered AFTER the error middleware so it WRAPS it (Slim middleware is
    // LIFO). This way a thrown 4xx/5xx response also carries the CORS headers; if CORS
    // sat inside the error middleware, an exception would skip its post-handle code and
    // the SPA couldn't read cross-origin error bodies.
    $app->add(function (ServerRequestInterface $request, RequestHandlerInterface $handler) use ($settings): ResponseInterface {
        if ($request->getMethod() === 'OPTIONS') {
            $response = new \Slim\Psr7\Response();
        } else {
            $response = $handler->handle($request);
        }
        $response = $response
            ->withHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            ->withHeader('Vary', 'Origin');
        // Only advertise an allowed origin when one is actually configured (prod with
        // no CORS_ALLOW_ORIGIN fails closed — never emit an empty/blank ACAO header).
        $origin = (string)$settings['cors']['origin'];
        if ($origin !== '') {
            $response = $response->withHeader('Access-Control-Allow-Origin', $origin);
        }
        return $response;
    });

    // Outermost: tag every request/response with a correlation id (echoed + readable by the error handler).
    $app->add(function (ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface {
        $rid = $request->getHeaderLine('X-Request-Id') ?: bin2hex(random_bytes(8));
        return $handler->handle($request->withHeader('X-Request-Id', $rid))->withHeader('X-Request-Id', $rid);
    });
};
