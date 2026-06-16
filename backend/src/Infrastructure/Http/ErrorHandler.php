<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Http;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Exception\HttpException;
use Slim\Interfaces\ErrorHandlerInterface;
use Slim\Psr7\Response;
use Throwable;

final class ErrorHandler implements ErrorHandlerInterface
{
    public function __construct(private readonly bool $debug) {}

    public function __invoke(
        ServerRequestInterface $request,
        Throwable $exception,
        bool $displayErrorDetails,
        bool $logErrors,
        bool $logErrorDetails
    ): ResponseInterface {
        $isHttp = $exception instanceof HttpException;
        $status = $isHttp ? $exception->getCode() : 500;
        // Log server errors (incl. thrown 5xx HttpExceptions) as structured JSON, joinable
        // to the client via X-Request-Id; report to Sentry when configured (no-op otherwise).
        if ($status >= 500) {
            error_log((string)json_encode([
                'level' => 'error',
                'ts' => date('c'),
                'request_id' => $request->getHeaderLine('X-Request-Id'),
                'method' => $request->getMethod(),
                'path' => $request->getUri()->getPath(),
                'status' => $status,
                'error' => get_class($exception),
                'message' => $exception->getMessage(),
            ], JSON_UNESCAPED_SLASHES));
            if (($_ENV['SENTRY_DSN'] ?? '') !== '' && function_exists('Sentry\\captureException')) {
                \Sentry\captureException($exception);
            }
        }
        $body = [
            'error' => match ($status) {
                400 => 'bad_request',
                401 => 'unauthorized',
                403 => 'forbidden',
                404 => 'not_found',
                405 => 'method_not_allowed',
                409 => 'conflict',
                422 => 'unprocessable',
                429 => 'rate_limited',
                default => 'internal_error',
            },
            'message' => $isHttp ? $exception->getMessage() : 'Internal server error',
        ];
        if ($this->debug) {
            if (!$isHttp) $body['detail'] = $exception->getMessage();
            $body['trace'] = explode("\n", $exception->getTraceAsString());
        }
        $resp = new Response($status);
        $resp->getBody()->write(json_encode($body));
        return $resp->withHeader('Content-Type', 'application/json');
    }
}
