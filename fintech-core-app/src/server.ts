import { createApp } from './presentation/app';

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Fintech Core App API ejecutándose exitosamente en http://localhost:${PORT}`);
});