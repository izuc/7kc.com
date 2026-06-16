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
        // Never leak internal exception details (SQL, paths) to clients on unexpected errors.
        if (!$isHttp) {
            error_log((string)$exception);
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
