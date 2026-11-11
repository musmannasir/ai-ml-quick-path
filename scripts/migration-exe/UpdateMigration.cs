// UpdateMigration.exe: refreshes the migration pack (markdown files + source snapshot) from the live project.
// Build (no SDK needed, uses the C# compiler that ships with Windows):
//   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:exe /out:UpdateMigration.exe UpdateMigration.cs
using System;
using System.Diagnostics;
using System.IO;

static class UpdateMigration
{
    const string DefaultProject = @"D:\AI\GuideApp\ai-ml-quick-path-source-2026-11-04";

    static int Main(string[] args)
    {
        string exeDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
        string project = DefaultProject;
        string cfg = Path.Combine(exeDir, "project-path.txt");
        if (File.Exists(cfg))
        {
            string line = File.ReadAllText(cfg).Trim();
            if (line.Length > 0) project = line;
        }
        Console.WriteLine("AI & ML Quick Path - update migration pack");
        Console.WriteLine("Project : " + project);
        Console.WriteLine("Output  : " + exeDir);
        Console.WriteLine();

        string script = Path.Combine(project, "scripts", "migration-sync.mjs");
        if (!File.Exists(script))
        {
            Console.WriteLine("ERROR: cannot find " + script);
            Console.WriteLine("Put the project folder path on the first line of project-path.txt next to this exe.");
            return Finish(2, args);
        }

        string node = FindNode();
        if (node == null)
        {
            Console.WriteLine("ERROR: Node.js (node.exe) was not found. Install Node.js 18 or later and try again.");
            return Finish(3, args);
        }

        var psi = new ProcessStartInfo(node, "\"" + script + "\" --out \"" + exeDir + "\"")
        {
            WorkingDirectory = project,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        using (var p = Process.Start(psi))
        {
            p.OutputDataReceived += (s, e) => { if (e.Data != null) Console.WriteLine(e.Data); };
            p.ErrorDataReceived += (s, e) => { if (e.Data != null) Console.WriteLine("! " + e.Data); };
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
            p.WaitForExit();
            Console.WriteLine();
            Console.WriteLine(p.ExitCode == 0
                ? "Done. Copy this whole folder to the other machine (see 00-README-START-HERE.md)."
                : "FAILED with exit code " + p.ExitCode + ". Nothing was deployed or changed in the lessons.");
            return Finish(p.ExitCode, args);
        }
    }

    static string FindNode()
    {
        string path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string dir in path.Split(';'))
        {
            try
            {
                string c = Path.Combine(dir.Trim().Trim('"'), "node.exe");
                if (File.Exists(c)) return c;
            }
            catch { }
        }
        foreach (string c in new[] { @"C:\nvm4w\nodejs\node.exe", @"C:\Program Files\nodejs\node.exe", @"C:\Program Files (x86)\nodejs\node.exe" })
            if (File.Exists(c)) return c;
        return null;
    }

    static int Finish(int code, string[] args)
    {
        if (Array.IndexOf(args, "--no-pause") < 0)
        {
            Console.WriteLine();
            Console.WriteLine("Press Enter to close.");
            try { Console.ReadLine(); } catch { }
        }
        return code;
    }
}
