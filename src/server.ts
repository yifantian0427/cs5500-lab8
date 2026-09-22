import { app } from './app.js';

const configuredPort: number = Number(process.env.PORT ?? 3000);
const port: number =
  Number.isInteger(configuredPort) &&
  configuredPort > 0 &&
  configuredPort < 65536
    ? configuredPort
    : 3000;

app.listen(port, (): void => {
  process.stdout.write(`CampusHub API listening on port ${port}\n`);
});
