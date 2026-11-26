#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|a| a == "--mcp") {
        keyboard_kid_lib::run_mcp_stdio();
        return;
    }
    if args.iter().any(|a| a == "--hook") {
        keyboard_kid_lib::run_hook_cli(&args);
        return;
    }
    keyboard_kid_lib::run();
}
