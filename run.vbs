' Create Shell object
Set objShell = CreateObject("WScript.Shell")

' Find script directory
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Set working directory
objShell.CurrentDirectory = scriptDir

' Run the program with the argument silently
objShell.Run """" & "python" & """ " & "server.py", 0, False

' Clean up
Set objShell = Nothing
