class ApiEndpoints {
  // Base URL
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Authentication endpoints
  static const String signup = '/signup';
  static const String setPassword = '/signup/set-password';
  static const String login = '/login';
  static const String logout = '/logout';
  static const String verifyOtp = '/verify-otp';
  static const String googleAuth = '/auth/google';
  static const String passwordResetRequest = '/password-reset/request';
  static const String passwordReset = '/password-reset/reset';
  
  // User endpoints
  static const String me = '/me';
  static const String users = '/users';
  
  // Helper methods
  static String getFullUrl(String endpoint) => '$baseUrl$endpoint';
  
  // Headers
  static Map<String, String> getAuthHeaders(String token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
  
  static Map<String, String> getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }
}
