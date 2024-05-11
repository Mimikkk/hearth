import { ModuleKind, transpile } from 'typescript';

export const resolveScript = async <T>(source: string): Promise<T> => {
  type WorkaroundWindow = Window & { receive<T>(value: T): void };

  const script = document.createElement('script');

  script.type = 'module';
  script.textContent = transpile(source + `;window.receive(output);`, { module: ModuleKind.ESNext });
  document.body.appendChild(script);
  document.body.removeChild(script);

  return new Promise(resolve => ((window as unknown as WorkaroundWindow).receive<T> = resolve));
};
