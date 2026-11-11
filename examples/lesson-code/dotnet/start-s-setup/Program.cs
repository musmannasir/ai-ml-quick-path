// From lesson 's-setup' (start). Code status: Python executed 2026-11-02 (quickpath.py env); C# not compiled (no .NET SDK in the build environment)
using System.Runtime.InteropServices;
Console.WriteLine($".NET {Environment.Version} on {RuntimeInformation.OSDescription}");
Console.WriteLine($"CPU cores: {Environment.ProcessorCount}");
Console.WriteLine($"ML.NET loaded: {typeof(Microsoft.ML.MLContext).Assembly.GetName().Version}");
