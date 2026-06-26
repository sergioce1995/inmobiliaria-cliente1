// Script para limpiar el puerto 8000 antes de iniciar el servidor
import { exec } from 'child_process';
import { platform } from 'os';

const PORT = 8000;
const isWindows = platform() === 'win32';

console.log(`🔧 Limpiando puerto ${PORT}...`);

if (isWindows) {
  // Windows
  exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
    if (!err && stdout) {
      const lines = stdout.trim().split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== 'PID') {
          console.log(`✅ Terminando proceso ${pid}`);
          exec(`taskkill /PID ${pid} /F`, () => {});
        }
      });
      setTimeout(() => process.exit(0), 2000);
    } else {
      process.exit(0);
    }
  });
} else {
  // macOS / Linux
  exec(`lsof -i :${PORT} | grep LISTEN | awk '{print $2}'`, (err, stdout) => {
    if (!err && stdout) {
      const pid = stdout.trim();
      if (pid) {
        console.log(`✅ Terminando proceso ${pid}`);
        exec(`kill -9 ${pid}`, () => {
          setTimeout(() => process.exit(0), 1000);
        });
      } else {
        process.exit(0);
      }
    } else {
      process.exit(0);
    }
  });
}
