import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_model.dart';
import '../providers/auth_api_provider.dart';

class AuthRepository {
  final AuthApiProvider _apiProvider;
  final SharedPreferences _prefs;

  AuthRepository(this._apiProvider, this._prefs);
  // Token management
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Get stored token
  String? get token => _prefs.getString(_tokenKey);

  // Store token
  Future<void> _storeToken(String token) async {
    await _prefs.setString(_tokenKey, token);
  }

  // Remove token
  Future<void> _removeToken() async {
    await _prefs.remove(_tokenKey);
  }

  // Store user data
  Future<void> _storeUser(UserModel user) async {
    await _prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  // Get stored user
  UserModel? get storedUser {
    final userData = _prefs.getString(_userKey);
    if (userData != null) {
      try {
        // Parse the stored user data
        final jsonData = jsonDecode(userData) as Map<String, dynamic>;
        return UserModel.fromJson(jsonData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Clear stored user
  Future<void> _clearUser() async {
    await _prefs.remove(_userKey);
  }

  // Signup with email
  Future<Map<String, dynamic>> signup(String email) async {
    try {
      final response = await _apiProvider.signup(email);
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Set password after email verification
  Future<Map<String, dynamic>> setPassword({
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      final response = await _apiProvider.setPassword(
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiProvider.login(
        email: email,
        password: password,
      );
      
      // Store token and user data on successful login
      if (response.containsKey('token')) {
        await _storeToken(response['token']);
        
        if (response.containsKey('user')) {
          final user = UserModel.fromJson(response['user']);
          await _storeUser(user);
        }
      }
      
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Verify OTP
  Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _apiProvider.verifyOtp(
        email: email,
        otp: otp,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Google authentication
  Future<Map<String, dynamic>> googleAuth(String idToken) async {
    try {
      final response = await _apiProvider.googleAuth(idToken);
      
      // Store token and user data on successful login
      if (response.containsKey('token')) {
        await _storeToken(response['token']);
        
        if (response.containsKey('user')) {
          final user = UserModel.fromJson(response['user']);
          await _storeUser(user);
        }
      }
      
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Get current user
  Future<UserModel> getCurrentUser() async {
    try {
      final currentToken = token;
      if (currentToken == null) {
        throw Exception('No authentication token found');
      }
      
      final user = await _apiProvider.getCurrentUser(currentToken);
      await _storeUser(user); // Update stored user data
      return user;
    } catch (e) {
      rethrow;
    }
  }

  // Request password reset
  Future<Map<String, dynamic>> requestPasswordReset(String email) async {
    try {
      final response = await _apiProvider.requestPasswordReset(email);
      return response;
    } catch (e) {
      rethrow;
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
      final response = await _apiProvider.resetPassword(
        email: email,
        token: token,
        password: password,
        confirmPassword: confirmPassword,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      // Call logout API if token exists
      final currentToken = token;
      if (currentToken != null) {
        await _apiProvider.logout();
      }
    } catch (e) {
      // Even if API call fails, clear local data
    } finally {
      // Always clear local data
      await _removeToken();
      await _clearUser();
    }
  }

  // Check if user is authenticated
  bool get isAuthenticated => token != null;

  // Get current user from storage (without API call)
  UserModel? get currentUser => storedUser;
}
