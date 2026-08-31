using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

namespace GastroAppLauncher
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                string projectDir = @"c:\Users\mima7\.gemini\antigravity\scratch\compras-gastos-app\gastro-pwa";
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string nodeDir = Path.Combine(localAppData, @"Programs\nodejs");

                // Configurar proceso CMD para iniciar el servidor
                ProcessStartInfo cmdInfo = new ProcessStartInfo();
                cmdInfo.FileName = "cmd.exe";
                cmdInfo.WorkingDirectory = projectDir;
                cmdInfo.Arguments = string.Format("/k \"title Gastro PWA Server ^& set PATH={0};%PATH% ^& echo ========================================== ^& echo INICIANDO GASTRO PWA MULTI-TENANT ^& echo Servidor: http://localhost:3000 ^& echo ========================================== ^& npm run dev\"", nodeDir);
                cmdInfo.UseShellExecute = true;

                Process.Start(cmdInfo);

                // Esperar 3 segundos para que el servidor inicie y abrir Chrome
                Thread.Sleep(3000);

                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                string chromePathX86 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
                string targetUrl = "http://localhost:3000";

                if (File.Exists(chromePath))
                {
                    Process.Start(chromePath, targetUrl);
                }
                else if (File.Exists(chromePathX86))
                {
                    Process.Start(chromePathX86, targetUrl);
                }
                else
                {
                    Process.Start(new ProcessStartInfo(targetUrl) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al iniciar: " + ex.Message);
                Console.ReadLine();
            }
        }
    }
}
