import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../models/user_model.dart';

class AuthApiProvider {
  final Dio _dio;

  AuthApiProvider(this._dio);

  // Signup with email
  Future<Map<String, dynamic>> signup(String email) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.signup),
        data: {'email': email},
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Set password after email verification
  Future<Map<String, dynamic>> setPassword({
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.setPassword),
        data: {
          'email': email,
          'password': password,
          'confirmPassword': confirmPassword,
        },
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.login),
        data: {
          'email': email,
          'password': password,
        },
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Verify OTP
  Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.verifyOtp),
        data: {
          'email': email,
          'otp': otp,
        },
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Google authentication
  Future<Map<String, dynamic>> googleAuth(String idToken) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.googleAuth),
        data: {'idToken': idToken},
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Get current user
  Future<UserModel> getCurrentUser(String token) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.getFullUrl(ApiEndpoints.me),
        options: Options(headers: ApiEndpoints.getAuthHeaders(token)),
      );
      return UserModel.fromJson(response.data['user']);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Request password reset
  Future<Map<String, dynamic>> requestPasswordReset(String email) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.passwordResetRequest),
        data: {'email': email},
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Reset password
  Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String token,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.passwordReset),
        data: {
          'email': email,
          'token': token,
          'password': password,
          'confirmPassword': confirmPassword,
        },
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _dio.post(
        ApiEndpoints.getFullUrl(ApiEndpoints.logout),
        options: Options(headers: ApiEndpoints.getDefaultHeaders()),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Error handling
  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please check your internet connection.';
      
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final data = e.response?.data;
        
        if (data is Map<String, dynamic> && data.containsKey('error')) {
          return data['error'] as String;
        }
        
        switch (statusCode) {
          case 400:
            return 'Bad request. Please check your input.';
          case 401:
            return 'Unauthorized. Please login again.';
          case 403:
            return 'Forbidden. You don\'t have permission to perform this action.';
          case 404:
            return 'Resource not found.';
          case 500:
            return 'Internal server error. Please try again later.';
          default:
            return 'An error occurred. Please try again.';
        }
      
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      
      case DioExceptionType.connectionError:
        return 'No internet connection. Please check your network.';
      
      case DioExceptionType.badCertificate:
        return 'Certificate error. Please try again.';
      
      case DioExceptionType.unknown:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
