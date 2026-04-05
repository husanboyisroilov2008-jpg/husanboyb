function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

function ok(body, extraHeaders) {
  return json(200, body, extraHeaders);
}

function badRequest(message, details) {
  return json(400, { message, details });
}

function unauthorized(message = 'Ruxsat yo‘q.') {
  return json(401, { message });
}

function forbidden(message = 'Kirish taqiqlangan.') {
  return json(403, { message });
}

function methodNotAllowed(allowed = ['GET']) {
  return {
    statusCode: 405,
    headers: {
      Allow: allowed.join(', '),
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ message: 'Method not allowed.' })
  };
}

function serverError(error, fallback = 'Server xatoligi yuz berdi.') {
  console.error(error);
  return json(500, { message: fallback });
}

module.exports = {
  ok,
  json,
  badRequest,
  forbidden,
  methodNotAllowed,
  serverError,
  unauthorized
};
