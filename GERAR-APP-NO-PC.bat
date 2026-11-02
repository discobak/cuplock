@echo off
chcp 65001 >nul
title Cuplock - gerando o app
cd /d "%~dp0desktop"
where cargo >nul 2>nul || (echo Instale o Rust: https://rustup.rs & start https://rustup.rs & pause & exit /b)
where npm >nul 2>nul || (echo Instale o Node.js LTS: https://nodejs.org & start https://nodejs.org & pause & exit /b)
echo Instalando ferramentas (primeira vez demora alguns minutos)...
call npm install || (pause & exit /b)
if not exist "..\client\supabase.js" (
  echo Baixando biblioteca do Supabase...
  pushd %TEMP% & mkdir cuplock-sb 2>nul & cd cuplock-sb & call npm init -y >nul & call npm i @supabase/supabase-js@2 --silent
  copy /y node_modules\@supabase\supabase-js\dist\umd\supabase.js "%~dp0client\supabase.js" >nul & popd
)
echo Compilando o Cuplock...
call npx tauri build || (echo. & echo Deu erro. Copie a mensagem acima e mande pro Claude. & pause & exit /b)
echo.
echo PRONTO! O instalador esta em:
echo   desktop\src-tauri\target\release\bundle\nsis\
explorer "src-tauri\target\release\bundle\nsis"
pause
