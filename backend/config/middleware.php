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

    // CORS
    $app->add(function (ServerRequestInterface $request, RequestHandlerInterface $handler) use ($settings): ResponseInterface {
        if ($request->getMethod() === 'OPTIONS') {
            $response = new \Slim\Psr7\Response();
        } else {
            $response = $handler->handle($request);
        }
        return $response
            ->withHeader('Access-Control-Allow-Origin', $settings['cors']['origin'])
            ->withHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            ->withHeader('Vary', 'Origin');
    });

    $app->addRoutingMiddleware();

    $errorMiddleware = $app->addErrorMiddleware(
        (bool)$settings['app']['debug'],
        true,
        true
    );
    $errorMiddleware->setDefaultErrorHandler(new ErrorHandler((bool)$settings['app']['debug']));

    // Outermost: tag every request/response with a correlation id (echoed + readable by the error handler).
    $app->add(function (ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface {
        $rid = $request->getHeaderLine('X-Request-Id') ?: bin2hex(random_bytes(8));
        return $handler->handle($request->withHeader('X-Request-Id', $rid))->withHeader('X-Request-Id', $rid);
    });
};
