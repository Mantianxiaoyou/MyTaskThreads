' Launcher: double-click to run the app
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
distPath = scriptDir & "\dist\index.html"

If Not fso.FileExists(distPath) Then
    shell.CurrentDirectory = scriptDir
    shell.Run "cmd /c npm run build", 0, True
End If

shell.CurrentDirectory = scriptDir
shell.Run "cmd /c npx electron .", 0, False

Set shell = Nothing
Set fso = Nothing
