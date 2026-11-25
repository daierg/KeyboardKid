#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|a| a == "--mcp") {
        keyboard_kid_lib::run_mcp_stdio();
        return;
    }
    keyboard_kid_lib::run();
}
