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
# The original desktop target continues to run source QML from adjacent folders.
# WebAssembly, however, has no access to the Windows executable's file system.
# Package the SAME QML, JS and PNGs into the Qt resource system for wasm.
if(EMSCRIPTEN)
  # The QML module registers static Qt Quick dependencies needed by wasm.
  qt_policy(SET QTP0001 NEW)
  set(NORDVENT_QML
    qml/Main.qml
    qml/NvButton.qml
    qml/NvFlowDots.qml
    qml/NvIcon.qml
    qml/NvLabel.qml
    qml/NvSlider.qml
    qml/NvVerticalBlinds.qml
    qml/NvV17Routes.js
  )
  foreach(qml_file IN LISTS NORDVENT_QML)
    get_filename_component(qml_name "${qml_file}" NAME)
    set_source_files_properties("${qml_file}" PROPERTIES QT_RESOURCE_ALIAS "${qml_name}")
  endforeach()
  qt_add_qml_module(NordventDesktop
    URI Nordvent VERSION 1.0
    NO_CACHEGEN
    QML_FILES ${NORDVENT_QML}
  )
  # QML resource URL: qrc:/qt/qml/Nordvent/Main.qml
  # Relative ../assets resolves to qrc:/qt/qml/assets as on desktop.
  file(GLOB_RECURSE NORDVENT_ASSETS CONFIGURE_DEPENDS
    "${CMAKE_CURRENT_SOURCE_DIR}/assets/*.png")
  qt_add_resources(NordventDesktop "nordvent_artwork"
    PREFIX "/qt/qml"
    BASE "${CMAKE_CURRENT_SOURCE_DIR}"
    FILES ${NORDVENT_ASSETS}
  )
else()
  # Native Qt desktop stays source-editable without rebuilding C++.
  add_custom_command(TARGET NordventDesktop POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory "${CMAKE_CURRENT_SOURCE_DIR}/qml" "$<TARGET_FILE_DIR:NordventDesktop>/qml"
    COMMAND ${CMAKE_COMMAND} -E copy_directory "${CMAKE_CURRENT_SOURCE_DIR}/assets" "$<TARGET_FILE_DIR:NordventDesktop>/assets"
    COMMENT "Deploy native QML and original v17 imagery")
  add_custom_target(NordventSyncRuntime ALL
    COMMAND ${CMAKE_COMMAND} -E copy_directory
      "${CMAKE_CURRENT_SOURCE_DIR}/qml" "$<TARGET_FILE_DIR:NordventDesktop>/qml"
    COMMAND ${CMAKE_COMMAND} -E copy_directory
      "${CMAKE_CURRENT_SOURCE_DIR}/assets" "$<TARGET_FILE_DIR:NordventDesktop>/assets"
    COMMENT "Sync v17 QML and animation PNGs even without a C++ relink")
  add_dependencies(NordventSyncRuntime NordventDesktop)
endif()
# Run C++ controller tests independently of Qt GUI runtime.
include(CTest)
