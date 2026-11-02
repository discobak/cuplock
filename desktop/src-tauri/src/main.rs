// Esconde a janela de console no Windows (build de produção).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000; // não pisca janela de console

/// Lista os nomes dos processos em execução (ex: "valorant-win64-shipping.exe"),
/// em minúsculas e sem repetição. O app usa isso para mostrar "Jogando ...".
/// Nada sai do computador além do nome do jogo reconhecido.
#[tauri::command]
fn running_processes() -> Vec<String> {
    let mut names = list_processes();
    names.sort();
    names.dedup();
    names
}

#[cfg(windows)]
fn list_processes() -> Vec<String> {
    let Ok(out) = std::process::Command::new("tasklist")
        .args(["/fo", "csv", "/nh"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    else {
        return Vec::new();
    };
    String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter_map(|line| line.split("\",\"").next())
        .map(|name| name.trim_matches('"').trim().to_lowercase())
        .filter(|name| !name.is_empty())
        .collect()
}

#[cfg(not(windows))]
fn list_processes() -> Vec<String> {
    let Ok(out) = std::process::Command::new("ps").args(["-A", "-o", "comm="]).output() else {
        return Vec::new();
    };
    String::from_utf8_lossy(&out.stdout)
        .lines()
        .map(|l| l.rsplit('/').next().unwrap_or(l).trim().to_lowercase())
        .filter(|n| !n.is_empty())
        .collect()
}

/// Só aceitamos instaladores publicados nos Releases do GitHub.
fn update_url_allowed(url: &str) -> bool {
    url.starts_with("https://github.com/")
        && url.contains("/releases/download/")
        && url.to_lowercase().ends_with("-setup.exe")
        && !url.chars().any(|c| c.is_whitespace() || c == '"' || c == '&' || c == '|' || c == '^' || c == '<' || c == '>')
}

/// Baixa o instalador novo, fecha o app, instala em modo passivo e abre o Cuplock de novo.
#[tauri::command]
async fn install_update(app: tauri::AppHandle, url: String) -> Result<(), String> {
    if !update_url_allowed(&url) {
        return Err("Endereço de atualização não permitido.".into());
    }
    #[cfg(windows)]
    {
        let setup = std::env::temp_dir().join("cuplock-update-setup.exe");
        let _ = std::fs::remove_file(&setup);
        // curl.exe vem com o Windows 10 (1803+) e 11
        let status = std::process::Command::new("curl.exe")
            .args(["-L", "--fail", "--silent", "--show-error", "-o"])
            .arg(&setup)
            .arg(&url)
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .map_err(|e| format!("Não consegui baixar a atualização: {e}"))?;
        if !status.success() || !setup.exists() {
            return Err("Falha ao baixar a atualização. Verifique sua internet.".into());
        }
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        // espera o app fechar, instala (/P = passivo, só barra de progresso) e reabre
        let script = format!(
            "/C timeout /t 2 /nobreak >nul & start \"\" /wait \"{}\" /P & start \"\" \"{}\"",
            setup.display(),
            exe.display()
        );
        std::process::Command::new("cmd")
            .raw_arg(script)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("Não consegui iniciar o instalador: {e}"))?;
        app.exit(0);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = app;
        Err("A atualização automática está disponível só no Windows.".into())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![running_processes, install_update])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Cuplock");
}

#[cfg(test)]
mod tests {
    use super::update_url_allowed;
    #[test]
    fn urls() {
        assert!(update_url_allowed("https://github.com/a/b/releases/download/v2.1.0/Cuplock_2.1.0_x64-setup.exe"));
        assert!(!update_url_allowed("https://evil.com/releases/download/x-setup.exe"));
        assert!(!update_url_allowed("https://github.com/a/b/releases/download/v1/x-setup.exe\" & calc & \""));
        assert!(!update_url_allowed("https://github.com/a/b/raw/x-setup.exe"));
    }
}
