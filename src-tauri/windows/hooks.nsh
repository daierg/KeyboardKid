!macro NSIS_HOOK_POSTINSTALL
  ; Remove legacy <=v4.2 autostart registry value if present
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "KuroCatPet"
  ; Default: start KeyboardKid at login (user can still turn off in tray/menu)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "KeyboardKid" '"$INSTDIR\KeyboardKid.exe"'
!macroend
