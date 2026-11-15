cmake_minimum_required(VERSION 3.21)
project(NORDVENT_v17_Native_QML VERSION 17.0 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
find_package(Qt6 6.5 REQUIRED COMPONENTS Core Gui Qml Quick)
qt_standard_project_setup()
add_subdirectory(core)
qt_add_executable(NordventDesktop
    src/main.cpp src/NordventBackend.cpp src/NordventBackend.hpp
)
target_link_libraries(NordventDesktop PRIVATE Qt6::Core Qt6::Gui Qt6::Qml Qt6::Quick nordvent_core)
target_include_directories(NordventDesktop PRIVATE core/include)
# Keep a development console on Windows so failed QML loads are visible in Qt Creator.
# After native sign-off this can be switched to TRUE for a window-only release build.
set_target_properties(NordventDesktop PROPERTIES WIN32_EXECUTABLE FALSE MACOSX_BUNDLE TRUE)
# Copy QML and v17 authored/derived images alongside executable, no qrc or network dependencies.
add_custom_command(TARGET NordventDesktop POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory "${CMAKE_CURRENT_SOURCE_DIR}/qml" "$<TARGET_FILE_DIR:NordventDesktop>/qml"
  COMMAND ${CMAKE_COMMAND} -E copy_directory "${CMAKE_CURRENT_SOURCE_DIR}/assets" "$<TARGET_FILE_DIR:NordventDesktop>/assets"
  COMMENT "Deploy native QML and original v17 imagery")
# Source-only QML/image edits do not relink the executable. Keep its deployed
# runtime copies current on EVERY Build action (not only when C++ relinks).
add_custom_target(NordventSyncRuntime ALL
  COMMAND ${CMAKE_COMMAND} -E copy_directory
      "${CMAKE_CURRENT_SOURCE_DIR}/qml" "$<TARGET_FILE_DIR:NordventDesktop>/qml"
  COMMAND ${CMAKE_COMMAND} -E copy_directory
      "${CMAKE_CURRENT_SOURCE_DIR}/assets" "$<TARGET_FILE_DIR:NordventDesktop>/assets"
  COMMENT "Sync v17 QML, dot routes and animation PNGs even without a C++ relink")
add_dependencies(NordventSyncRuntime NordventDesktop)
# Run C++ controller tests independently of Qt GUI runtime.
include(CTest)
