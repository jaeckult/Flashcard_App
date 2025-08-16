import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'features/auth/data/providers/auth_api_provider.dart';
import 'features/auth/data/repositories/auth_repository.dart';
import 'features/auth/logic/bloc/auth_bloc.dart';
import 'core/constants/api_endpoints.dart';

final GetIt sl = GetIt.instance;

Future<void> init() async {
  // Core
  await _initCore();
  
  // Features
  await _initAuth();
  
  // External
  await _initExternal();
}

Future<void> _initCore() async {
  // Dio for HTTP requests
  sl.registerLazySingleton<Dio>(() {
    final dio = Dio();
    
    // Add interceptors for logging, error handling, etc.
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
    
    return dio;
  });
  
  // SharedPreferences for local storage
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton<SharedPreferences>(() => sharedPreferences);
}

Future<void> _initAuth() async {
  // API Provider
  sl.registerLazySingleton<AuthApiProvider>(
    () => AuthApiProvider(sl<Dio>()),
  );
  
  // Repository
sl.registerLazySingleton<AuthRepository>(
  () => AuthRepository(sl<AuthApiProvider>(), sl<SharedPreferences>()),
  );
  
  // Bloc
  sl.registerFactory<AuthBloc>(
    () => AuthBloc(sl<AuthRepository>()),
  );
}

Future<void> _initExternal() async {
  // Add external dependencies here
  // For example: Google Sign In, Firebase, etc.
}
