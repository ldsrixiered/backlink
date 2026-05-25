export function errorHandler(error, request, response, next) {
  console.error(error);
  response.status(error.status || 500).json({
    error: error.message || 'Something went wrong'
  });
}
